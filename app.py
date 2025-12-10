from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta
import json
import os
from collections import defaultdict

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Path to store expenses data
DATA_FILE = 'expenses.json'
SETTINGS_FILE = 'settings.json'
BUDGETS_FILE = 'budgets.json'

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
    'Food': 200,
    'Transportation': 100,
    'Entertainment': 150,
    'Shopping': 300,
    'Utilities': 150,
    'Healthcare': 100,
    'Others': 100
}

def load_expenses():
    """Load expenses from JSON file or return sample data"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return SAMPLE_EXPENSES

def save_expenses(expenses):
    """Save expenses to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(expenses, f, indent=2)

def load_settings():
    """Load settings from JSON file or return default settings"""
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'r') as f:
            return json.load(f)
    return DEFAULT_SETTINGS

def save_settings(settings):
    """Save settings to JSON file"""
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f, indent=2)

def load_budgets():
    """Load budgets from JSON file or return default budgets"""
    if os.path.exists(BUDGETS_FILE):
        with open(BUDGETS_FILE, 'r') as f:
            return json.load(f)
    return DEFAULT_BUDGETS

def save_budgets(budgets):
    """Save budgets to JSON file"""
    with open(BUDGETS_FILE, 'w') as f:
        json.dump(budgets, f, indent=2)

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
    settings['currencies'] = CURRENCIES
    return jsonify(settings)

@app.route('/api/settings', methods=['POST'])
def update_settings():
    """Update settings"""
    data = request.get_json()
    settings = load_settings()
    
    if 'currency' in data and data['currency'] in CURRENCIES:
        settings['currency'] = data['currency']
        save_settings(settings)
    
    return jsonify(settings)

@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    """Get budgets"""
    return jsonify(load_budgets())

@app.route('/api/budgets', methods=['POST'])
def update_budgets():
    """Update budgets"""
    data = request.get_json()
    save_budgets(data)
    return jsonify(data)

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    """Get all expenses with optional filtering"""
    expenses = load_expenses()
    
    # Apply filters
    categories = request.args.getlist('categories')
    month = request.args.get('month', '')
    
    filtered = expenses
    if categories:
        filtered = [e for e in filtered if any(cat in e['categories'] for cat in categories)]
    if month:
        filtered = [e for e in filtered if e['date'].startswith(month)]
    
    return jsonify(filtered)

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    """Add a new expense"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['date', 'categories', 'description', 'amount', 'payment_method', 'wallet']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate amount and description
    try:
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid amount'}), 400
    
    description = str(data['description']).strip()
    if not description or len(description) < 2:
        return jsonify({'error': 'Description must be at least 2 characters'}), 400
    
    expenses = load_expenses()
    
    # Ensure categories is a list
    categories = data['categories']
    if isinstance(categories, str):
        categories = [categories]
    
    new_expense = {
        'date': data['date'],
        'categories': categories,
        'description': description,
        'amount': amount,
        'payment_method': data['payment_method'],
        'wallet': data['wallet']
    }
    
    expenses.append(new_expense)
    save_expenses(expenses)
    
    return jsonify(new_expense), 201

@app.route('/api/expenses/<int:index>', methods=['DELETE'])
def delete_expense(index):
    """Delete an expense by index"""
    expenses = load_expenses()
    
    if index < 0 or index >= len(expenses):
        return jsonify({'error': 'Expense not found'}), 404
    
    expenses.pop(index)
    save_expenses(expenses)
    
    return jsonify({'success': True}), 200

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get expense statistics"""
    expenses = load_expenses()
    
    current_month = get_current_month_expenses(expenses)
    current_week = get_current_week_expenses(expenses)
    today = get_today_expenses(expenses)
    
    monthly_total = calculate_total(current_month)
    avg_daily = monthly_total / 30 if current_month else 0
    
    return jsonify({
        'total_balance': calculate_total(expenses),
        'monthly_total': monthly_total,
        'weekly_total': calculate_total(current_week),
        'today_total': calculate_total(today),
        'average_daily': avg_daily,
        'total_expenses_count': len(expenses),
        'month_expenses_count': len(current_month)
    })

@app.route('/api/charts/daily', methods=['GET'])
def get_daily_chart():
    """Get data for daily expenses chart"""
    expenses = load_expenses()
    
    # Apply filters
    categories = request.args.getlist('categories')
    month = request.args.get('month', '')
    
    filtered = expenses
    if categories:
        filtered = [e for e in filtered if any(cat in e['categories'] for cat in categories)]
    if month:
        filtered = [e for e in filtered if e['date'].startswith(month)]
    
    # Group by date
    daily_data = defaultdict(float)
    for expense in filtered:
        daily_data[expense['date']] += expense['amount']
    
    dates = sorted(daily_data.keys())
    amounts = [daily_data[date] for date in dates]
    
    return jsonify({
        'labels': dates,
        'data': amounts
    })

@app.route('/api/charts/category', methods=['GET'])
def get_category_chart():
    """Get data for category distribution chart"""
    expenses = load_expenses()
    
    # Apply filters
    categories = request.args.getlist('categories')
    month = request.args.get('month', '')
    
    filtered = expenses
    if categories:
        filtered = [e for e in filtered if any(cat in e['categories'] for cat in categories)]
    if month:
        filtered = [e for e in filtered if e['date'].startswith(month)]
    
    # Group by category
    category_data = defaultdict(float)
    for expense in filtered:
        for cat in expense['categories']:
            category_data[cat] += expense['amount']
    
    cats = sorted(category_data.keys())
    amounts = [category_data[cat] for cat in cats]
    
    return jsonify({
        'labels': cats,
        'data': amounts,
        'isEmpty': len(cats) == 0
    })

@app.route('/api/expenses/summary', methods=['GET'])
def get_expenses_summary():
    """Get summary of current month expenses"""
    expenses = load_expenses()
    current_month = get_current_month_expenses(expenses)
    
    if not current_month:
        return jsonify({
            'count': 0,
            'total': 0,
            'highest': 0
        })
    
    highest_expense = max(current_month, key=lambda x: x['amount'])
    
    return jsonify({
        'count': len(current_month),
        'total': calculate_total(current_month),
        'highest': highest_expense['amount'],
        'highest_desc': highest_expense['description']
    })

if __name__ == '__main__':
    app.run(debug=True)
