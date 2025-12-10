// Global state
let app = {
    expenses: [],
    budgets: {},
    settings: {},
    currentMonth: new Date(),
    currencySymbol: '$',
    sortColumn: 'date',
    sortOrder: 'desc',
    dailyChart: null,
    categoryChart: null
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadBudgets();
    await loadExpenses();
    setupEventListeners();
    updateDashboard();
});

// ============================================
// SETUP & INITIALIZATION
// ============================================

async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        app.settings = await response.json();
        app.currencySymbol = app.settings.currencies[app.settings.currency].symbol;
        document.getElementById('currencySelect').value = app.settings.currency;
        updateCurrencyDisplay();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function loadBudgets() {
    try {
        const response = await fetch('/api/budgets');
        app.budgets = await response.json();
    } catch (error) {
        console.error('Error loading budgets:', error);
    }
}

async function loadExpenses() {
    try {
        const response = await fetch('/api/expenses');
        app.expenses = await response.json();
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            changePage(page);
        });
    });

    // Header controls
    document.getElementById('prevMonth').addEventListener('click', () => {
        app.currentMonth.setMonth(app.currentMonth.getMonth() - 1);
        updateMonthDisplay();
        updateDashboard();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        app.currentMonth.setMonth(app.currentMonth.getMonth() + 1);
        updateMonthDisplay();
        updateDashboard();
    });

    document.getElementById('currencySelect').addEventListener('change', (e) => {
        app.settings.currency = e.target.value;
        app.currencySymbol = app.settings.currencies[e.target.value].symbol;
        saveSetting('currency', e.target.value);
        updateCurrencyDisplay();
    });

    // Form
    document.getElementById('expenseForm').addEventListener('submit', handleAddExpense);

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;

    // History page controls
    document.getElementById('searchExpenses').addEventListener('input', updateExpensesList);
    document.getElementById('filterCategory').addEventListener('change', updateExpensesList);

    document.querySelectorAll('.expenses-table th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (app.sortColumn === column) {
                app.sortOrder = app.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                app.sortColumn = column;
                app.sortOrder = 'desc';
            }
            updateExpensesList();
        });
    });

    document.getElementById('exportCsv').addEventListener('click', exportToCSV);
    document.getElementById('exportPdf').addEventListener('click', exportToPDF);

    // Settings
    document.getElementById('saveBudgetsBtn').addEventListener('click', saveBudgets);
}

// ============================================
// NAVIGATION
// ============================================

function changePage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page).classList.add('active');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
            document.querySelector('.page-title').textContent = link.querySelector('.nav-label').textContent;
        }
    });

    // Load page-specific data
    if (page === 'analytics') loadAnalytics();
    if (page === 'settings') loadSettings_UI();
    if (page === 'history') updateExpensesList();
}

// ============================================
// DASHBOARD
// ============================================

async function updateDashboard() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        // Update summary cards
        document.getElementById('monthSpent').textContent = formatCurrency(stats.month_spent);
        document.getElementById('weekSpent').textContent = formatCurrency(stats.week_spent);
        document.getElementById('todaySpent').textContent = formatCurrency(stats.today_spent);
        document.getElementById('totalSpent').textContent = formatCurrency(stats.total_spent);

        // Update budget bar
        const budgetPercentage = stats.month_budget > 0 ? (stats.month_spent / stats.month_budget) * 100 : 0;
        document.getElementById('budgetProgress').style.width = Math.min(budgetPercentage, 100) + '%';
        document.getElementById('budgetInfo').textContent = `${formatCurrency(stats.month_spent)} / ${formatCurrency(stats.month_budget)}`;
        document.getElementById('budgetPercentage').textContent = Math.round(budgetPercentage) + '%';

        // Update budget status
        const budgetRemaining = document.getElementById('budgetRemaining');
        if (stats.month_spent > stats.month_budget) {
            budgetRemaining.className = 'status-danger';
            budgetRemaining.textContent = formatCurrency(stats.month_spent - stats.month_budget) + ' over budget';
        } else {
            budgetRemaining.className = 'status-success';
            budgetRemaining.textContent = formatCurrency(stats.month_remaining) + ' remaining';
        }

        // Update quick stats
        document.getElementById('expenseCount').textContent = stats.expense_count;
        document.getElementById('highestExpense').textContent = formatCurrency(stats.highest_expense);
        document.getElementById('averageExpense').textContent = formatCurrency(stats.average_expense);

        // Update charts
        updateCharts();
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// ============================================
// CHARTS
// ============================================

