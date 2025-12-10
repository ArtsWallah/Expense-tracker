// Initialize charts
let dailyChart, categoryChart;

// Load sample data
const sampleExpenses = [
    { date: '2024-12-01', category: 'Food', description: 'Lunch at restaurant', amount: 35.50 },
    { date: '2024-12-01', category: 'Transportation', description: 'Gas', amount: 45.00 },
    { date: '2024-12-02', category: 'Entertainment', description: 'Movie tickets', amount: 28.00 },
    { date: '2024-12-02', category: 'Shopping', description: 'Groceries', amount: 62.30 },
    { date: '2024-12-03', category: 'Food', description: 'Coffee', amount: 6.50 },
    { date: '2024-12-03', category: 'Utilities', description: 'Internet bill', amount: 79.99 },
    { date: '2024-12-04', category: 'Healthcare', description: 'Medicine', amount: 25.00 },
    { date: '2024-12-04', category: 'Food', description: 'Dinner', amount: 42.75 },
    { date: '2024-12-05', category: 'Entertainment', description: 'Concert ticket', amount: 89.99 },
    { date: '2024-12-05', category: 'Shopping', description: 'Clothes', amount: 95.00 },
    { date: '2024-12-06', category: 'Transportation', description: 'Uber', amount: 18.50 },
    { date: '2024-12-06', category: 'Food', description: 'Breakfast', amount: 12.00 },
    { date: '2024-12-07', category: 'Others', description: 'Books', amount: 34.99 },
    { date: '2024-12-07', category: 'Shopping', description: 'Phone accessories', amount: 47.00 },
    { date: '2024-12-08', category: 'Food', description: 'Restaurant', amount: 58.00 },
    { date: '2024-12-08', category: 'Entertainment', description: 'Gaming subscription', amount: 14.99 },
    { date: '2024-12-09', category: 'Healthcare', description: 'Doctor visit', amount: 150.00 },
    { date: '2024-12-09', category: 'Transportation', description: 'Car maintenance', amount: 120.00 },
    { date: '2024-12-10', category: 'Food', description: 'Fast food', amount: 18.50 },
    { date: '2024-12-10', category: 'Utilities', description: 'Electricity bill', amount: 89.50 },
];

// Get expenses from localStorage or use sample data
function getExpenses() {
    const stored = localStorage.getItem('expenses');
    return stored ? JSON.parse(stored) : sampleExpenses;
}

// Save expenses to localStorage
function saveExpenses(expenses) {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

let expenses = getExpenses();

// Set today's date as default
document.getElementById('expenseDate').valueAsDate = new Date();

// Add expense form handler
document.getElementById('expenseForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const date = document.getElementById('expenseDate').value;
    const category = document.getElementById('expenseCategory').value;
    const description = document.getElementById('expenseDescription').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);

    if (!date || !category || !description || !amount) return;

    expenses.push({
        date,
        category,
        description,
        amount
    });

    saveExpenses(expenses);
    this.reset();
    document.getElementById('expenseDate').valueAsDate = new Date();

    updateUI();
});

// Filter handlers
document.getElementById('filterCategory').addEventListener('change', updateUI);
document.getElementById('filterMonth').addEventListener('change', updateUI);

// Sort button handler
document.getElementById('sortBtn').addEventListener('click', function () {
    expenses.sort((a, b) => b.amount - a.amount);
    updateUI();
    this.textContent = expenses.every((e, i, arr) => i === 0 || e.amount <= arr[i - 1].amount) ? 'Sort by Amount ↓' : 'Sort by Amount ↑';
});

// Filter expenses based on selected filters
function getFilteredExpenses() {
    const selectedCategory = document.getElementById('filterCategory').value;
    const selectedMonth = document.getElementById('filterMonth').value;

    return expenses.filter(expense => {
        const categoryMatch = !selectedCategory || expense.category === selectedCategory;
        const monthMatch = !selectedMonth || expense.date.startsWith(selectedMonth);
        return categoryMatch && monthMatch;
    });
}

// Get expenses for current month
function getCurrentMonthExpenses() {
    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    return expenses.filter(e => e.date.startsWith(currentMonth));
}

// Get expenses for current week
function getCurrentWeekExpenses() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    return expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= startOfWeek && expenseDate <= now;
    });
}

