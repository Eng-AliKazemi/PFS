# backend/rag_pipeline.py

"""
# Precision File Search
# Copyright (c) 2025 Ali Kazemi
# Licensed under MPL 2.0
# This file is part of a derivative work and must retain this notice.

Manages the core components of the Retrieval-Augmented Generation (RAG) pipeline.

This module is responsible for initializing and managing the machine learning
models required for advanced semantic search features, specifically the embedding
model and the reranker (cross-encoder) model. It abstracts away the complexities
of loading these models onto the appropriate hardware (CPU, CUDA, MPS).

Key functionalities include:
- `initialize_embedding_model`: Loads a sentence-transformer model from
  HuggingFace, which is used to convert text documents and queries into
  numerical vectors for semantic comparison.
- `initialize_reranker_model`: Loads a cross-encoder model and its tokenizer,
  used to perform a more computationally intensive but accurate relevance
  scoring of the top documents retrieved by the initial vector search.
- `rerank_retrieved_documents`: Takes a query and a list of documents and uses
  the loaded cross-encoder to re-order them based on semantic relevance.
- `get_torch_device`: A utility function that intelligently detects and selects
  the best available PyTorch device (CUDA, MPS, or CPU) for running the models,
  while respecting user configuration.
"""

# 1. IMPORTS ####################################################################################################
import torch
import logging
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from langchain_huggingface import HuggingFaceEmbeddings
from typing import List, Dict, Any, Optional, Tuple

# Import this to handle the cache directory
from huggingface_hub import snapshot_download

# 2. SETUP & UTILITIES ##########################################################################################
logger = logging.getLogger(__name__)

def get_torch_device(configured_device: str = "auto") -> str:
    """Determines the optimal torch device (CUDA, MPS, CPU) for model loading."""
    configured_device = configured_device.lower().strip()
    logger.debug(f"Requesting device: '{configured_device}'")

    if configured_device == "cuda" and torch.cuda.is_available():
        logger.info("CUDA device selected by user and is available.")
        return "cuda"
    if configured_device == "mps" and hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        logger.info("MPS device selected by user and is available.")
        return "mps"
    if configured_device == "cpu":
        logger.info("CPU device selected by user.")
        return "cpu"

    if torch.cuda.is_available():
        logger.info("Auto-detected and selected CUDA device.")
        return "cuda"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        logger.info("Auto-detected and selected MPS device.")
        return "mps"

    logger.info("No GPU detected, falling back to CPU.")
    return "cpu"


def ensure_model_is_downloaded(model_name: str, model_type: str) -> None:
    """
    Checks if a Hugging Face model is cached locally and downloads it if not.
    Provides clear logging for the user during the download.

    Args:
        model_name (str): The name of the model on the Hugging Face Hub (e.g., "BAAI/bge-small-en-v1.5").
        model_type (str): A human-readable name for logging (e.g., "Embedding Model").
    """
    if not model_name:
        logger.warning(f"{model_type}: No model name provided. Skipping.")
        return

    try:
        # This function will check the cache first. If the model is present, it does nothing and returns instantly.
        # If not, it will download the model and show a progress bar in the console.
        logger.info(f"Verifying {model_type} '{model_name}'...")

        # --- MODIFIED: Added force_download and resume_download parameters as requested ---
        # NOTE: force_download=True is generally for debugging and will re-download models on every app start.
        snapshot_download(
            repo_id=model_name,
            force_download=True,
            resume_download=False
        )
        # --- END OF MODIFICATION ---

        logger.info(f"{model_type} '{model_name}' is available locally.")

    except Exception as e:
        logger.critical(
            f"Failed to download or verify {model_type} '{model_name}'. "
            f"Please check your internet connection and the model name. Error: {e}",
            exc_info=True
        )
        # We raise the exception to stop the initialization process if a critical model fails.
        raise RuntimeError(f"Could not acquire required model: {model_name}") from e


# 3. INITIALIZATION FUNCTIONS ###################################################################################
def initialize_embedding_model(model_name: str, device: str) -> Optional[HuggingFaceEmbeddings]:
    """Initializes and returns the sentence-transformer model for embeddings."""
    if not model_name:
        logger.warning("No embedding model name provided in config. Semantic-based features will be disabled.")
        return None

    try:
        # Call the verification function before trying to load
        ensure_model_is_downloaded(model_name, "Embedding Model")

        logger.info(f"Loading embedding model: {model_name} on device: {device}")
        model_kwargs = {'device': device}
        encode_kwargs = {'normalize_embeddings': True}
        embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs=model_kwargs,
            encode_kwargs=encode_kwargs,
            cache_folder=None # This forces it to use the default HF cache we just verified
        )
        logger.info("Embedding model loaded successfully.")
        return embeddings
    except Exception:
        logger.critical(f"Failed to load embedding model '{model_name}'. Semantic features will be unavailable.", exc_info=True)
        return None

def initialize_reranker_model(model_name: str, device: str) -> Optional[Tuple]:
    """Initializes and returns the cross-encoder model and tokenizer for reranking."""
    if not model_name:
        logger.warning("No reranker model name provided in config. Reranker will be disabled.")
        return None

    try:
        # Call the verification function before trying to load
        ensure_model_is_downloaded(model_name, "Reranker Model")

        logger.info(f"Loading reranker model: {model_name} on device: {device}")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSequenceClassification.from_pretrained(model_name).to(device)
        model.eval()
        logger.info("Reranker model loaded successfully.")
        return tokenizer, model, device
    except Exception:
        logger.error(f"Failed to load reranker model '{model_name}'. Reranking will be unavailable.", exc_info=True)
        return None

# 4. RERANKING LOGIC ############################################################################################
def rerank_retrieved_documents(query: str, documents: List[Dict[str, Any]], reranker_components: tuple) -> List[Dict[str, Any]]:
    """
    Reranks documents based on relevance to a query using a cross-encoder.
    """
    if not reranker_components:
        logger.warning("Rerank called but no reranker components available. Returning original document order.")
        return documents

    tokenizer, model, device = reranker_components
    logger.debug(f"Reranking {len(documents)} documents for query: '{query[:50]}...'")

    pairs = [[query, doc["chunk"]] for doc in documents]

    with torch.no_grad():
        inputs = tokenizer(pairs, padding=True, truncation=True, return_tensors="pt", max_length=512).to(device)
        scores = model(**inputs, return_dict=True).logits.view(-1).float()
        scores_sigmoid = torch.sigmoid(scores).cpu().numpy()

    for doc, score in zip(documents, scores_sigmoid):
        doc["rerank_score"] = float(score)

    documents.sort(key=lambda x: x["rerank_score"], reverse=True)

    logger.debug("Reranking complete.")
    return documents
