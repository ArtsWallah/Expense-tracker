from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta
import json
import os
from collections import defaultdict

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Use in-memory storage for Vercel compatibility
# Data persists during session but resets on redeploy
expenses_db = None
settings_db = None
budgets_db = None

# Currency definitions
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

DEFAULT_SETTINGS = {
    'currency': 'USD',
    'wallets': [
        {'id': 1, 'name': 'Cash', 'balance': 0},
        {'id': 2, 'name': 'Bank', 'balance': 0},
        {'id': 3, 'name': 'Paytm', 'balance': 0},
        {'id': 4, 'name': 'Credit Card', 'balance': 0}
    ]
}

# Sample data with realistic dates (December 2025)
SAMPLE_EXPENSES = [
    {'date': '2025-12-01', 'categories': ['Food'], 'description': 'Lunch at restaurant', 'amount': 15.50, 'payment_method': 'Card', 'wallet': 'Bank'},
    {'date': '2025-12-02', 'categories': ['Transportation'], 'description': 'Gas', 'amount': 25.00, 'payment_method': 'Cash', 'wallet': 'Cash'},
    {'date': '2025-12-03', 'categories': ['Entertainment'], 'description': 'Movie tickets', 'amount': 18.00, 'payment_method': 'Card', 'wallet': 'Credit Card'},
    {'date': '2025-12-04', 'categories': ['Shopping'], 'description': 'Groceries', 'amount': 42.30, 'payment_method': 'UPI', 'wallet': 'Paytm'},
    {'date': '2025-12-05', 'categories': ['Food'], 'description': 'Coffee', 'amount': 5.50, 'payment_method': 'Cash', 'wallet': 'Cash'},
    {'date': '2025-12-06', 'categories': ['Utilities'], 'description': 'Internet bill', 'amount': 79.99, 'payment_method': 'Bank', 'wallet': 'Bank'},
    {'date': '2025-12-07', 'categories': ['Healthcare'], 'description': 'Medicine', 'amount': 25.00, 'payment_method': 'Card', 'wallet': 'Credit Card'},
    {'date': '2025-12-08', 'categories': ['Food'], 'description': 'Dinner', 'amount': 32.75, 'payment_method': 'Card', 'wallet': 'Bank'},
    {'date': '2025-12-09', 'categories': ['Entertainment'], 'description': 'Concert ticket', 'amount': 59.99, 'payment_method': 'Card', 'wallet': 'Credit Card'},
    {'date': '2025-12-10', 'categories': ['Shopping'], 'description': 'Clothes', 'amount': 65.00, 'payment_method': 'UPI', 'wallet': 'Paytm'},
]

DEFAULT_BUDGETS = {
    'Food': 250,
    'Transportation': 150,
    'Entertainment': 200,
    'Shopping': 300,
    'Utilities': 150,
    'Healthcare': 100,
    'Others': 100
}

def load_expenses():
    """Load expenses from database"""
    global expenses_db
    if expenses_db is None:
        expenses_db = SAMPLE_EXPENSES.copy()
    return expenses_db

def save_expenses(expenses):
    """Save expenses to database"""
    global expenses_db
    expenses_db = expenses

def load_settings():
    """Load settings from database"""
    global settings_db
    if settings_db is None:
        settings_db = DEFAULT_SETTINGS.copy()
    return settings_db

def save_settings(settings):
    """Save settings to database"""
    global settings_db
    settings_db = settings

def load_budgets():
    """Load budgets from database"""
    global budgets_db
    if budgets_db is None:
        budgets_db = DEFAULT_BUDGETS.copy()
    return budgets_db

def save_budgets(budgets):
    """Save budgets to database"""
    global budgets_db
    budgets_db = budgets

def get_category_emoji(category):
    """Get emoji for category"""
    emojis = {
        'Food': '🍔',
        'Transportation': '🚗',
        'Entertainment': '🎬',
        'Shopping': '🛍️',
        'Utilities': '⚡',
        'Healthcare': '🏥',
        'Others': '📦'
    }
    return emojis.get(category, '📝')

def calculate_total(expense_list):
    """Calculate total amount from expenses"""
    return sum(expense['amount'] for expense in expense_list)

def get_current_month_expenses(expenses):
    """Get expenses for current month"""
    now = datetime.now()
    current_month = now.strftime('%Y-%m')
    return [e for e in expenses if e['date'].startswith(current_month)]

def get_current_week_expenses(expenses):
    """Get expenses for current week"""
    now = datetime.now()
    start_of_week = now - timedelta(days=now.weekday())
    return [e for e in expenses if datetime.strptime(e['date'], '%Y-%m-%d').date() >= start_of_week.date()]

def get_today_expenses(expenses):
    """Get expenses for today"""
    today = datetime.now().strftime('%Y-%m-%d')
    return [e for e in expenses if e['date'] == today]

