from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta
import json
import os
from collections import defaultdict
import uuid

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Database files
DATA_FILE = 'expenses.json'
SETTINGS_FILE = 'settings.json'
BUDGETS_FILE = 'budgets.json'

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

DEFAULT_SETTINGS = {
    'currency': 'USD',
    'theme': 'dark',
    'wallets': [
        {'id': 1, 'name': 'Cash', 'balance': 0},
        {'id': 2, 'name': 'Bank', 'balance': 0},
        {'id': 3, 'name': 'Paytm', 'balance': 0},
        {'id': 4, 'name': 'Credit Card', 'balance': 0}
    ]
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

# Database operations
def load_expenses():
    """Load expenses from JSON file"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_expenses(expenses):
    """Save expenses to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(expenses, f, indent=2)

def load_settings():
    """Load settings from JSON file"""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r') as f:
                return json.load(f)
        except:
            return DEFAULT_SETTINGS.copy()
    return DEFAULT_SETTINGS.copy()

def save_settings(settings):
    """Save settings to JSON file"""
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f, indent=2)

def load_budgets():
    """Load budgets from JSON file"""
    if os.path.exists(BUDGETS_FILE):
        try:
            with open(BUDGETS_FILE, 'r') as f:
                return json.load(f)
        except:
            return DEFAULT_BUDGETS.copy()
    return DEFAULT_BUDGETS.copy()

def save_budgets(budgets):
    """Save budgets to JSON file"""
    with open(BUDGETS_FILE, 'w') as f:
        json.dump(budgets, f, indent=2)

