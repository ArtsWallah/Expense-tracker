# 💰 Expense Tracker v2.0 - Production Ready

A modern, professional-grade expense tracking application with advanced features, beautiful UI, and enterprise-level security. Built with Flask, vanilla JavaScript, and modern CSS.

## ✨ Key Features

### 🎯 Core Functionality
- ✅ **Add Expenses** - Smart form with real-time validation
- ✅ **Track Expenses** - Advanced search, filter, sort, and pagination
- ✅ **Budget Management** - Monthly budgets with visual progress indicators
- ✅ **Analytics** - Interactive charts and spending insights
- ✅ **Multi-Currency** - 10 currency options with instant conversion
- ✅ **Receipt Management** - Upload, store, and preview receipts
- ✅ **Export Data** - CSV and PDF export capabilities

### 🎨 Modern UI/UX
- 🌙 **Dark/Light Mode** - Toggle-able theme with persistence
- 📱 **Fully Responsive** - Perfect on desktop, tablet, and mobile
- ✨ **Smooth Animations** - Page transitions, hover effects, loading states
- ♿ **Accessible** - WCAG compliant, keyboard navigation
- 🚀 **High Performance** - Optimized load times and smooth interactions

### 💳 Payment & Wallet System
- Multiple payment methods (Cash, Card, UPI, Bank Transfer)
- Wallet tracking (Cash, Bank, UPI, Credit Card)
- Payment method indicators throughout app
- Quick payment method switcher

### 📋 Advanced Features
- Receipt uploads (JPG, PNG, PDF - Max 3MB)
- Receipt preview and modal viewer
- Quick-add modal for rapid entry
- Expense duplication
- Tags and notes support
- Recurring expense tracking
- Quick statistics dashboard

### 📊 Rich Analytics
- Daily spending trend (Bar chart)
- Category breakdown (Doughnut chart)
- Budget status per category
- Monthly spending patterns
- Spending statistics
- Category-wise budgets

### 🔒 Enterprise Security
- Input validation (client & server)
- XSS/SQLi protection
- CSRF protection
- File upload validation
- Secure headers (Flask-Talisman)
- Data sanitization
- Safe data storage

## 🛠️ Tech Stack

### Backend
- Flask 2.3.3 - Lightweight Python framework
- Python 3.8+ - Fast and reliable
- JSON Storage - Simple persistence (upgradeable to DB)

### Frontend
- HTML5 - Semantic markup
- CSS3 - Modern styling with variables and animations
- Vanilla JavaScript ES6+ - No dependencies
- Chart.js - Beautiful data visualization
- Font Awesome - Icon library

### Infrastructure
- Vercel - One-click deployment
- Render - Alternative hosting
- Docker Ready - For containerization

## 📥 Installation

### Requirements
- Python 3.8+
- pip package manager
- Modern browser

### Local Setup

```bash
# Clone repository
git clone https://github.com/ArtsWallah/Expense-tracker.git
cd Expense-tracker

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run application
python app_new.py

# Open browser
# http://localhost:5000
```

## 🚀 Deployment

### Vercel (1-Click Deploy)
1. Push code to GitHub
2. Go to vercel.com
3. Click "New Project"
4. Import your repository
5. Click "Deploy"
6. Done! Live in seconds

### Render.com
1. Create account at render.com
2. New Web Service
3. Connect GitHub
4. Build: `pip install -r requirements.txt`
5. Start: `python app_new.py`
6. Deploy

## 📁 Project Structure

```
expense-tracker/
├── api/                    # API routes
│   ├── expenses.py        # CRUD operations
│   ├── stats.py           # Statistics & analytics
│   └── upload.py          # File uploads
├── models/                 # Data models
│   └── database.py        # DB operations
├── utils/                  # Utilities
│   ├── validators.py      # Input validation
│   └── filehandler.py     # File handling
├── templates/              # HTML templates
│   ├── index_new.html     # Main app
│   ├── 404.html           # Not found
│   └── 500.html           # Server error
├── static/
│   ├── css/               # Stylesheets (600+ lines)
│   │   ├── main.css
│   │   ├── responsive.css
│   │   ├── modal.css
│   │   └── animations.css
│   ├── js/                # JavaScript (2000+ lines)
│   │   ├── main.js
│   │   ├── api.js
│   │   ├── ui.js
│   │   └── charts.js
│   └── uploads/           # Receipts
├── data/                   # Data files
│   ├── expenses.json
│   ├── settings.json
│   └── budgets.json
├── app_new.py             # Main app
├── requirements.txt       # Dependencies
└── README.md              # This file
```
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── styles.css        # Styling
    └── script.js         # Frontend JavaScript
```

## Installation

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Setup

1. **Clone or navigate to the project directory**
   ```bash
   cd "c:\Users\dell\Desktop\expense tracker"
   ```

2. **Create a virtual environment (optional but recommended)**
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. **Start the Flask server**
   ```bash
   python app.py
   ```

2. **Open in your browser**
   - Navigate to `http://localhost:5000`
   - The application will load with sample data

## Usage

### Adding an Expense
1. Fill in the "Add New Expense" form on the left sidebar
2. Select date, category, description, and amount
3. Click "Add Expense"
4. The expense will be saved and charts will update

### Filtering Expenses
1. Use the "Filters" section in the sidebar
2. Select a category or month to filter results
3. Expenses list and charts update automatically

### Deleting Expenses
1. Click the "Delete" button next to any expense
2. The expense will be removed and data will update

### Sorting
1. Click "Sort by Amount" button to toggle between ascending and descending order

## API Endpoints

- `GET /` - Render main page
- `GET /api/expenses` - Get all expenses (with optional filtering)
- `POST /api/expenses` - Add new expense
- `DELETE /api/expenses/<index>` - Delete expense by index
- `GET /api/stats` - Get expense statistics
- `GET /api/charts/daily` - Get daily expenses data
- `GET /api/charts/category` - Get category distribution data

## Customization

### Categories
Edit the category options in both `app.py` and `templates/index.html`:
- Food 🍔
- Transportation 🚗
- Entertainment 🎬
- Shopping 🛍️
- Utilities ⚡
- Healthcare 🏥
- Others 📦

### Styling
Modify `static/styles.css` to customize colors:
- Primary color: `--primary-color: #2ecc71`
- Secondary color: `--secondary-color: #3498db`
- Background: `--dark-bg: #1a1a2e`

## Data Storage

Expenses are stored in `expenses.json` file created automatically on first use. The file format:

```json
[
  {
    "date": "2024-12-01",
    "category": "Food",
    "description": "Lunch at restaurant",
    "amount": 35.50
  }
]
```

## Responsive Design

- **Desktop**: Full sidebar layout with all features
- **Tablet**: Single column with responsive grids
- **Mobile**: Optimized for touch with stacked elements

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Future Enhancements

- User authentication & multiple user support
- Budget setting & alerts
- Monthly/yearly reports
- Data export (CSV, PDF)
- Recurring expenses
- Receipt image upload
- Mobile app version

## License

This project is open source and available for personal and educational use.

## Support

For issues or questions, please create an issue in the project repository.
