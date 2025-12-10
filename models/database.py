"""
Data models and database operations
"""

import json
import os
from datetime import datetime
import uuid
from collections import defaultdict


# Database file paths
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
EXPENSES_FILE = os.path.join(BASE_DIR, 'data', 'expenses.json')
SETTINGS_FILE = os.path.join(BASE_DIR, 'data', 'settings.json')
BUDGETS_FILE = os.path.join(BASE_DIR, 'data', 'budgets.json')
RECURRING_FILE = os.path.join(BASE_DIR, 'data', 'recurring.json')

# Ensure data directory exists
os.makedirs(os.path.dirname(EXPENSES_FILE), exist_ok=True)

# Constants
CATEGORIES = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Utilities', 'Healthcare', 'Others']
PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer']

CURRENCIES = {
    'USD': {'symbol': '$', 'name': 'US Dollar'},
    'EUR': {'symbol': '€', 'name': 'Euro'},
    'GBP': {'symbol': '£', 'name': 'British Pound'},
    'INR': {'symbol': '₹', 'name': 'Indian Rupee'},
    'BDT': {'symbol': '৳', 'name': 'Bangladeshi Taka'},
    'JPY': {'symbol': '¥', 'name': 'Japanese Yen'},
    'AUD': {'symbol': 'A$', 'name': 'Australian Dollar'},
    'CAD': {'symbol': 'C$', 'name': 'Canadian Dollar'},
    'CHF': {'symbol': 'CHF', 'name': 'Swiss Franc'},
    'SGD': {'symbol': 'S$', 'name': 'Singapore Dollar'}
}

DEFAULT_WALLETS = [
    {'id': 1, 'name': 'Cash', 'balance': 0},
    {'id': 2, 'name': 'Bank', 'balance': 0},
    {'id': 3, 'name': 'UPI', 'balance': 0},
    {'id': 4, 'name': 'Credit Card', 'balance': 0}
]

DEFAULT_SETTINGS = {
    'currency': 'INR',
    'theme': 'dark',
    'wallets': DEFAULT_WALLETS
}

DEFAULT_BUDGETS = {
    'Food': 250,
    'Transportation': 150,
    'Entertainment': 200,
    'Shopping': 300,
    'Utilities': 150,
    'Healthcare': 100,
    'Others': 100,
    'total': 1250
}


class ExpenseManager:
    """Handle all expense operations"""
    
    @staticmethod
    def load():
        """Load expenses from database"""
        try:
            if os.path.exists(EXPENSES_FILE):
                with open(EXPENSES_FILE, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading expenses: {e}")
        return []
    
    @staticmethod
    def save(expenses):
        """Save expenses to database"""
        try:
            with open(EXPENSES_FILE, 'w') as f:
                json.dump(expenses, f, indent=2)
            return True, "Expenses saved"
        except Exception as e:
            return False, f"Failed to save: {str(e)}"
    
    @staticmethod
    def add(expense_data):
        """Add new expense"""
        try:
            expenses = ExpenseManager.load()
            
            expense = {
                'id': str(uuid.uuid4()),
                'date': expense_data.get('date'),
                'category': expense_data.get('category'),
                'description': expense_data.get('description'),
                'amount': float(expense_data.get('amount', 0)),
                'payment_method': expense_data.get('payment_method'),
                'wallet': expense_data.get('wallet'),
                'receipt': expense_data.get('receipt'),
                'notes': expense_data.get('notes'),
                'tags': expense_data.get('tags', []),
                'recurring': expense_data.get('recurring', False),
                'created_at': datetime.now().isoformat()
            }
            
            expenses.append(expense)
            success, msg = ExpenseManager.save(expenses)
            
            if success:
                return True, expense
            else:
                return False, msg
        
        except Exception as e:
            return False, f"Error adding expense: {str(e)}"
    
    @staticmethod
    def delete(expense_id):
        """Delete expense by ID"""
        try:
            expenses = ExpenseManager.load()
            expenses = [e for e in expenses if e['id'] != expense_id]
            success, msg = ExpenseManager.save(expenses)
            return success, msg
        except Exception as e:
            return False, f"Error deleting: {str(e)}"
    
    @staticmethod
    def update(expense_id, updated_data):
        """Update expense"""
        try:
            expenses = ExpenseManager.load()
            
            for i, expense in enumerate(expenses):
                if expense['id'] == expense_id:
                    # Update only provided fields
                    for key, value in updated_data.items():
                        if key != 'id':  # Don't update ID
                            expense[key] = value
                    break
            
            success, msg = ExpenseManager.save(expenses)
            return success, msg
        except Exception as e:
            return False, f"Error updating: {str(e)}"
    
    @staticmethod
    def get_by_id(expense_id):
        """Get expense by ID"""
        expenses = ExpenseManager.load()
        for expense in expenses:
            if expense['id'] == expense_id:
                return expense
        return None


class SettingsManager:
    """Handle settings operations"""
    
    @staticmethod
    def load():
        """Load settings"""
        try:
            if os.path.exists(SETTINGS_FILE):
                with open(SETTINGS_FILE, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading settings: {e}")
        return DEFAULT_SETTINGS.copy()
    
    @staticmethod
    def save(settings):
        """Save settings"""
        try:
            with open(SETTINGS_FILE, 'w') as f:
                json.dump(settings, f, indent=2)
            return True, "Settings saved"
        except Exception as e:
            return False, f"Failed to save: {str(e)}"


class BudgetManager:
    """Handle budget operations"""
    
    @staticmethod
    def load():
        """Load budgets"""
        try:
            if os.path.exists(BUDGETS_FILE):
                with open(BUDGETS_FILE, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading budgets: {e}")
        return DEFAULT_BUDGETS.copy()
    
    @staticmethod
    def save(budgets):
        """Save budgets"""
        try:
            with open(BUDGETS_FILE, 'w') as f:
                json.dump(budgets, f, indent=2)
            return True, "Budgets saved"
        except Exception as e:
            return False, f"Failed to save: {str(e)}"
