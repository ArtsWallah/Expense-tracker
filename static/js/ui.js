/**
 * EXPENSE TRACKER - UI & DASHBOARD OPERATIONS
 * Dashboard updates and analytics
 */

// ===== DASHBOARD UPDATE =====

app.updateDashboard = async function() {
    try {
        // Fetch stats
        const response = await fetch('/api/stats');
        const statsData = await response.json();
        
        if (!statsData.success) {
            console.error('Failed to fetch stats');
            return;
        }
        
        const stats = statsData.data;
        
        // Update summary cards
        updateSummaryCards(stats);
        
        // Update budget progress
        updateBudgetProgress(stats);
        
        // Update quick stats
        updateQuickStats(stats);
        
        // Update charts
        app.updateCharts();
        
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
};

function updateSummaryCards(stats) {
    const monthlyTotal = document.getElementById('monthlyTotal');
    const monthlyCount = document.getElementById('monthlyCount');
    const weeklyTotal = document.getElementById('weeklyTotal');
    const weeklyCount = document.getElementById('weeklyCount');
    const todayTotal = document.getElementById('todayTotal');
    const todayCount = document.getElementById('todayCount');
    const highestAmount = document.getElementById('highestAmount');
    const highestCategory = document.getElementById('highestCategory');
    
    if (monthlyTotal) monthlyTotal.textContent = formatCurrency(stats.total.this_month);
    if (monthlyCount) monthlyCount.textContent = `${stats.count.this_month} expenses`;
    if (weeklyTotal) weeklyTotal.textContent = formatCurrency(stats.total.this_week);
    if (weeklyCount) weeklyCount.textContent = `${stats.count.this_month} expenses this week`;
    if (todayTotal) todayTotal.textContent = formatCurrency(stats.total.today);
    if (todayCount) todayCount.textContent = `${app.expenses.filter(e => e.date === new Date().toISOString().split('T')[0]).length} expenses`;
    if (highestAmount) highestAmount.textContent = formatCurrency(stats.highest.amount);
    if (highestCategory) highestCategory.textContent = stats.highest.category || 'No data';
}

function updateBudgetProgress(stats) {
    const budgetFill = document.getElementById('budgetFill');
    const budgetSpent = document.getElementById('budgetSpent');
    const budgetTotal = document.getElementById('budgetTotal');
    const budgetMessage = document.getElementById('budgetMessage');
    const budgetUsedPercent = document.getElementById('budgetUsedPercent');
    
    if (!budgetFill || !app.budgets.total) return;
    
    const monthlySpent = stats.total.this_month;
    const monthlyBudget = app.budgets.total || 1;
    const percentage = Math.min(100, (monthlySpent / monthlyBudget) * 100);
    
    budgetFill.style.width = percentage + '%';
    
    // Update status
    if (percentage >= 100) {
        budgetFill.className = 'budget-fill danger';
        if (budgetMessage) {
            budgetMessage.textContent = '⚠️ Budget exceeded!';
            budgetMessage.style.color = '#ef4444';
        }
    } else if (percentage >= 80) {
        budgetFill.className = 'budget-fill warning';
        if (budgetMessage) {
            budgetMessage.textContent = '⚠️ Approaching budget limit';
            budgetMessage.style.color = '#f59e0b';
        }
    } else {
        budgetFill.className = 'budget-fill';
        if (budgetMessage) {
            budgetMessage.textContent = `✓ ${(100 - percentage).toFixed(0)}% of budget remaining`;
            budgetMessage.style.color = '#10b981';
        }
    }
    
    if (budgetSpent) budgetSpent.textContent = formatCurrency(monthlySpent);
    if (budgetTotal) budgetTotal.textContent = formatCurrency(monthlyBudget);
    if (budgetUsedPercent) budgetUsedPercent.textContent = percentage.toFixed(0) + '%';
}

function updateQuickStats(stats) {
    const avgPerExpense = document.getElementById('avgPerExpense');
    const totalExpenses = document.getElementById('totalExpenses');
    
    if (avgPerExpense) {
        const avg = stats.count.this_month > 0 ? stats.total.this_month / stats.count.this_month : 0;
        avgPerExpense.textContent = formatCurrency(avg);
    }
    
    if (totalExpenses) totalExpenses.textContent = stats.count.total;
}

// ===== CHARTS =====

app.updateCharts = async function() {
    try {
        // Fetch chart data
        const [dailyResponse, categoryResponse] = await Promise.all([
            fetch('/api/stats/daily'),
            fetch('/api/stats/category')
        ]);
        
        const dailyData = await dailyResponse.json();
        const categoryData = await categoryResponse.json();
        
        if (dailyData.success) {
            renderDailyChart(dailyData);
        }
        
        if (categoryData.success) {
            renderCategoryChart(categoryData);
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    }
};

function renderDailyChart(data) {
    const ctx = document.getElementById('dailyChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (app.charts.daily) {
        app.charts.daily.destroy();
    }
    
    if (!data.labels || data.labels.length === 0) {
        ctx.style.display = 'none';
        return;
    }
    
    ctx.style.display = 'block';
    
    app.charts.daily = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Daily Spending',
                data: data.data,
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1,
                borderRadius: 4,
                hoverBackgroundColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#f1f5f9',
                        font: { size: 12 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (app.charts.category) {
        app.charts.category.destroy();
    }
    
    if (!data.labels || data.labels.length === 0) {
        ctx.style.display = 'none';
        return;
    }
    
    ctx.style.display = 'block';
    
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#06b6d4', '#ec4899'
    ];
    
    app.charts.category = new Chart(ctx, {
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
                    labels: {
                        color: '#f1f5f9',
                        font: { size: 12 },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = formatCurrency(context.raw);
                            return `${context.label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
}

// ===== ANALYTICS PAGE =====

app.loadAnalytics = async function() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        if (!data.success) return;
        
        const stats = data.data;
        const grid = document.getElementById('analyticsGrid');
        if (!grid) return;
        
        const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Utilities', 'Healthcare', 'Others'];
        
        let html = '';
        
        categories.forEach(category => {
            const budget = stats.budget_status[category] || {
                spent: 0,
                budget: app.budgets[category] || 0,
                percentage: 0,
                status: 'success'
            };
            
            const statusBadgeClass = `status-${budget.status}`;
            const fillClass = `budget-card-fill ${budget.status}`;
            
            html += `
                <div class="budget-card">
                    <div class="budget-card-header">
                        <h3 class="budget-card-title">${getCategoryEmoji(category)} ${category}</h3>
                        <span class="budget-status-badge ${statusBadgeClass}">
                            ${budget.percentage.toFixed(0)}%
                        </span>
                    </div>
                    <div class="budget-card-bar">
                        <div class="${fillClass}" style="width: ${Math.min(100, budget.percentage)}%"></div>
                    </div>
                    <div class="budget-card-info">
                        Spent: <strong>${formatCurrency(budget.spent)}</strong>
                    </div>
                    <div class="budget-card-remaining">
                        Budget: ${formatCurrency(budget.budget)} | Remaining: ${formatCurrency(budget.remaining)}
                    </div>
                </div>
            `;
        });
        
        grid.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
};

// ===== HISTORY PAGE =====

app.updateExpensesList = async function() {
    await app.loadExpenses();
    filterExpenses();
};

// ===== SETTINGS PAGE =====

app.loadSettingsUI = async function() {
    await app.loadBudgets();
    loadBudgetsUI();
    loadWalletsUI();
};

function loadBudgetsUI() {
    const budgetGrid = document.querySelector('.budget-grid');
    if (!budgetGrid) return;
    
    const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Utilities', 'Healthcare', 'Others'];
    
    budgetGrid.innerHTML = categories.map(category => `
        <div class="budget-input-group">
            <label>${getCategoryEmoji(category)} ${category}</label>
            <input type="number" data-category="${category}" value="${app.budgets[category] || 0}" min="0" step="0.01">
        </div>
    `).join('');
}

function loadWalletsUI() {
    const walletsList = document.getElementById('walletsList');
    if (!walletsList || !app.settings.wallets) return;
    
    walletsList.innerHTML = app.settings.wallets.map(wallet => `
        <div class="wallet-item">
            <div class="wallet-name">${wallet.name}</div>
            <div class="wallet-balance">${formatCurrency(wallet.balance || 0)}</div>
        </div>
    `).join('');
}

// ===== LIGHT THEME SUPPORT ===== 

app.updateCharts = (function() {
    const original = app.updateCharts;
    return async function() {
        await original.call(this);
        
        const isDark = !document.body.classList.contains('light-theme');
        const textColor = isDark ? '#f1f5f9' : '#1e293b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        
        Object.values(app.charts).forEach(chart => {
            if (chart) {
                chart.options.plugins.legend.labels.color = textColor;
                chart.update();
            }
        });
    };
})();