async function updateCharts() {
    const month = app.currentMonth.toISOString().slice(0, 7);

    try {
        // Daily chart
        const dailyResponse = await fetch(`/api/charts/daily?month=${month}`);
        const dailyData = await dailyResponse.json();

        if (dailyData.isEmpty) {
            document.getElementById('dailyChartEmpty').style.display = 'flex';
            if (app.dailyChart) app.dailyChart.destroy();
        } else {
            document.getElementById('dailyChartEmpty').style.display = 'none';
            updateDailyChart(dailyData);
        }

        // Category chart
        const categoryResponse = await fetch(`/api/charts/category?month=${month}`);
        const categoryData = await categoryResponse.json();

        if (categoryData.isEmpty) {
            document.getElementById('categoryChartEmpty').style.display = 'flex';
            if (app.categoryChart) app.categoryChart.destroy();
        } else {
            document.getElementById('categoryChartEmpty').style.display = 'none';
            updateCategoryChart(categoryData);
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

function updateDailyChart(data) {
    const ctx = document.getElementById('dailyChart').getContext('2d');

    if (app.dailyChart) app.dailyChart.destroy();

    app.dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Daily Spending',
                data: data.data,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: '#3b82f6',
                borderRadius: 6,
                borderWidth: 0,
                hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: '#cbd5e1' } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        callback: value => app.currencySymbol + value.toFixed(0)
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            }
        }
    });
}

function updateCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    if (app.categoryChart) app.categoryChart.destroy();

    const colors = ['#3b82f6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

    app.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: colors.slice(0, data.labels.length),
                borderColor: '#1e293b',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1', padding: 15 }
                }
            }
        }
    });
}

// ============================================
// ADD EXPENSE
// ============================================

async function handleAddExpense(e) {
    e.preventDefault();

    const date = document.getElementById('expenseDate').value;
    const category = document.getElementById('expenseCategory').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const wallet = document.getElementById('walletSelect').value;
    const description = document.getElementById('expenseDescription').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const notes = document.getElementById('expenseNotes').value;

    // Clear previous errors
    clearFormErrors();

    // Validate
    let hasError = false;

    if (!date) {
        showFieldError('dateError', 'Date is required');
        hasError = true;
    }

    if (!category) {
        showFieldError('categoryError', 'Category is required');
        hasError = true;
    }

    if (!paymentMethod) {
        showFieldError('paymentError', 'Payment method is required');
        hasError = true;
    }

    if (description.length < 2) {
        showFieldError('descriptionError', 'Description must be at least 2 characters');
        hasError = true;
    }

    if (amount <= 0 || isNaN(amount)) {
        showFieldError('amountError', 'Amount must be greater than 0');
        hasError = true;
    }

    if (hasError) return;

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date, category, paymentMethod, wallet, description, amount, notes
            })
        });

        if (response.ok) {
            showFormMessage('✅ Expense added successfully!', 'success');
            document.getElementById('expenseForm').reset();
            document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
            await loadExpenses();
            updateDashboard();
            
            setTimeout(() => {
                document.getElementById('formMessage').style.display = 'none';
            }, 3000);
        } else {
            const error = await response.json();
            showFormMessage('❌ ' + error.error, 'error');
        }
    } catch (error) {
        showFormMessage('❌ Error adding expense', 'error');
        console.error('Error:', error);
    }
}

function clearFormErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
    document.querySelectorAll('.form-group').forEach(el => {
        el.classList.remove('error');
    });
}

function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(fieldId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.parentElement.classList.add('error');
    }
}

function showFormMessage(message, type) {
    const msgEl = document.getElementById('formMessage');
    msgEl.textContent = message;
    msgEl.className = `form-message ${type}`;
    msgEl.style.display = 'block';
}

// ============================================
// EXPENSE HISTORY
// ============================================

