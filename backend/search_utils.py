# backend\search_utils.py

"""
# Precision File Search
# Copyright (c) 2025 Ali Kazemi
# Licensed under AGPL v3
# This file is part of a derivative work and must retain this notice.

Provides utility functions for classic file system searches.

This module contains the logic for performing traditional, non-AI searches based
on file or folder names. It is designed to be called by other parts of the
backend, particularly the AI search pipeline when a 'classic_filename'
strategy is chosen.

The main function, `perform_classic_search`, uses wildcard matching (`fnmatch`)
to efficiently find items that match a given pattern within a directory tree,
respecting configured exclusion rules.
"""

# 1. IMPORTS & SETUP ############################################################################################
import os
import asyncio
import fnmatch
import logging
from typing import List, Set
from .config_manager import get_config

logger = logging.getLogger(__name__)

DEFAULT_EXCLUDED_FOLDERS: Set[str] = set(get_config("excluded_folders"))

# 2. CORE SEARCH FUNCTION #######################################################################################
async def perform_classic_search(search_path: str, keywords: List[str], search_type: str, case_sensitive: bool = False) -> List[str]:
    """
    Performs a classic file/folder search using wildcard matching.

    This is an asynchronous function that runs the blocking `os.walk` in a separate
    thread to avoid blocking the event loop.

    Args:
        search_path: The root directory to start the search from.
        keywords: A list containing a single search pattern (e.g., "*.txt").
        search_type: Either "file_name" or "folder_name".
        case_sensitive: Whether the pattern matching should be case-sensitive.

    Returns:
        A list of full paths to the found files or folders.
    """
    found_items = []
    pattern = keywords[0] if keywords else '*'
    
    logger.debug(
        f"Performing classic search in '{search_path}' for pattern '{pattern}' "
        f"(type: {search_type}, case_sensitive: {case_sensitive})"
    )

    def is_match_sync(text: str) -> bool:
        if not case_sensitive:
            return fnmatch.fnmatch(text.lower(), pattern.lower())
        else:
            return fnmatch.fnmatch(text, pattern)

    loop = asyncio.get_event_loop()
    def walk_and_search():
        if not os.path.isdir(search_path):
            logger.warning(f"Classic search path '{search_path}' does not exist or is not a directory.")
            return

        for dirpath, dirnames, filenames in os.walk(search_path, topdown=True):
            dirnames[:] = [d for d in dirnames if d not in DEFAULT_EXCLUDED_FOLDERS and not d.startswith('.')]

            if search_type == "folder_name":
                for dirname in dirnames:
                    if is_match_sync(dirname):
                        found_items.append(os.path.join(dirpath, dirname))
            elif search_type == "file_name":
                for filename in filenames:
                    if is_match_sync(filename):
                        found_items.append(os.path.join(dirpath, filename))

    await loop.run_in_executor(None, walk_and_search)
    logger.info(f"Classic search found {len(found_items)} items for pattern '{pattern}'.")
    return found_items