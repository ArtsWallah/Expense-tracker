"""
API endpoints for expenses management
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from models.database import ExpenseManager, CATEGORIES, PAYMENT_METHODS
from utils.validators import (
    validate_amount, validate_date, validate_category,
    validate_payment_method, validate_description, sanitize_string
)

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')


@expenses_bp.route('', methods=['GET'])
def get_expenses():
    """Get all expenses with optional filtering"""
    try:
        expenses = ExpenseManager.load()
        
        # Optional filters
        category = request.args.get('category')
        payment_method = request.args.get('payment_method')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Apply filters
        if category:
            expenses = [e for e in expenses if e.get('category') == category]
        if payment_method:
            expenses = [e for e in expenses if e.get('payment_method') == payment_method]
        if start_date:
            expenses = [e for e in expenses if e.get('date') >= start_date]
        if end_date:
            expenses = [e for e in expenses if e.get('date') <= end_date]
        
        return jsonify({
            'success': True,
            'data': expenses,
            'count': len(expenses)
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Failed to fetch expenses: {str(e)}"
        }), 500


@expenses_bp.route('', methods=['POST'])
def create_expense():
    """Create new expense with validation"""
    try:
        data = request.get_json()
        
        # Validation
        if not validate_date(data.get('date')):
            return jsonify({
                'success': False,
                'error': 'Invalid date format. Use YYYY-MM-DD'
            }), 400
        
        if not validate_category(data.get('category'), CATEGORIES):
            return jsonify({
                'success': False,
                'error': f'Invalid category. Must be one of: {", ".join(CATEGORIES)}'
            }), 400
        
        if not validate_payment_method(data.get('payment_method'), PAYMENT_METHODS):
            return jsonify({
                'success': False,
                'error': f'Invalid payment method. Must be one of: {", ".join(PAYMENT_METHODS)}'
            }), 400
        
        if not validate_amount(data.get('amount')):
            return jsonify({
                'success': False,
                'error': 'Amount must be a positive number'
            }), 400
        
        if not validate_description(data.get('description')):
            return jsonify({
                'success': False,
                'error': 'Description must be at least 2 characters'
            }), 400
        
        # Sanitize inputs
        expense_data = {
            'date': data.get('date'),
            'category': data.get('category'),
            'description': sanitize_string(data.get('description', '')),
            'amount': float(data.get('amount')),
            'payment_method': data.get('payment_method'),
            'wallet': data.get('wallet'),
            'receipt': data.get('receipt'),
            'notes': sanitize_string(data.get('notes', '')),
            'tags': data.get('tags', [])
        }
        
        success, result = ExpenseManager.add(expense_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Expense added successfully',
                'data': result
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': result
            }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Failed to create expense: {str(e)}"
        }), 500


@expenses_bp.route('/<expense_id>', methods=['GET'])
def get_expense(expense_id):
    """Get single expense by ID"""
    try:
        expense = ExpenseManager.get_by_id(expense_id)
        
        if not expense:
            return jsonify({
                'success': False,
                'error': 'Expense not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': expense
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Error fetching expense: {str(e)}"
        }), 500


@expenses_bp.route('/<expense_id>', methods=['PUT'])
def update_expense(expense_id):
    """Update expense"""
    try:
        data = request.get_json()
        
        # Validate if provided
        if 'date' in data and not validate_date(data['date']):
            return jsonify({'success': False, 'error': 'Invalid date'}), 400
        
        if 'category' in data and not validate_category(data['category'], CATEGORIES):
            return jsonify({'success': False, 'error': 'Invalid category'}), 400
        
        if 'amount' in data and not validate_amount(data['amount']):
            return jsonify({'success': False, 'error': 'Invalid amount'}), 400
        
        # Sanitize
        if 'description' in data:
            data['description'] = sanitize_string(data['description'])
        if 'notes' in data:
            data['notes'] = sanitize_string(data['notes'])
        
        success, msg = ExpenseManager.update(expense_id, data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Expense updated'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': msg
            }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Error updating: {str(e)}"
        }), 500


@expenses_bp.route('/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """Delete expense"""
    try:
        success, msg = ExpenseManager.delete(expense_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Expense deleted'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': msg
            }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Error deleting: {str(e)}"
        }), 500


@expenses_bp.route('/duplicate/<expense_id>', methods=['POST'])
def duplicate_expense(expense_id):
    """Duplicate an expense"""
    try:
        expense = ExpenseManager.get_by_id(expense_id)
        
        if not expense:
            return jsonify({
                'success': False,
                'error': 'Expense not found'
            }), 404
        
        # Create new expense with updated date
        new_expense = expense.copy()
        new_expense.pop('id', None)  # Remove ID so new one is generated
        new_expense['date'] = datetime.now().strftime('%Y-%m-%d')
        
        success, result = ExpenseManager.add(new_expense)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Expense duplicated',
                'data': result
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': result
            }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Error duplicating: {str(e)}"
        }), 500
