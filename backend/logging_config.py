# backend\logging_config.py

"""
# Precision File Search
# Copyright (c) 2025 Ali Kazemi
# Licensed under MPL 2.0
# This file is part of a derivative work and must retain this notice.

Configures the logging setup for the entire backend application.

This module is responsible for establishing a centralized logging system that
directs log messages to both the console and a rotating file. It should be
imported and its `setup_logging` function should be called once at the very
beginning of the application's lifecycle.

Key Features:
- **Centralized & Parameterized Setup:** The `setup_logging` function configures
  the root logger based on a provided level (e.g., "INFO", "DEBUG").
- **Console and File Output:** Handlers for both console and file output are
  configured with the specified logging level.
- **Detailed Formatting:** A custom log format provides invaluable debugging info.
- **Idempotent:** The setup function prevents duplicate handlers if called more
  than once.
"""

# 1. IMPORTS ####################################################################################################
import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from .config_manager import DATA_FOLDER

# 2. CONSTANTS & SETUP ##########################################################################################
LOG_DIR = os.path.join(DATA_FOLDER, "logs") # Use the user-specific data folder

os.makedirs(LOG_DIR, exist_ok=True)

LOG_FILE = os.path.join(LOG_DIR, "app.log")


# Dictionary to map log level strings to logging constants
LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}

# Default logging level if none is specified. Can be changed here.
DEFAULT_LOG_LEVEL = "INFO"

# 3. LOGGING CONFIGURATION FUNCTION #############################################################################
def setup_logging(level: str = DEFAULT_LOG_LEVEL):
    """
    Configures the root logger for the entire application with console and
    rotating file handlers based on the specified level.

    Args:
        level (str): The desired logging level as a string (e.g., "DEBUG", "INFO").
                     Defaults to DEFAULT_LOG_LEVEL.
    """
    # Sanitize and validate the provided log level string
    log_level_str = level.upper()
    numeric_level = LOG_LEVELS.get(log_level_str, LOG_LEVELS[DEFAULT_LOG_LEVEL])

    log_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - [%(name)s:%(funcName)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    root_logger = logging.getLogger()
    # Clear any existing handlers to ensure a clean setup
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    root_logger.setLevel(numeric_level)

    # --- Console Handler ---
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(log_formatter)

    # --- Rotating File Handler ---
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(numeric_level)
    file_handler.setFormatter(log_formatter)

    # --- Add Handlers to Root Logger ---
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    # Log the initial configuration status
    initial_logger = logging.getLogger(__name__)
    initial_logger.info(f"Logging configured successfully with {log_level_str} level verbosity.")
    if numeric_level == logging.DEBUG:
        initial_logger.debug(f"Log file location: {os.path.abspath(LOG_FILE)}")
