"""
Input validation and sanitization utilities
"""

import re
import os
from datetime import datetime


def validate_amount(amount):
    """Validate that amount is a positive number"""
    try:
        val = float(amount)
        return val > 0
    except (ValueError, TypeError):
        return False


def validate_date(date_str):
    """Validate that date is in valid format (YYYY-MM-DD)"""
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False


def validate_category(category, valid_categories):
    """Validate that category is in allowed list"""
    return category in valid_categories


def validate_payment_method(method, valid_methods):
    """Validate that payment method is in allowed list"""
    return method in valid_methods


def validate_description(description, min_length=2):
    """Validate description length"""
    if not description or not isinstance(description, str):
        return False
    return len(description.strip()) >= min_length


def sanitize_string(text):
    """Remove potentially harmful characters from string"""
    if not isinstance(text, str):
        return ""
    # Remove HTML tags
    text = re.sub(r'<[^>]*>', '', text)
    # Remove SQL injection attempts
    text = re.sub(r'[;\'"]', '', text)
    return text.strip()


def sanitize_filename(filename):
    """Sanitize filename for safe storage"""
    # Remove path separators and special characters
    filename = os.path.basename(filename)
    # Replace spaces and special chars
    filename = re.sub(r'[^\w\-\.]', '_', filename)
    # Remove multiple consecutive underscores
    filename = re.sub(r'_+', '_', filename)
    return filename


def validate_file_upload(file, allowed_extensions=['jpg', 'jpeg', 'png', 'pdf'], max_size_mb=3):
    """Validate uploaded file"""
    if not file:
        return False, "No file provided"
    
    # Check file extension
    if '.' not in file.filename:
        return False, "Invalid file name"
    
    ext = file.filename.rsplit('.', 1)[1].lower()
    if ext not in allowed_extensions:
        return False, f"File type not allowed. Allowed: {', '.join(allowed_extensions)}"
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell() / (1024 * 1024)  # Convert to MB
    file.seek(0)
    
    if file_size > max_size_mb:
        return False, f"File too large. Maximum {max_size_mb}MB allowed"
    
    return True, "OK"


def escape_html(text):
    """Escape HTML special characters"""
    if not isinstance(text, str):
        return ""
    replacements = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    return text
