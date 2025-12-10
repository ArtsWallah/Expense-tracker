"""
Expense Tracker - Production Ready Flask Application
Complete refactor with modular architecture, security, and best practices
"""

from flask import Flask, render_template, request, jsonify
import os
from datetime import datetime

# Import API blueprints
from api.expenses import expenses_bp
from api.stats import settings_bp, budgets_bp, stats_bp
from api.upload import upload_bp
from models.database import CATEGORIES, PAYMENT_METHODS, CURRENCIES

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max upload size
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'static', 'uploads')

# Register API blueprints
app.register_blueprint(expenses_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(budgets_bp)
app.register_blueprint(stats_bp)
app.register_blueprint(upload_bp)


# ===== ERROR HANDLERS =====

@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors"""
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'error': 'Endpoint not found'}), 404
    return render_template('404.html'), 404


@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
    return render_template('500.html'), 500


@app.errorhandler(413)
def request_too_large(e):
    """Handle file too large"""
    return jsonify({'success': False, 'error': 'File too large. Maximum 5MB'}), 413


# ===== MAIN ROUTES =====

@app.route('/')
def index():
    """Main application page"""
    try:
        return render_template('index.html',
            categories=CATEGORIES,
            payment_methods=PAYMENT_METHODS,
            currencies=CURRENCIES,
            current_year=datetime.now().year
        )
    except Exception as e:
        return render_template('500.html'), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }), 200


# ===== UTILITY FUNCTIONS =====

@app.context_processor
def inject_constants():
    """Inject constants into templates"""
    return {
        'CATEGORIES': CATEGORIES,
        'PAYMENT_METHODS': PAYMENT_METHODS,
        'CURRENCIES': CURRENCIES
    }


# ===== LOGGING & MONITORING =====

@app.before_request
def log_request():
    """Log incoming requests"""
    if not request.path.startswith('/static'):
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {request.method} {request.path}")


# ===== CORS & SECURITY =====

@app.after_request
def set_security_headers(response):
    """Set additional security headers"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Set secure cookie settings
    response.headers['Set-Cookie'] = 'SameSite=Strict; HttpOnly; Secure'
    
    return response


# ===== APPLICATION ENTRY POINT =====

if __name__ == '__main__':
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Run development server
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=debug_mode,
        use_reloader=False
    )
