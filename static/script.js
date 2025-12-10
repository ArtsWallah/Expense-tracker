// Initialize state
let dailyChart, categoryChart;
let expenses = [];
let budgets = {};
let sortAscending = true;
let currentCurrency = 'USD';
let currencySymbol = '$';
let currencyData = {};
let currentViewMonth = new Date();

// Set today's date as default
document.getElementById('expenseDate').valueAsDate = new Date();

// Initialize app on load
document.addEventListener('DOMContentLoaded', async function () {
    await loadSettings();
    await loadBudgets();
    await loadExpenses();
    updateUI();
    setupEventListeners();
    updateMonthDisplay();
});

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Currency selector
    document.getElementById('currencySelect').addEventListener('change', function (e) {
        currentCurrency = e.target.value;
        currencySymbol = currencyData[currentCurrency]?.symbol || '$';
        saveCurrencySetting(currentCurrency);
        updateUI();
    });

    // Month navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentViewMonth.setMonth(currentViewMonth.getMonth() - 1);
        updateMonthDisplay();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentViewMonth.setMonth(currentViewMonth.getMonth() + 1);
        updateMonthDisplay();
    });

    // Add expense form
    document.getElementById('expenseForm').addEventListener('submit', handleAddExpense);

    // Filters
    document.querySelectorAll('input[name="filterCategories"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateUI);
    });
    document.getElementById('filterMonth').addEventListener('change', updateUI);

    // History controls
    document.getElementById('clearCategoriesBtn').addEventListener('click', clearFilters);
    document.getElementById('sortBtn').addEventListener('click', toggleSort);
    document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);

    // Table sorting
    document.querySelectorAll('.expenses-table th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const sortType = th.dataset.sort;
            sortExpensesBy(sortType);
        });
    });

    // Budget settings
    document.getElementById('saveBudgetsBtn').addEventListener('click', saveBudgets);
}

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const section = e.target.dataset.section;

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.classList.add('active');

    // Show relevant section
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');

    // Load section-specific data
    if (section === 'analytics') {
        loadBudgetAnalytics();
    } else if (section === 'settings') {
        loadSettingsUI();
    } else if (section === 'history') {
        updateExpensesList();
    }
}

// Load Settings
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        currencyData = settings.currencies;
        currentCurrency = settings.currency;
        currencySymbol = currencyData[currentCurrency]?.symbol || '$';
        document.getElementById('currencySelect').value = currentCurrency;
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save Currency Setting
async function saveCurrencySetting(currency) {
    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currency })
        });
    } catch (error) {
        console.error('Error saving currency:', error);
    }
}

// Load Budgets
async function loadBudgets() {
    try {
        const response = await fetch('/api/budgets');
        budgets = await response.json();
    } catch (error) {
        console.error('Error loading budgets:', error);
    }
}

