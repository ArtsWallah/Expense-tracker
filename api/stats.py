"""
API endpoints for settings, budgets, and stats
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from collections import defaultdict
from models.database import (
    ExpenseManager, SettingsManager, BudgetManager,
    CATEGORIES, CURRENCIES
)

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')
budgets_bp = Blueprint('budgets', __name__, url_prefix='/api/budgets')
stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')


# ===== SETTINGS API =====

@settings_bp.route('', methods=['GET'])
def get_settings():
    """Get all settings"""
    try:
        settings = SettingsManager.load()
        return jsonify({
            'success': True,
            'data': settings,
            'currencies': CURRENCIES
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@settings_bp.route('', methods=['POST'])
def update_settings():
    """Update settings"""
    try:
        data = request.get_json()
        settings = SettingsManager.load()
        
        # Update only provided fields
        if 'currency' in data and data['currency'] in CURRENCIES:
            settings['currency'] = data['currency']
        
        if 'theme' in data and data['theme'] in ['light', 'dark']:
            settings['theme'] = data['theme']
        
        success, msg = SettingsManager.save(settings)
        
        return jsonify({
            'success': success,
            'message': msg,
            'data': settings if success else None
        }), 200 if success else 500
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== BUDGETS API =====

@budgets_bp.route('', methods=['GET'])
def get_budgets():
    """Get all budgets"""
    try:
        budgets = BudgetManager.load()
        return jsonify({
            'success': True,
            'data': budgets
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@budgets_bp.route('', methods=['POST'])
def update_budgets():
    """Update budgets"""
    try:
        data = request.get_json()
        budgets = BudgetManager.load()
        
        # Update category budgets
        for category in CATEGORIES:
            if category in data:
                try:
                    budgets[category] = float(data[category])
                except (ValueError, TypeError):
                    pass
        
        # Calculate total
        budgets['total'] = sum(budgets.get(cat, 0) for cat in CATEGORIES)
        
        success, msg = BudgetManager.save(budgets)
        
        return jsonify({
            'success': success,
            'message': msg,
            'data': budgets if success else None
        }), 200 if success else 500
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== STATISTICS API =====

@stats_bp.route('', methods=['GET'])
def get_stats():
    """Get comprehensive statistics"""
    try:
        expenses = ExpenseManager.load()
        today = datetime.now().strftime('%Y-%m-%d')
        this_month_start = datetime.now().strftime('%Y-%m-01')
        this_week_start = (datetime.now() - timedelta(days=datetime.now().weekday())).strftime('%Y-%m-%d')
        
        # Filter expenses
        today_expenses = [e for e in expenses if e.get('date') == today]
        this_month_expenses = [e for e in expenses if e.get('date') >= this_month_start]
        this_week_expenses = [e for e in expenses if e.get('date') >= this_week_start]
        
        # Calculate totals
        def sum_expenses(exp_list):
            return sum(e.get('amount', 0) for e in exp_list)
        
        total_all = sum_expenses(expenses)
        total_today = sum_expenses(today_expenses)
        total_week = sum_expenses(this_week_expenses)
        total_month = sum_expenses(this_month_expenses)
        
        # Category breakdown
        category_breakdown = defaultdict(float)
        for expense in this_month_expenses:
            category_breakdown[expense.get('category')] += expense.get('amount', 0)
        
        # Budget comparison
        budgets = BudgetManager.load()
        budget_status = {}
        for category in CATEGORIES:
            spent = category_breakdown.get(category, 0)
            budget = budgets.get(category, 0)
            percentage = (spent / budget * 100) if budget > 0 else 0
            
            status = 'success'
            if percentage >= 100:
                status = 'danger'
            elif percentage >= 80:
                status = 'warning'
            
            budget_status[category] = {
                'spent': spent,
                'budget': budget,
                'remaining': max(0, budget - spent),
                'percentage': min(100, percentage),
                'status': status
            }
        
        stats = {
            'total': {
                'all_time': total_all,
                'this_month': total_month,
                'this_week': total_week,
                'today': total_today
            },
            'count': {
                'total': len(expenses),
                'this_month': len(this_month_expenses)
            },
            'average': {
                'per_expense': total_month / len(this_month_expenses) if this_month_expenses else 0,
                'per_day': total_month / max(1, datetime.now().day)
            },
            'highest': {
                'amount': max((e.get('amount', 0) for e in this_month_expenses), default=0),
                'category': max(category_breakdown.items(), default=('None', 0))[0]
            },
            'category_breakdown': dict(category_breakdown),
            'budget_status': budget_status,
            'monthly_progress': (total_month / budgets.get('total', 1) * 100) if budgets.get('total') else 0
        }
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@stats_bp.route('/daily', methods=['GET'])
def get_daily_chart():
    """Get daily spending data for charts"""
    try:
        expenses = ExpenseManager.load()
        this_month_start = datetime.now().strftime('%Y-%m-01')
        
        # Filter this month
        month_expenses = [e for e in expenses if e.get('date') >= this_month_start]
        
        # Group by date
        daily = defaultdict(float)
        for expense in month_expenses:
            daily[expense.get('date')] += expense.get('amount', 0)
        
        # Sort by date
        sorted_daily = sorted(daily.items())
        
        return jsonify({
            'success': True,
            'labels': [d[0] for d in sorted_daily],
            'data': [d[1] for d in sorted_daily]
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@stats_bp.route('/category', methods=['GET'])
def get_category_chart():
    """Get category distribution for charts"""
    try:
        expenses = ExpenseManager.load()
        this_month_start = datetime.now().strftime('%Y-%m-01')
        
        # Filter this month
        month_expenses = [e for e in expenses if e.get('date') >= this_month_start]
        
        # Group by category
        categories = defaultdict(float)
        for expense in month_expenses:
            categories[expense.get('category')] += expense.get('amount', 0)
        
        # Include all categories for consistency
        for cat in CATEGORIES:
            categories.setdefault(cat, 0)
        
        # Sort by amount descending
        sorted_cats = sorted(categories.items(), key=lambda x: x[1], reverse=True)
        
        return jsonify({
            'success': True,
            'labels': [c[0] for c in sorted_cats],
            'data': [c[1] for c in sorted_cats]
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
