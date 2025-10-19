# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os

import magic
from fastapi import HTTPException, UploadFile, status


class FileValidator:
    """Validates uploaded files for security and constraints"""

    # Safe file extensions for documents
    ALLOWED_EXTENSIONS: set[str] = {
        'txt', 'pdf', 'doc', 'docx', 'md', 'rtf',
        'odt', 'html', 'htm', 'csv', 'json', 'xml'
    }

    # MIME types corresponding to allowed extensions
    ALLOWED_MIME_TYPES: set[str] = {
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/markdown',
        'application/rtf',
        'application/vnd.oasis.opendocument.text',
        'text/html',
        'text/csv',
        'application/json',
        'application/xml',
        'text/xml'
    }

    # Maximum file size (10 MB by default)
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10 MB

    @classmethod
    def validate_file_extension(cls, filename: str) -> str:
        """Validate file extension and return it"""
        if not filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename is required"
            )

        # Extract extension
        parts = filename.rsplit('.', 1)
        if len(parts) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must have an extension"
            )

        extension = parts[1].lower()

        if extension not in cls.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(cls.ALLOWED_EXTENSIONS)}"
            )

        return extension

    @classmethod
    def validate_file_size(cls, file_size: int) -> None:
        """Validate file size"""
        if file_size > cls.MAX_FILE_SIZE:
            max_size_mb = cls.MAX_FILE_SIZE / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {max_size_mb} MB"
            )

    @classmethod
    def validate_mime_type(cls, file_content: bytes, filename: str) -> str:
        """Validate MIME type using python-magic"""
        try:
            # Use python-magic to detect actual MIME type
            mime = magic.Magic(mime=True)
            detected_mime = mime.from_buffer(file_content)

            if detected_mime not in cls.ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File content type '{detected_mime}' not allowed"
                )

            return detected_mime

        except Exception:
            # If magic fails, fall back to extension-based validation
            extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            if extension not in cls.ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unable to validate file type"
                )
            return "application/octet-stream"

    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """Sanitize filename to prevent path traversal attacks"""
        # Remove any path components
        filename = os.path.basename(filename)

        # Remove potentially dangerous characters
        dangerous_chars = ['..', '/', '\\', '\x00', '\n', '\r', '\t']
        for char in dangerous_chars:
            filename = filename.replace(char, '')

        # Limit filename length
        max_length = 255
        if len(filename) > max_length:
            name, ext = filename.rsplit('.', 1)
            filename = f"{name[:max_length-len(ext)-1]}.{ext}"

        return filename

    @classmethod
    async def validate_upload(cls, file: UploadFile) -> tuple[bytes, str, str]:
        """
        Comprehensive file validation
        Returns: (file_content, sanitized_filename, mime_type)
        """
        # Validate filename and extension
        filename = file.filename or "unnamed_file"
        extension = cls.validate_file_extension(filename)
        sanitized_filename = cls.sanitize_filename(filename)

        # Read file content
        file_content = await file.read()

        # Reset file pointer for potential re-reading
        await file.seek(0)

        # Validate file size
        cls.validate_file_size(len(file_content))

        # Validate MIME type
        mime_type = cls.validate_mime_type(file_content, filename)

        return file_content, sanitized_filename, mime_type


# Configuration functions
def set_max_file_size(size_bytes: int) -> None:
    """Set maximum allowed file size in bytes"""
    FileValidator.MAX_FILE_SIZE = size_bytes

def add_allowed_extension(extension: str, mime_type: str | None = None) -> None:
    """Add a new allowed file extension and optionally its MIME type"""
    FileValidator.ALLOWED_EXTENSIONS.add(extension.lower())
    if mime_type:
        FileValidator.ALLOWED_MIME_TYPES.add(mime_type)