// Load Expenses
async function loadExpenses() {
    try {
        const response = await fetch('/api/expenses');
        expenses = await response.json();
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

// Add Expense
async function handleAddExpense(e) {
    e.preventDefault();

    // Clear previous errors
    clearErrors();

    const date = document.getElementById('expenseDate').value;
    const description = document.getElementById('expenseDescription').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    const wallet = document.getElementById('wallet').value;

    // Get selected categories
    const selectedCategories = Array.from(document.querySelectorAll('input[name="categories"]:checked'))
        .map(checkbox => checkbox.value);

    // Validation
    let hasError = false;

    if (!date) {
        showError('Date is required');
        hasError = true;
    }

    if (selectedCategories.length === 0) {
        document.getElementById('categoryError').textContent = 'Select at least one category';
        document.getElementById('categoryError').classList.add('show');
        hasError = true;
    }

    if (!description || description.length < 2) {
        document.getElementById('descriptionError').textContent = 'Description must be at least 2 characters';
        document.getElementById('descriptionError').classList.add('show');
        hasError = true;
    }

    if (!amount || amount <= 0) {
        document.getElementById('amountError').textContent = 'Amount must be greater than 0';
        document.getElementById('amountError').classList.add('show');
        document.getElementById('expenseAmount').classList.add('error');
        hasError = true;
    }

    if (!paymentMethod || !wallet) {
        showError('Payment method and wallet are required');
        hasError = true;
    }

    if (hasError) return;

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date,
                categories: selectedCategories,
                description,
                amount,
                payment_method: paymentMethod,
                wallet
            })
        });

        if (response.ok) {
            showFormMessage('✅ Expense added successfully!', 'success');
            document.getElementById('expenseForm').reset();
            document.getElementById('expenseDate').valueAsDate = new Date();
            document.querySelectorAll('input[name="categories"]').forEach(cb => cb.checked = false);
            await loadExpenses();
            updateUI();
            setTimeout(() => {
                document.getElementById('formMessage').innerHTML = '';
                document.getElementById('formMessage').className = 'form-message';
            }, 2000);
        } else {
            const error = await response.json();
            showFormMessage(`❌ ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        showFormMessage('❌ Error adding expense', 'error');
    }
}

// Form message
function showFormMessage(message, type) {
    const formMessage = document.getElementById('formMessage');
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}

function showError(message) {
    showFormMessage(`❌ ${message}`, 'error');
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
    document.querySelectorAll('input.error, select.error').forEach(el => {
        el.classList.remove('error');
    });
}

// Filter Expenses
function getFilteredExpenses() {
    const selectedCategories = Array.from(document.querySelectorAll('input[name="filterCategories"]:checked'))
        .map(checkbox => checkbox.value);
    const selectedMonth = document.getElementById('filterMonth').value;

    return expenses.filter(expense => {
        const categoryMatch = selectedCategories.length === 0 ||
            selectedCategories.some(cat => expense.categories.includes(cat));
        const monthMatch = !selectedMonth || expense.date.startsWith(selectedMonth);
        return categoryMatch && monthMatch;
    });
}

// Clear Filters
function clearFilters() {
    document.querySelectorAll('input[name="filterCategories"]').forEach(cb => cb.checked = false);
    document.getElementById('filterMonth').value = '';
    updateUI();
}

// Sort Expenses
function toggleSort() {
    if (sortAscending) {
        expenses.sort((a, b) => b.amount - a.amount);
        document.getElementById('sortBtn').textContent = '↕️ Sort by Amount (Lowest First)';
    } else {
        expenses.sort((a, b) => a.amount - b.amount);
        document.getElementById('sortBtn').textContent = '↕️ Sort by Amount (Highest First)';
    }
    sortAscending = !sortAscending;
    updateExpensesList();
}

function sortExpensesBy(type) {
    const filtered = getFilteredExpenses();
    if (type === 'date') {
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (type === 'amount') {
        filtered.sort((a, b) => b.amount - a.amount);
    }
    displayExpensesTable(filtered);
}

// Update Month Display
function updateMonthDisplay() {
    const monthYear = currentViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    document.getElementById('currentMonth').textContent = monthYear;
}

// Update UI
async function updateUI() {
    const filtered = getFilteredExpenses();

    try {
        const statsResponse = await fetch('/api/stats');
        const stats = await statsResponse.json();

        document.getElementById('totalBalance').textContent = currencySymbol + stats.total_balance.toFixed(2);
        document.getElementById('monthlyTotal').textContent = currencySymbol + stats.monthly_total.toFixed(2);
        document.getElementById('weeklyTotal').textContent = currencySymbol + stats.weekly_total.toFixed(2);
        document.getElementById('todayTotal').textContent = currencySymbol + stats.today_total.toFixed(2);
        document.getElementById('averageDaily').textContent = currencySymbol + stats.average_daily.toFixed(2);
    } catch (error) {
        console.error('Error loading stats:', error);
    }

    updateExpensesList(filtered);
    updateCharts();
    await updateSummary();
}

// Update Summary
async function updateSummary() {
    try {
        const response = await fetch('/api/expenses/summary');
        const summary = await response.json();

        document.getElementById('summaryCount').textContent = summary.count || 0;
        document.getElementById('summaryTotal').textContent = currencySymbol + (summary.total || 0).toFixed(2);
        document.getElementById('summaryHighest').textContent = currencySymbol + (summary.highest || 0).toFixed(2);
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// Update Expenses List
function updateExpensesList(expenseList) {
    const list = document.getElementById('expensesList');

    if (!expenseList || expenseList.length === 0) {
        list.innerHTML = `
            <tr class="empty-row">
                <td colspan="6" class="empty-state">
                    <div class="empty-state-content">
                        <span class="empty-icon">📭</span>
                        <p>No expenses yet. Start tracking your spending!</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    displayExpensesTable(expenseList);
}

function displayExpensesTable(expenseList) {
    const list = document.getElementById('expensesList');
    list.innerHTML = expenseList.map((expense, index) => {
        const actualIndex = expenses.indexOf(expense);
        return `
        <tr>
            <td>${new Date(expense.date).toLocaleDateString()}</td>
            <td>${expense.categories.map(cat => getCategoryEmoji(cat) + ' ' + cat).join(', ')}</td>
            <td>${expense.description}</td>
            <td>${getPaymentIcon(expense.payment_method)} ${expense.payment_method}</td>
            <td style="color: var(--danger-color); font-weight: bold;">-${currencySymbol}${expense.amount.toFixed(2)}</td>
            <td>
                <button class="delete-btn" onclick="deleteExpense(${actualIndex})" title="Delete">🗑️</button>
            </td>
        </tr>
        `;
    }).join('');
}

// Delete Expense
async function deleteExpense(index) {
    if (confirm('Are you sure you want to delete this expense?')) {
        try {
            const response = await fetch(`/api/expenses/${index}`, { method: 'DELETE' });
            if (response.ok) {
                await loadExpenses();
                updateUI();
                showFormMessage('✅ Expense deleted!', 'success');
                setTimeout(() => {
                    document.getElementById('formMessage').innerHTML = '';
                }, 2000);
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    }
}

// Get Category Emoji
function getCategoryEmoji(category) {
    const emojis = {
        'Food': '🍔', 'Transportation': '🚗', 'Entertainment': '🎬',
        'Shopping': '🛍️', 'Utilities': '⚡', 'Healthcare': '🏥', 'Others': '📦'
    };
    return emojis[category] || '📝';
}

// Get Payment Icon
function getPaymentIcon(method) {
    const icons = {
        'Cash': '💵', 'UPI': '📱', 'Card': '💳', 'Bank': '🏦'
    };
    return icons[method] || '💰';
}

// Update Charts
async function updateCharts() {
    const category = Array.from(document.querySelectorAll('input[name="filterCategories"]:checked'))
        .map(checkbox => checkbox.value);
    const month = document.getElementById('filterMonth').value;

    const params = new URLSearchParams();
    category.forEach(cat => params.append('categories', cat));
    if (month) params.append('month', month);

    try {
        const dailyResponse = await fetch(`/api/charts/daily?${params}`);
        const dailyData = await dailyResponse.json();
        updateDailyChart(dailyData);

        const categoryResponse = await fetch(`/api/charts/category?${params}`);
        const categoryData = await categoryResponse.json();
        updateCategoryChart(categoryData);
    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

// Update Daily Chart
function updateDailyChart(data) {
    const ctx = document.getElementById('dailyChart').getContext('2d');

    if (dailyChart) dailyChart.destroy();

    dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Daily Expenses',
                data: data.data,
                backgroundColor: 'rgba(46, 204, 113, 0.7)',
                borderColor: '#2ecc71',
                borderWidth: 2,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(46, 204, 113, 0.9)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, labels: { color: '#ecf0f1' } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#95a5a6',
                        callback: value => currencySymbol + value.toFixed(0)
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#95a5a6' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

// Update Category Chart
function updateCategoryChart(data) {
    const emptyMessage = document.getElementById('emptyChartMessage');
    const canvas = document.getElementById('categoryChart');

    if (data.isEmpty) {
        emptyMessage.style.display = 'block';
        canvas.style.display = 'none';
        if (categoryChart) categoryChart.destroy();
        return;
    }

    emptyMessage.style.display = 'none';
    canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    if (categoryChart) categoryChart.destroy();

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384'];

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: colors.slice(0, data.labels.length),
                borderColor: '#1a1a2e',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ecf0f1', padding: 15 }
                }
            }
        }
    });
}

// Budget Analytics
async function loadBudgetAnalytics() {
    const container = document.querySelector('.analytics-container .budget-grid');
    let html = '';

    for (const [category, budget] of Object.entries(budgets)) {
        const spent = getMonthlySpentByCategory(category);
        const percentage = (spent / budget) * 100;
        const status = percentage > 100 ? 'danger' : percentage > 80 ? 'warning' : 'success';

        html += `
        <div class="budget-card ${status}">
            <h4>${getCategoryEmoji(category)} ${category}</h4>
            <div class="budget-bar">
                <div class="budget-progress" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div class="budget-stats">
                <span>${currencySymbol}${spent.toFixed(2)} / ${currencySymbol}${budget.toFixed(2)}</span>
                <span>${Math.round(percentage)}%</span>
            </div>
        </div>
        `;
    }

    container.innerHTML = html;
}

function getMonthlySpentByCategory(category) {
    return expenses
        .filter(e => e.categories.includes(category) && e.date.startsWith(new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0')))
        .reduce((sum, e) => sum + e.amount, 0);
}

// Settings UI
function loadSettingsUI() {
    loadWalletsUI();
    loadBudgetsUI();
}

function loadWalletsUI() {
    const settings = { wallets: DEFAULT_SETTINGS.wallets };
    const container = document.getElementById('walletsList');
    container.innerHTML = settings.wallets.map(wallet => `
        <div class="wallet-item">
            <span>${wallet.name}</span>
            <span>Balance: ${currencySymbol}${wallet.balance.toFixed(2)}</span>
        </div>
    `).join('');
}

function loadBudgetsUI() {
    const container = document.getElementById('budgetsList');
    container.innerHTML = Object.entries(budgets).map(([category, budget]) => `
        <div class="budget-item">
            <label>${getCategoryEmoji(category)} ${category}</label>
            <input type="number" value="${budget}" data-category="${category}" step="0.01" min="0">
        </div>
    `).join('');
}

async function saveBudgets() {
    const budgetInputs = document.querySelectorAll('.budget-item input');
    const updatedBudgets = {};

    budgetInputs.forEach(input => {
        const category = input.dataset.category;
        updatedBudgets[category] = parseFloat(input.value) || 0;
    });

    try {
        await fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedBudgets)
        });
        budgets = updatedBudgets;
        showFormMessage('✅ Budgets saved!', 'success');
        setTimeout(() => {
            document.getElementById('formMessage').innerHTML = '';
        }, 2000);
    } catch (error) {
        console.error('Error saving budgets:', error);
    }
}

// Download PDF
function downloadPDF() {
    alert('PDF download feature coming soon! For now, use your browser\'s Print to PDF feature.');
}

// Default wallets (for settings UI)
const DEFAULT_SETTINGS = {
    wallets: [
        { id: 1, name: 'Cash', balance: 0 },
        { id: 2, name: 'Bank', balance: 0 },
        { id: 3, name: 'Paytm', balance: 0 },
        { id: 4, name: 'Credit Card', balance: 0 }
    ]
};