@app.route('/')
def index():
    """Render main page"""
    return render_template('index.html')

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get current settings"""
    settings = load_settings()
    settings_copy = settings.copy()
    settings_copy['currencies'] = CURRENCIES
    return jsonify(settings_copy)

@app.route('/api/settings', methods=['POST'])
def update_settings():
    """Update settings"""
    data = request.get_json()
    settings = load_settings()
    
    if 'currency' in data:
        settings['currency'] = data['currency']
    
    save_settings(settings)
    return jsonify(settings)

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    """Get all expenses"""
    expenses = load_expenses()
    return jsonify(expenses)

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    """Add new expense"""
    data = request.get_json()
    
    # Validation
    if not data.get('amount') or data['amount'] <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    
    if not data.get('description') or len(data['description']) < 2:
        return jsonify({'error': 'Description must be at least 2 characters'}), 400
    
    if not data.get('categories') or len(data['categories']) == 0:
        return jsonify({'error': 'Select at least one category'}), 400
    
    if not data.get('payment_method') or not data.get('wallet'):
        return jsonify({'error': 'Payment method and wallet are required'}), 400
    
    expenses = load_expenses()
    
    new_expense = {
        'date': data.get('date', datetime.now().strftime('%Y-%m-%d')),
        'categories': data.get('categories', []),
        'description': data.get('description', ''),
        'amount': float(data.get('amount', 0)),
        'payment_method': data.get('payment_method', ''),
        'wallet': data.get('wallet', '')
    }
    
    expenses.append(new_expense)
    save_expenses(expenses)
    
    return jsonify(new_expense), 201

@app.route('/api/expenses/<int:index>', methods=['DELETE'])
def delete_expense(index):
    """Delete expense by index"""
    expenses = load_expenses()
    
    if 0 <= index < len(expenses):
        deleted = expenses.pop(index)
        save_expenses(expenses)
        return jsonify({'message': 'Expense deleted', 'deleted': deleted})
    
    return jsonify({'error': 'Expense not found'}), 404

@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    """Get budgets"""
    budgets = load_budgets()
    return jsonify(budgets)

@app.route('/api/budgets', methods=['POST'])
def update_budgets():
    """Update budgets"""
    data = request.get_json()
    save_budgets(data)
    return jsonify(data)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get expense statistics"""
    expenses = load_expenses()
    
    total_balance = calculate_total(expenses)
    monthly_expenses = get_current_month_expenses(expenses)
    monthly_total = calculate_total(monthly_expenses)
    weekly_expenses = get_current_week_expenses(expenses)
    weekly_total = calculate_total(weekly_expenses)
    today_expenses = get_today_expenses(expenses)
    today_total = calculate_total(today_expenses)
    average_daily = total_balance / max(len(expenses), 1)
    
    return jsonify({
        'total_balance': total_balance,
        'monthly_total': monthly_total,
        'weekly_total': weekly_total,
        'today_total': today_total,
        'average_daily': average_daily,
        'expense_count': len(expenses)
    })

@app.route('/api/expenses/summary', methods=['GET'])
def get_summary():
    """Get expense summary"""
    expenses = load_expenses()
    
    if not expenses:
        return jsonify({'count': 0, 'total': 0, 'highest': 0})
    
    total = calculate_total(expenses)
    highest = max(expense['amount'] for expense in expenses)
    
    return jsonify({
        'count': len(expenses),
        'total': total,
        'highest': highest
    })

@app.route('/api/charts/daily', methods=['GET'])
def get_daily_chart():
    """Get daily expense chart data"""
    expenses = load_expenses()
    
    # Get filters
    categories = request.args.getlist('categories')
    month = request.args.get('month', '')
    
    # Filter expenses
    filtered = expenses
    if categories:
        filtered = [e for e in filtered if any(cat in e.get('categories', []) for cat in categories)]
    if month:
        filtered = [e for e in filtered if e['date'].startswith(month)]
    
    # Group by date
    daily_data = defaultdict(float)
    for expense in filtered:
        daily_data[expense['date']] += expense['amount']
    
    # Sort by date
    sorted_dates = sorted(daily_data.keys())
    labels = sorted_dates
    data = [daily_data[date] for date in sorted_dates]
    
    return jsonify({
        'labels': labels,
        'data': data,
        'isEmpty': len(data) == 0
    })

@app.route('/api/charts/category', methods=['GET'])
def get_category_chart():
    """Get category distribution chart data"""
    expenses = load_expenses()
    
    # Get filters
    categories = request.args.getlist('categories')
    month = request.args.get('month', '')
    
    # Filter expenses
    filtered = expenses
    if categories:
        filtered = [e for e in filtered if any(cat in e.get('categories', []) for cat in categories)]
    if month:
        filtered = [e for e in filtered if e['date'].startswith(month)]
    
    # Group by category
    category_data = defaultdict(float)
    for expense in filtered:
        for cat in expense.get('categories', []):
            category_data[cat] += expense['amount']
    
    labels = list(category_data.keys())
    data = list(category_data.values())
    
    return jsonify({
        'labels': labels,
        'data': data,
        'isEmpty': len(data) == 0
    })

if __name__ == '__main__':
    app.run(debug=True)
