# Expense Tracker - Python Flask Web Application

A modern, responsive expense tracking application built with Python Flask and vanilla JavaScript with Chart.js for visualization.

## 🚀 Quick Deploy to Vercel

**Easiest Method:**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select "Import Git Repository" 
4. Connect your GitHub repo with this code
5. Click "Deploy" - Done! 🎉

**Manual Method:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel
```

Your app will be live at a URL like `your-app.vercel.app`

## Features

✨ **Core Features**
- Add, view, and delete expenses
- Categorize expenses (Food, Transportation, Entertainment, Shopping, Utilities, Healthcare, Others)
- Real-time data visualization with charts
- Filter expenses by category and month
- Sort expenses by amount
- Responsive design for all devices

📊 **Analytics**
- Daily expenses line chart
- Category distribution doughnut chart
- Summary statistics (Monthly, Weekly, Daily totals)
- Average daily expense calculation

💾 **Data Management**
- Persistent storage using JSON file
- Sample data included for demonstration
- Easy data export/import

## Project Structure

```
expense-tracker/
├── app.py                 # Flask application & API routes
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
