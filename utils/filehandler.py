"""
File handling utilities for receipts and uploads
"""

import os
import uuid
from datetime import datetime
from .validators import sanitize_filename, validate_file_upload


UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads')


def ensure_upload_folder():
    """Ensure upload folder exists"""
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def save_uploaded_file(file):
    """
    Save uploaded file safely
    Returns: (success, filepath or error_message)
    """
    ensure_upload_folder()
    
    # Validate file
    is_valid, message = validate_file_upload(file)
    if not is_valid:
        return False, message
    
    # Sanitize and rename file
    original_name = sanitize_filename(file.filename)
    ext = original_name.rsplit('.', 1)[1].lower()
    
    # Generate unique filename
    unique_name = f"{uuid.uuid4()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, unique_name)
    
    try:
        file.save(filepath)
        # Return relative path for storing in database
        return True, f"/static/uploads/{unique_name}"
    except Exception as e:
        return False, f"Failed to save file: {str(e)}"


def delete_file(filepath):
    """Delete uploaded file"""
    if not filepath:
        return True, "No file to delete"
    
    full_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), filepath.lstrip('/'))
    
    try:
        if os.path.exists(full_path):
            os.remove(full_path)
        return True, "File deleted"
    except Exception as e:
        return False, f"Failed to delete file: {str(e)}"


def get_file_thumbnail(filepath):
    """Get thumbnail path for image files"""
    if not filepath:
        return None
    return filepath  # In production, could generate actual thumbnails
