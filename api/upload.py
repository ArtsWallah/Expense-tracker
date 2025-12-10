"""
API endpoint for file uploads
"""

from flask import Blueprint, request, jsonify
from utils.filehandler import save_uploaded_file, delete_file
from utils.validators import validate_file_upload

upload_bp = Blueprint('upload', __name__, url_prefix='/api/upload')


@upload_bp.route('/receipt', methods=['POST'])
def upload_receipt():
    """Upload receipt file"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Validate and save
        success, result = save_uploaded_file(file)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'File uploaded successfully',
                'filepath': result
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': result
            }), 400
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Upload failed: {str(e)}"
        }), 500


@upload_bp.route('/delete', methods=['POST'])
def delete_receipt():
    """Delete uploaded file"""
    try:
        data = request.get_json()
        filepath = data.get('filepath')
        
        if not filepath:
            return jsonify({
                'success': False,
                'error': 'No filepath provided'
            }), 400
        
        success, msg = delete_file(filepath)
        
        return jsonify({
            'success': success,
            'message': msg
        }), 200 if success else 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
