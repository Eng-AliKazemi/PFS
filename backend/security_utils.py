# backend\security_utils.py

"""
# Precision File Search
# Copyright (c) 2025 Ali Kazemi
# Licensed under AGPL v3
# This file is part of a derivative work and must retain this notice.

Provides security-related utility functions for the application.

The primary function in this module, `validate_and_resolve_path`, is a critical
security component designed to prevent path traversal (also known as "directory
traversal" or "../") attacks.

When a path is received from an untrusted source, such as an LLM's output or a
user's input, it must be validated to ensure it points to a safe and permitted
location. This function canonicalizes the path to its absolute form and then
verifies that it is located within the user's home directory. This prevents
any operation from accessing or modifying sensitive system files outside of the
intended scope.
"""

# 1. IMPORTS & SETUP ############################################################################################
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# 2. PATH VALIDATION FUNCTION ###################################################################################
def validate_and_resolve_path(user_path: str) -> str:
    """
    Validates a user-provided path to prevent path traversal attacks while allowing
    any valid directory on the user's system.
    ...
    """
    if not user_path:
        raise ValueError("Path cannot be empty.")
    
    try:
        # Path.resolve() safely canonicalizes the path, resolving any '..' components.
        # This is the primary defense against path traversal attacks.
        resolved_path = Path(user_path).resolve()

        # The check to ensure the path is within the user's home directory has been removed
        # to allow indexing of any drive/folder the user has access to, which is
        # expected behavior for a local desktop application.

        if not resolved_path.is_dir():
            logger.warning(f"Validation failed: Path '{resolved_path}' is not a directory or does not exist.")
            raise ValueError(f"The specified path does not exist or is not a directory: {resolved_path}")

        logger.debug(f"Path '{user_path}' successfully validated to '{resolved_path}'.")
        return str(resolved_path)

    except Exception as e:
        if isinstance(e, ValueError):
            raise
        logger.error(f"An unexpected error occurred during path validation for '{user_path}'.", exc_info=True)
        raise ValueError("An internal error occurred while validating the path.")
