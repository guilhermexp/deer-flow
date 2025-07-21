# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import logging
import os
import subprocess
import uuid
import shlex
from pathlib import Path

from src.ppt.graph.state import PPTState

logger = logging.getLogger(__name__)


def ppt_generator_node(state: PPTState):
    logger.info("Generating ppt file...")
    # use marp cli to generate ppt file
    # https://github.com/marp-team/marp-cli?tab=readme-ov-file
    
    # Validate input file path
    input_path = Path(state["ppt_file_path"])
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    # Ensure input path is within allowed directory
    allowed_dir = Path(os.getcwd()) / "temp"
    allowed_dir.mkdir(exist_ok=True)
    
    # Resolve to absolute path and check if it's within allowed directory
    input_path = input_path.resolve()
    if not str(input_path).startswith(str(allowed_dir.resolve())):
        raise ValueError(f"Input file must be within {allowed_dir}")
    
    # Generate safe output path
    output_filename = f"generated_ppt_{uuid.uuid4()}.pptx"
    generated_file_path = allowed_dir / output_filename
    
    try:
        # Use subprocess with shell=False and proper argument list
        result = subprocess.run(
            ["marp", str(input_path), "-o", str(generated_file_path)],
            capture_output=True,
            text=True,
            check=True,
            shell=False  # Explicitly set shell=False for security
        )
        
        if result.stderr:
            logger.warning(f"Marp warnings: {result.stderr}")
            
    except subprocess.CalledProcessError as e:
        logger.error(f"Marp command failed: {e.stderr}")
        raise RuntimeError(f"Failed to generate PPT: {e.stderr}")
    except FileNotFoundError:
        logger.error("Marp CLI not found. Please install it first.")
        raise RuntimeError("Marp CLI is not installed")
    
    # Safely remove the temp file
    try:
        if input_path.exists():
            input_path.unlink()
    except Exception as e:
        logger.warning(f"Failed to remove temp file: {e}")
    
    logger.info(f"generated_file_path: {generated_file_path}")
    return {"generated_file_path": str(generated_file_path)}
