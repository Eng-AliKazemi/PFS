# backend/app_logic.py

"""
# Precision File Search
# Copyright (c) 2025 Ali Kazemi
# Licensed under AGPL v3
# This file is part of a derivative work and must retain this notice.

Handles the core business logic for the Precision File Search application.

This module contains the primary functions for running the document content 
classifier and extracting text from various file formats. It operates 
independently of the web server's API endpoints, focusing on the backend tasks.

The "classic" file search functionality is now delegated to the high-performance
FileSearchEngine.
"""

# 1. IMPORTS ####################################################################################################
import os
import sqlite3
from pathlib import Path
from typing import List, Set, Dict, Any
import joblib as ml
import logging
from .config_manager import get_config, DATA_FOLDER
# --- NEW: Import the high-performance engine and its text extraction utility ---
from .file_engine import FileSearchEngine, extract_text_from_file

# 2. SETUP & CONSTANTS ##########################################################################################
logger = logging.getLogger(__name__)

DB_FILE = os.path.join(DATA_FOLDER, "classifier_results.db")
CLASSIFIER_MODEL_PATH = os.path.join(DATA_FOLDER, "document_classifier.ml")

# 3. INITIALIZATION #############################################################################################
try:
    CLASSIFIER_MODEL = ml.load(CLASSIFIER_MODEL_PATH)
    logger.info("Document classifier model loaded successfully.")
except FileNotFoundError:
    CLASSIFIER_MODEL = None
    logger.warning(f"'{CLASSIFIER_MODEL_PATH}' not found. Classification feature will be disabled.")

DEFAULT_EXCLUDED_FOLDERS: Set[str] = set(get_config("excluded_folders"))
DEFAULT_FILE_EXTENSIONS: List[str] = get_config("file_extensions")
AI_SEARCH_PARAMS: Dict[str, Any] = get_config("ai_search_params")

# --- FIX: Renamed 'file_engine' to 'FILE_SEARCH_ENGINE' to match the call in routes.py ---
FILE_SEARCH_ENGINE = FileSearchEngine(
    default_excluded_folders=DEFAULT_EXCLUDED_FOLDERS,
    default_file_extensions=DEFAULT_FILE_EXTENSIONS
)

# 4. GLOBAL STATE & CATEGORIES ##################################################################################
classifier_status = {"status": "idle", "progress": 0, "total": 0, "current_file": ""}
trainer_status = {"status": "idle", "log": [], "accuracy": None}

# --- UPDATED: Get file categories directly from the engine instance ---
FILE_CATEGORIES = FILE_SEARCH_ENGINE.file_categories

# 5. CORE LOGIC FUNCTIONS #######################################################################################

# The `extract_text_from_file` function is now cleanly imported from file_engine.py
# This avoids code duplication.

def run_classification_task(search_path: str):
    """
    Scans a directory, classifies files using a loaded ML model, and stores
    results in an SQLite database. This function remains unchanged.
    """
    global classifier_status
    if CLASSIFIER_MODEL is None:
        classifier_status['status'] = 'error'
        classifier_status['current_file'] = 'Classifier model not loaded.'
        logger.error("Classification task started but CLASSIFIER_MODEL is not loaded.")
        return

    classifier_status = {"status": "running", "progress": 0, "total": 0, "current_file": "Initializing..."}
    logger.info(f"Starting classification task for path: {search_path}")
    conn = None
    try:
        files_to_scan = [
            Path(dirpath) / filename
            for dirpath, dirnames, filenames in os.walk(search_path, topdown=True)
            for filename in filenames
            if not any(d in Path(dirpath).parts for d in DEFAULT_EXCLUDED_FOLDERS) and not any(part.startswith('.') for part in Path(dirpath).parts)
        ]
        
        classifier_status['total'] = len(files_to_scan)
        logger.info(f"Found {len(files_to_scan)} files to classify.")
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        for i, file_path in enumerate(files_to_scan):
            classifier_status['progress'] = i + 1
            classifier_status['current_file'] = str(file_path.name)
            
            try:
                mod_time = file_path.stat().st_mtime
                cursor.execute("SELECT modified_time FROM classified_files WHERE path = ?", (str(file_path),))
                result = cursor.fetchone()
                
                if result and result[0] == mod_time:
                    logger.debug(f"Skipping unmodified file: {file_path}")
                    continue
                    
                text = extract_text_from_file(file_path)
                if text and len(text) > 50:
                    prediction = CLASSIFIER_MODEL.predict([text])[0]
                    cursor.execute("INSERT OR REPLACE INTO classified_files (path, tag, modified_time) VALUES (?, ?, ?)", (str(file_path), prediction, mod_time))
            except Exception:
                logger.warning(f"Skipping file {file_path} due to processing error.", exc_info=True)
                continue
        conn.commit()
        logger.info("Classification task finished successfully.")
    except Exception:
        logger.exception("The main classifier task failed unexpectedly.")
        classifier_status['status'] = 'error'
        classifier_status['current_file'] = 'An error occurred during classification.'
    finally:
        if conn:
            conn.close()
        classifier_status['status'] = 'complete'
        classifier_status['current_file'] = 'Finished!'

# --- REPLACED: The old, inefficient run_search function is replaced by this clean wrapper ---
async def run_search(websocket, search_id: str, req):
    """
    Delegates the classic file/folder search to the high-performance file engine.
    """
    # Ensure the engine instance is using the latest settings from the config.
    # This is important if the user changes settings at runtime.
    # --- FIX: Update the correctly named instance ---
    FILE_SEARCH_ENGINE.default_excluded_folders = DEFAULT_EXCLUDED_FOLDERS
    FILE_SEARCH_ENGINE.default_file_extensions = DEFAULT_FILE_EXTENSIONS
    
    logger.info(f"Delegating classic search (ID: {search_id}) to high-performance engine.")
    # --- FIX: Call the correctly named instance ---
    await FILE_SEARCH_ENGINE.run_search(websocket, search_id, req)