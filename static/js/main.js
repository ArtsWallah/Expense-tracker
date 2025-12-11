/**
 * EXPENSE TRACKER - MAIN APPLICATION
 * Core functionality and state management
 */

// ===== APPLICATION STATE =====

const app = {
    expenses: [],
    budgets: {},
    settings: {},
    currentMonth: new Date(),
    currencySymbol: '₹',
    sortColumn: 'date',
    sortOrder: 'desc',
    charts: {},
    dashboardUpdateTimeout: null,
    chartsUpdateTimeout: null,
    cacheTimeout: 60000, // 60 seconds
    lastUpdate: {},

    // Utility: Debounce function to prevent excessive calls
    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    // Utility: Cache API response with timeout
    setCache(key, value) {
        this.lastUpdate[key] = { value, timestamp: Date.now() };
    },

    // Utility: Get cached value if still fresh
    getCache(key) {
        const cached = this.lastUpdate[key];
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.value;
        }
        return null;
    },

    // Utility: Clear cache for specific key
    clearCache(key) {
        delete this.lastUpdate[key];
    },    // Initialize application
    init: async function() {
        console.log('🚀 Initializing Expense Tracker v2.0');
        
        // Load data from localStorage
        await this.loadData();
        
        // Initialize UI
        this.setupEventListeners();
        this.updateTheme();
        this.updateMonthDisplay();
        
        // Load initial data
        await this.loadExpenses();
        await this.loadSettings();
        await this.loadBudgets();
        
        // Update UI
        this.updateDashboard();
        
        console.log('✅ Initialization complete');
    },
    
    // Setup all event listeners
    setupEventListeners: function() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.getAttribute('data-page');
                changePage(page);
                
                // Close mobile menu after selection
                const navMenu = document.querySelector('.nav-menu');
                if (navMenu && navMenu.classList.contains('open')) {
                    navMenu.classList.remove('open');
                }
            });
        });
        
        // Menu toggle (mobile)
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const navMenu = document.querySelector('.nav-menu');
                navMenu.classList.toggle('open');
            });
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const navMenu = document.querySelector('.nav-menu');
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.getElementById('menuToggle');
            
            if (navMenu && !sidebar.contains(e.target) && !menuToggle?.contains(e.target)) {
                navMenu.classList.remove('open');
            }
        });
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Month navigation
        const prevMonth = document.getElementById('prevMonth');
        const nextMonth = document.getElementById('nextMonth');
        if (prevMonth) prevMonth.addEventListener('click', () => this.previousMonth());
        if (nextMonth) nextMonth.addEventListener('click', () => this.nextMonth());
        
        // Currency selector
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.addEventListener('change', (e) => this.setCurrency(e.target.value));
        }
        
        // Form submission
        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => this.handleAddExpense(e));
            // Debounce real-time validation (300ms)
            const debouncedValidate = this.debounce(() => this.validateForm(), 300);
            expenseForm.addEventListener('change', debouncedValidate);
            expenseForm.addEventListener('input', debouncedValidate);
        }
        
        // File upload
        const receiptInput = document.getElementById('receipt');
        if (receiptInput) {
            receiptInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        
        // Search and filters (with debouncing)
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const debouncedSearch = this.debounce(() => this.filterExpenses(), 300);
            searchInput.addEventListener('input', debouncedSearch);
        }
        
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterExpenses());
        }
        
        const paymentFilter = document.getElementById('paymentFilter');
        if (paymentFilter) {
            paymentFilter.addEventListener('change', () => this.filterExpenses());
        }
        
        // Export buttons
        const exportCSV = document.getElementById('exportCSV');
        if (exportCSV) {
            exportCSV.addEventListener('click', () => this.exportToCSV());
        }
        
        const exportPDF = document.getElementById('exportPDF');
        if (exportPDF) {
            exportPDF.addEventListener('click', () => this.exportToPDF());
        }
        
        // Quick add
        const quickAddBtn = document.getElementById('quickAddBtn');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => openModal('quickAddModal'));
        }
        
        const quickAddForm = document.getElementById('quickAddForm');
        if (quickAddForm) {
            quickAddForm.addEventListener('submit', (e) => this.handleQuickAdd(e));
        }
        
        // Budget form (use debounced handler)
        const budgetForm = document.getElementById('budgetForm');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => debouncedBudgetUpdate(e));
        }
        
        // Date picker default to today
        const expenseDate = document.getElementById('expenseDate');
        if (expenseDate) {
            expenseDate.valueAsDate = new Date();
        }
    },
    
    // ===== THEME MANAGEMENT =====
    
    toggleTheme: function() {
        const body = document.body;
        const isDark = body.classList.contains('light-theme');
        
        if (isDark) {
            body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        }
    },
    
    updateTheme: function() {
        const theme = localStorage.getItem('theme') || 'dark';
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        }
    },
    
    // ===== DATA MANAGEMENT =====
    
    loadData: async function() {
        // Load from localStorage (for offline support)
        const saved = localStorage.getItem('expenseTrackerData');
        if (saved) {
            const data = JSON.parse(saved);
            this.expenses = data.expenses || [];
            this.budgets = data.budgets || {};
            this.settings = data.settings || {};
        }
    },
    
    saveData: function() {
        const data = {
            expenses: this.expenses,
            budgets: this.budgets,
            settings: this.settings
        };
        localStorage.setItem('expenseTrackerData', JSON.stringify(data));
    },
    
    loadExpenses: async function() {
        try {
            const response = await fetch('/api/expenses');
            const data = await response.json();
            if (data.success) {
                this.expenses = data.data || [];
                this.saveData();
            }
        } catch (error) {
            console.error('Failed to load expenses:', error);
        }
    },
    
    loadSettings: async function() {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            if (data.success) {
                this.settings = data.data || {};
                this.currencySymbol = this.settings.currency ? 
                    (data.currencies[this.settings.currency]?.symbol || '₹') : '₹';
                
                // Set currency selector
                const currencySelect = document.getElementById('currencySelect');
                if (currencySelect) {
                    currencySelect.value = this.settings.currency || 'INR';
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    },
    
    loadBudgets: async function() {
        try {
            const response = await fetch('/api/budgets');
            const data = await response.json();
            if (data.success) {
                this.budgets = data.data || {};
            }
        } catch (error) {
            console.error('Failed to load budgets:', error);
        }
    },
    
    // ===== EXPENSE OPERATIONS =====
    
    addExpense: async function(expenseData) {
        try {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(expenseData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.expenses.push(data.data);
                this.saveData();
                return { success: true, data: data.data };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Error adding expense:', error);
            return { success: false, error: error.message };
        }
    },
    
    deleteExpense: async function(expenseId) {
        try {
            const response = await fetch(`/api/expenses/${expenseId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.expenses = this.expenses.filter(e => e.id !== expenseId);
                this.saveData();
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ===== MONTH NAVIGATION =====
    
    previousMonth: function() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.updateMonthDisplay();
        this.updateDashboard();
    },
    
    nextMonth: function() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.updateMonthDisplay();
        this.updateDashboard();
    },
    
    updateMonthDisplay: function() {
        const options = { month: 'long', year: 'numeric' };
        const monthStr = this.currentMonth.toLocaleDateString('en-US', options);
        const monthDisplay = document.getElementById('monthDisplay');
        if (monthDisplay) {
            monthDisplay.textContent = monthStr;
        }
    },
    
    // ===== CURRENCY =====
    
    setCurrency: async function(currency) {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currency: currency })
            });
            
            const data = await response.json();
            if (data.success) {
                this.settings.currency = currency;
                // Update symbol (you would get this from the response)
                const symbols = {
                    'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹',
                    'BDT': '৳', 'JPY': '¥', 'AUD': 'A$', 'CAD': 'C$',
                    'CHF': 'CHF', 'SGD': 'S$'
                };
                this.currencySymbol = symbols[currency] || '₹';
                this.updateCurrencyDisplay();
                this.updateDashboard();
            }
        } catch (error) {
            console.error('Failed to set currency:', error);
        }
    },
    
    updateCurrencyDisplay: function() {
        document.querySelectorAll('.currency-symbol, .amountSymbol').forEach(el => {
            el.textContent = this.currencySymbol;
        });
    }
};

// ===== PAGE NAVIGATION =====

function changePage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const page = document.getElementById(`${pageName}-page`);
    if (page) {
        page.classList.add('active');
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        }
    });
    
    // Close mobile menu
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.remove('open');
    }
    
    // Load page-specific data
    if (pageName === 'history') {
        app.updateExpensesList();
    } else if (pageName === 'analytics') {
        app.loadAnalytics();
    } else if (pageName === 'settings') {
        app.loadSettingsUI();
    }
    
    // Scroll to top
    document.querySelector('.pages-container').scrollTop = 0;
}

// ===== MODALS =====

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// ===== TOAST NOTIFICATIONS =====

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