function updateExpensesList() {
    const searchTerm = document.getElementById('searchExpenses').value.toLowerCase();
    const filterCategory = document.getElementById('filterCategory').value;

    let filtered = app.expenses.filter(exp => {
        const matchesSearch = exp.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !filterCategory || exp.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
        let aVal, bVal;

        if (app.sortColumn === 'date') {
            aVal = new Date(a.date);
            bVal = new Date(b.date);
        } else if (app.sortColumn === 'category') {
            aVal = a.category;
            bVal = b.category;
        } else if (app.sortColumn === 'amount') {
            aVal = a.amount;
            bVal = b.amount;
        }

        if (app.sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    // Render
    const tbody = document.getElementById('expensesList');

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6" class="empty-state-cell">
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>No expenses found. <a href="#" class="link-primary" onclick="changePage('add-expense'); return false;">Add your first expense</a></p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(exp => `
        <tr>
            <td>${new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td>${getCategoryEmoji(exp.category)} ${exp.category}</td>
            <td>${exp.description}</td>
            <td>${getPaymentIcon(exp.payment_method)} ${exp.payment_method}</td>
            <td style="color: #ef4444; font-weight: bold;">${formatCurrency(exp.amount)}</td>
            <td>
                <button class="btn-delete" onclick="deleteExpense('${exp.id}')" title="Delete">🗑️ Delete</button>
            </td>
        </tr>
    `).join('');
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
        const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        if (response.ok) {
            await loadExpenses();
            updateExpensesList();
            updateDashboard();
            showFormMessage('✅ Expense deleted!', 'success');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
    }
}

// ============================================
// ANALYTICS
// ============================================

async function loadAnalytics() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        const grid = document.getElementById('analyticsGrid');
        const empty = document.getElementById('analyticsEmpty');

        if (app.expenses.length === 0) {
            grid.style.display = 'none';
            empty.style.display = 'flex';
            return;
        }

        grid.style.display = 'grid';
        empty.style.display = 'none';

        let html = '';
        for (const [category, budget] of Object.entries(app.budgets)) {
            if (category === 'total') continue;

            const spent = stats.budget_status[category]?.spent || 0;
            const percentage = stats.budget_status[category]?.percentage || 0;
            const status = stats.budget_status[category]?.status || 'success';

            html += `
                <div class="budget-card ${status}">
                    <h4>${getCategoryEmoji(category)} ${category}</h4>
                    <div class="budget-card-progress">
                        <div class="budget-card-progress-bar" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="budget-card-info">
                        <span>${formatCurrency(spent)} / ${formatCurrency(budget)}</span>
                        <span>${Math.round(percentage)}%</span>
                    </div>
                </div>
            `;
        }

        grid.innerHTML = html;
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// ============================================
// SETTINGS
// ============================================

function loadSettings_UI() {
    loadWalletsUI();
    loadBudgetsUI();
}

function loadWalletsUI() {
    const html = app.settings.wallets.map(wallet => `
        <div class="wallet-item">
            <span>${wallet.name}</span>
            <span>Balance: ${formatCurrency(wallet.balance)}</span>
        </div>
    `).join('');

    document.getElementById('walletsList').innerHTML = html;
}

function loadBudgetsUI() {
    const html = Object.entries(app.budgets)
        .filter(([key]) => key !== 'total')
        .map(([category, amount]) => `
            <div class="budget-item">
                <label>${getCategoryEmoji(category)} ${category}</label>
                <input type="number" data-category="${category}" value="${amount}" step="0.01" min="0">
            </div>
        `).join('');

    document.getElementById('budgetsList').innerHTML = html;
}

async function saveBudgets() {
    const inputs = document.querySelectorAll('.budget-item input');
    const updated = { total: 0 };

    inputs.forEach(input => {
        const category = input.dataset.category;
        const value = parseFloat(input.value) || 0;
        updated[category] = value;
        updated.total += value;
    });

    try {
        const response = await fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });

        if (response.ok) {
            app.budgets = updated;
            showFormMessage('✅ Budgets saved successfully!', 'success');
            setTimeout(() => {
                document.getElementById('formMessage').style.display = 'none';
            }, 3000);
        }
    } catch (error) {
        console.error('Error saving budgets:', error);
    }
}

// ============================================
// EXPORT
// ============================================

function exportToCSV() {
    if (app.expenses.length === 0) {
        alert('No expenses to export');
        return;
    }

    let csv = 'Date,Category,Description,Amount,Payment Method,Wallet\n';
    app.expenses.forEach(exp => {
        csv += `"${exp.date}","${exp.category}","${exp.description}","${exp.amount}","${exp.payment_method}","${exp.wallet}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${app.currentMonth.toISOString().slice(0, 7)}.csv`;
    a.click();
}

function exportToPDF() {
    alert('PDF export feature requires backend PDF library. Use browser Print to PDF instead (Ctrl+P)');
}

// ============================================
// UTILITIES
// ============================================

function formatCurrency(amount) {
    return app.currencySymbol + amount.toFixed(2);
}

function updateCurrencyDisplay() {
    document.getElementById('amountCurrencySymbol').textContent = app.currencySymbol;
    updateDashboard();
}

function updateMonthDisplay() {
    const monthYear = app.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    document.getElementById('currentMonth').textContent = monthYear;
}

function getCategoryEmoji(category) {
    const emojis = {
        'Food': '🍔', 'Transportation': '🚗', 'Entertainment': '🎬',
        'Shopping': '🛍️', 'Utilities': '⚡', 'Healthcare': '🏥', 'Others': '📦'
    };
    return emojis[category] || '📝';
}

function getPaymentIcon(method) {
    const icons = {
        'Cash': '💵', 'UPI': '📱', 'Card': '💳', 'Bank Transfer': '🏦'
    };
    return icons[method] || '💰';
}

async function saveSetting(key, value) {
    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [key]: value })
        });
    } catch (error) {
        console.error('Error saving setting:', error);
    }
}
