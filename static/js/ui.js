/**
 * EXPENSE TRACKER - UI & DASHBOARD OPERATIONS
 * Dashboard updates and analytics
 */

// ===== DASHBOARD UPDATE =====

app.updateDashboard = async function() {
    try {
        // Debounce dashboard update to prevent excessive fetches
        clearTimeout(app.dashboardUpdateTimeout);
        
        app.dashboardUpdateTimeout = setTimeout(async () => {
            try {
                // Check cache first
                const cachedStats = app.getCache('stats');
                const stats = cachedStats || (await (await fetch('/api/stats')).json()).data;
                
                if (!stats) {
                    console.error('Failed to fetch stats');
                    return;
                }
                
                // Cache the response
                app.setCache('stats', stats);
                
                // Update summary cards
                updateSummaryCards(stats);
                
                // Update budget progress
                updateBudgetProgress(stats);
                
                // Update quick stats
                updateQuickStats(stats);
                
                // Update charts (use separate debounce)
                app.debouncedUpdateCharts();
                
            } catch (error) {
                console.error('Error updating dashboard:', error);
            }
        }, 500); // 500ms debounce
        
    } catch (error) {
        console.error('Error in updateDashboard:', error);
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
    
    // Use monthly_limit if set, otherwise use total of category budgets
    const monthlyBudget = (app.budgets.monthly_limit && app.budgets.monthly_limit > 0) 
        ? app.budgets.monthly_limit 
        : app.budgets.total || 1;
    
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

// Debounced chart update (1 second debounce)
app.debouncedUpdateCharts = function() {
    clearTimeout(app.chartsUpdateTimeout);
    app.chartsUpdateTimeout = setTimeout(app.updateCharts, 1000);
};

app.updateCharts = async function() {
    try {
        // Check cache first for chart data
        const cachedDaily = app.getCache('daily_chart');
        const cachedCategory = app.getCache('category_chart');
        
        let dailyData, categoryData;
        
        // Only fetch if not cached
        if (!cachedDaily || !cachedCategory) {
            const [dailyResponse, categoryResponse] = await Promise.all([
                fetch('/api/stats/daily'),
                fetch('/api/stats/category')
            ]);
            
            dailyData = cachedDaily || (await dailyResponse.json());
            categoryData = cachedCategory || (await categoryResponse.json());
            
            // Cache the responses
            if (dailyData.success) app.setCache('daily_chart', dailyData);
            if (categoryData.success) app.setCache('category_chart', categoryData);
        } else {
            dailyData = cachedDaily;
            categoryData = cachedCategory;
        }
        
        if (dailyData && dailyData.success) {
            renderDailyChart(dailyData);
        }
        
        if (categoryData && categoryData.success) {
            renderCategoryChart(categoryData);
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    }
};

function renderDailyChart(data) {
    const ctx = document.getElementById('dailyChart');
    if (!ctx) return;
    
    if (!data.labels || data.labels.length === 0) {
        ctx.style.display = 'none';
        return;
    }
    
    ctx.style.display = 'block';
    
    // Reuse existing chart instead of destroying and recreating
    if (app.charts.daily) {
        app.charts.daily.data.labels = data.labels;
        app.charts.daily.data.datasets[0].data = data.data;
        app.charts.daily.update('none'); // 'none' skips animation for faster update
    } else {
        // Create chart only if it doesn't exist
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
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    if (!data.labels || data.labels.length === 0) {
        ctx.style.display = 'none';
        return;
    }
    
    ctx.style.display = 'block';
    
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#06b6d4', '#ec4899'
    ];
    
    // Reuse existing chart instead of destroying and recreating
    if (app.charts.category) {
        app.charts.category.data.labels = data.labels;
        app.charts.category.data.datasets[0].data = data.data;
        app.charts.category.data.datasets[0].backgroundColor = colors.slice(0, data.labels.length);
        app.charts.category.update('none'); // 'none' skips animation for faster update
    } else {
        // Create chart only if it doesn't exist
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
    try {
        await app.loadBudgets();
        loadBudgetsUI();
        loadWalletsUI();
    } catch (error) {
        console.error('Error loading settings UI:', error);
    }
};

function loadBudgetsUI() {
    const budgetGrid = document.querySelector('.budget-grid');
    if (!budgetGrid) {
        console.warn('Budget grid not found');
        return;
    }
    
    const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Utilities', 'Healthcare', 'Others'];
    
    try {
        budgetGrid.innerHTML = categories.map(category => `
            <div class="budget-input-group">
                <label>${getCategoryEmoji(category)} ${category}</label>
                <input type="number" data-category="${category}" value="${app.budgets[category] || 0}" min="0" step="0.01" placeholder="0.00">
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering budget grid:', error);
    }
    
    // Load monthly budget limit if exists
    const monthlyLimitInput = document.getElementById('monthlyBudgetLimit');
    if (monthlyLimitInput) {
        const monthlyLimit = app.budgets.monthly_limit || 0;
        monthlyLimitInput.value = monthlyLimit > 0 ? monthlyLimit : '';
        console.log('Monthly budget limit loaded:', monthlyLimit);
    } else {
        console.warn('Monthly budget limit input not found');
    }
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