# Routes
@app.route('/')
def index():
    """Render main page"""
    return render_template('index.html')

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get current settings with available currencies and categories"""
    settings = load_settings()
    settings['currencies'] = CURRENCIES
    settings['categories'] = CATEGORIES
    settings['payment_methods'] = PAYMENT_METHODS
    return jsonify(settings)

@app.route('/api/settings', methods=['POST'])
def update_settings():
    """Update settings"""
    data = request.get_json()
    settings = load_settings()
    
    if 'currency' in data:
        settings['currency'] = data['currency']
    if 'theme' in data:
        settings['theme'] = data['theme']
    if 'wallets' in data:
        settings['wallets'] = data['wallets']
    
    save_settings(settings)
    return jsonify(settings)

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    """Get all expenses with optional sorting"""
    expenses = load_expenses()
    sort_by = request.args.get('sort', 'date')
    order = request.args.get('order', 'desc')
    
    if sort_by == 'date':
        expenses.sort(key=lambda x: x['date'], reverse=(order == 'desc'))
    elif sort_by == 'amount':
        expenses.sort(key=lambda x: x['amount'], reverse=(order == 'desc'))
    elif sort_by == 'category':
        expenses.sort(key=lambda x: x['category'], reverse=(order == 'desc'))
    
    return jsonify(expenses)

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    """Add new expense with full validation"""
    data = request.get_json()
    
    # Comprehensive validation
    try:
        amount = float(data.get('amount', 0))
    except:
        return jsonify({'error': 'Amount must be a valid number'}), 400
    
    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    
    if not data.get('date'):
        return jsonify({'error': 'Date is required'}), 400
    
    description = str(data.get('description', '')).strip()
    if not description or len(description) < 2:
        return jsonify({'error': 'Description must be at least 2 characters'}), 400
    
    category = data.get('category')
    if not category or category not in CATEGORIES:
        return jsonify({'error': 'Valid category is required'}), 400
    
    payment_method = data.get('payment_method')
    if not payment_method or payment_method not in PAYMENT_METHODS:
        return jsonify({'error': 'Valid payment method is required'}), 400
    
    expenses = load_expenses()
    
    new_expense = {
        'id': str(uuid.uuid4()),
        'date': data.get('date'),
        'category': category,
        'description': description,
        'amount': amount,
        'payment_method': payment_method,
        'wallet': data.get('wallet', ''),
        'receipt': data.get('receipt', ''),
        'notes': data.get('notes', ''),
        'timestamp': datetime.now().isoformat()
    }
    
    expenses.append(new_expense)
    save_expenses(expenses)
    
    return jsonify(new_expense), 201

@app.route('/api/expenses/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """Delete an expense by ID"""
    expenses = load_expenses()
    original_length = len(expenses)
    expenses = [e for e in expenses if e['id'] != expense_id]
    
    if len(expenses) == original_length:
        return jsonify({'error': 'Expense not found'}), 404
    
    save_expenses(expenses)
    return jsonify({'message': 'Expense deleted'})

@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    """Get all budgets"""
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
    """Get comprehensive statistics"""
    expenses = load_expenses()
    budgets = load_budgets()
    now = datetime.now()
    current_month = now.strftime('%Y-%m')
    
    if not expenses:
        return jsonify({
            'total_spent': 0,
            'month_spent': 0,
            'week_spent': 0,
            'today_spent': 0,
            'month_budget': budgets.get('total', 0),
            'month_remaining': budgets.get('total', 0),
            'month_budget_percentage': 0,
            'expense_count': 0,
            'category_spent': {},
            'budget_status': {},
            'highest_expense': 0,
            'average_expense': 0
        })
    
    total_spent = sum(e['amount'] for e in expenses)
    month_spent = sum(e['amount'] for e in expenses if e['date'].startswith(current_month))
    
    # Weekly stats
    start_of_week = now - timedelta(days=now.weekday())
    week_spent = sum(e['amount'] for e in expenses if datetime.strptime(e['date'], '%Y-%m-%d').date() >= start_of_week.date())
    
    # Today stats
    today = now.strftime('%Y-%m-%d')
    today_spent = sum(e['amount'] for e in expenses if e['date'] == today)
    
    # Category breakdown
    category_spent = defaultdict(float)
    for expense in expenses:
        if expense['date'].startswith(current_month):
            category_spent[expense['category']] += expense['amount']
    
    # Budget status
    budget_status = {}
    for category in CATEGORIES:
        budget_amount = budgets.get(category, 100)
        spent = category_spent.get(category, 0)
        budget_status[category] = {
            'spent': spent,
            'budget': budget_amount,
            'remaining': max(0, budget_amount - spent),
            'percentage': (spent / budget_amount * 100) if budget_amount > 0 else 0,
            'status': 'danger' if spent > budget_amount else 'warning' if spent >= budget_amount * 0.8 else 'success'
        }
    
    return jsonify({
        'total_spent': total_spent,
        'month_spent': month_spent,
        'week_spent': week_spent,
        'today_spent': today_spent,
        'month_budget': budgets.get('total', 0),
        'month_remaining': max(0, budgets.get('total', 0) - month_spent),
        'month_budget_percentage': (month_spent / budgets.get('total', 1) * 100) if budgets.get('total', 0) > 0 else 0,
        'expense_count': len(expenses),
        'category_spent': dict(category_spent),
        'budget_status': budget_status,
        'highest_expense': max(e['amount'] for e in expenses),
        'average_expense': total_spent / len(expenses)
    })

@app.route('/api/charts/daily', methods=['GET'])
def get_daily_chart():
    """Get daily expense chart data"""
    expenses = load_expenses()
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    category = request.args.get('category', '')
    
    filtered = [e for e in expenses if e['date'].startswith(month)]
    if category:
        filtered = [e for e in filtered if e['category'] == category]
    
    daily_data = defaultdict(float)
    for expense in filtered:
        daily_data[expense['date']] += expense['amount']
    
    sorted_dates = sorted(daily_data.keys())
    
    return jsonify({
        'labels': sorted_dates,
        'data': [daily_data[date] for date in sorted_dates],
        'isEmpty': len(sorted_dates) == 0
    })

@app.route('/api/charts/category', methods=['GET'])
def get_category_chart():
    """Get category distribution chart data"""
    expenses = load_expenses()
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    
    filtered = [e for e in expenses if e['date'].startswith(month)]
    
    category_data = defaultdict(float)
    for expense in filtered:
        category_data[expense['category']] += expense['amount']
    
    labels = list(category_data.keys())
    data = list(category_data.values())
    
    return jsonify({
        'labels': labels,
        'data': data,
        'isEmpty': len(labels) == 0
    })

if __name__ == '__main__':
    app.run(debug=True)