// Get expenses for today
function getTodayExpenses() {
    const today = new Date().toISOString().split('T')[0];
    return expenses.filter(e => e.date === today);
}

// Calculate total amount
function calculateTotal(expenseList) {
    return expenseList.reduce((sum, e) => sum + e.amount, 0);
}

// Get category emoji
function getCategoryEmoji(category) {
    const emojis = {
        'Food': '🍔',
        'Transportation': '🚗',
        'Entertainment': '🎬',
        'Shopping': '🛍️',
        'Utilities': '⚡',
        'Healthcare': '🏥',
        'Others': '📦'
    };
    return emojis[category] || '📝';
}

// Update all UI elements
function updateUI() {
    const filtered = getFilteredExpenses();
    const currentMonth = getCurrentMonthExpenses();
    const currentWeek = getCurrentWeekExpenses();
    const today = getTodayExpenses();

    // Update summary cards
    const totalBalance = calculateTotal(expenses);
    const monthlyTotal = calculateTotal(currentMonth);
    const weeklyTotal = calculateTotal(currentWeek);
    const todayTotal = calculateTotal(today);
    const avgDaily = currentMonth.length > 0 ? monthlyTotal / 30 : 0;

    document.getElementById('totalBalance').textContent = '$' + totalBalance.toFixed(2);
    document.getElementById('monthlyTotal').textContent = '$' + monthlyTotal.toFixed(2);
    document.getElementById('weeklyTotal').textContent = '$' + weeklyTotal.toFixed(2);
    document.getElementById('todayTotal').textContent = '$' + todayTotal.toFixed(2);
    document.getElementById('averageDaily').textContent = '$' + avgDaily.toFixed(2);

    // Update expenses list
    updateExpensesList(filtered);

    // Update charts
    updateCharts(filtered, expenses);
}

// Update expenses list display
function updateExpensesList(expenseList) {
    const list = document.getElementById('expensesList');

    if (expenseList.length === 0) {
        list.innerHTML = '<p class="empty-state">No expenses found.</p>';
        return;
    }

    list.innerHTML = expenseList.map((expense, index) => `
        <div class="expense-item">
            <div class="expense-info">
                <div class="expense-category">
                    ${getCategoryEmoji(expense.category)} ${expense.category}
                </div>
                <div class="expense-description">${expense.description}</div>
                <div class="expense-date">${new Date(expense.date).toLocaleDateString()}</div>
            </div>
            <div class="expense-amount">-$${expense.amount.toFixed(2)}</div>
            <button class="delete-btn" onclick="deleteExpense(${expenses.indexOf(expense)})">Delete</button>
        </div>
    `).join('');
}

// Delete expense
function deleteExpense(index) {
    expenses.splice(index, 1);
    saveExpenses(expenses);
    updateUI();
}

// Update charts
function updateCharts(filtered, allExpenses) {
    updateDailyChart(filtered);
    updateCategoryChart(filtered);
}

// Update daily expenses chart
function updateDailyChart(expenseList) {
    // Group by date
    const dailyData = {};
    expenseList.forEach(expense => {
        dailyData[expense.date] = (dailyData[expense.date] || 0) + expense.amount;
    });

    const dates = Object.keys(dailyData).sort();
    const amounts = dates.map(date => dailyData[date]);

    const ctx = document.getElementById('dailyChart').getContext('2d');

    if (dailyChart) {
        dailyChart.destroy();
    }

    dailyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Daily Expenses',
                data: amounts,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#2ecc71',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#ecf0f1'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#95a5a6',
                        callback: function (value) {
                            return '$' + value.toFixed(2);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#95a5a6'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Update category chart
function updateCategoryChart(expenseList) {
    // Group by category
    const categoryData = {};
    expenseList.forEach(expense => {
        categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount;
    });

    const categories = Object.keys(categoryData);
    const amounts = categories.map(cat => categoryData[cat]);

    const colors = [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40',
        '#FF6384'
    ];

    const ctx = document.getElementById('categoryChart').getContext('2d');

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(cat => getCategoryEmoji(cat) + ' ' + cat),
            datasets: [{
                data: amounts,
                backgroundColor: colors.slice(0, categories.length),
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
                    labels: {
                        color: '#ecf0f1',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Initial UI update
updateUI();
