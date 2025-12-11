/**
 * EXPENSE TRACKER - API & DATA OPERATIONS
 * Handles all API calls and data processing
 */

// ===== FORM HANDLING =====

async function handleAddExpense(event) {
    event.preventDefault();
    console.log('Add expense form submitted');
    
    // Clear previous messages
    const successMsg = document.getElementById('successMessage');
    if (successMsg) {
        successMsg.style.display = 'none';
    }
    
    // Validate form
    console.log('Validating form...');
    if (!validateForm()) {
        console.error('Form validation failed');
        return;
    }
    console.log('Form validation passed');
    
    // Get form data
    const form = document.getElementById('expenseForm');
    const expenseData = {
        date: document.getElementById('expenseDate').value,
        category: document.getElementById('expenseCategory').value,
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        payment_method: document.getElementById('paymentMethod').value,
        wallet: document.getElementById('wallet').value || null,
        receipt: document.getElementById('receipt').value || null,
        notes: document.getElementById('notes').value || null,
        tags: document.getElementById('notes').value ? 
            document.getElementById('notes').value.split(',').map(t => t.trim()) : []
    };
    
    console.log('Expense data:', expenseData);
    try {
        // Add expense
        const result = await app.addExpense(expenseData);
        
        if (result.success) {
            // Show success message
            if (successMsg) {
                successMsg.style.display = 'block';
                successMsg.textContent = '✓ Expense added successfully!';
            }
            
            // Reset form
            form.reset();
            document.getElementById('expenseDate').valueAsDate = new Date();
            
            // Clear file preview
            const filePreview = document.getElementById('filePreview');
            if (filePreview) filePreview.innerHTML = '';
            
            // Show toast
            showToast('Expense added successfully!', 'success');
            
            // Update UI
            app.updateDashboard();
            
            // Clear form errors
            clearFormErrors();
            
            // Disable submit button again
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
        } else {
            showToast(result.error || 'Failed to add expense', 'error');
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        showToast('Error adding expense', 'error');
    }
}

// ===== FORM VALIDATION =====

function validateForm() {
    console.log('validateForm() called');
    const form = document.getElementById('expenseForm');
    if (!form) {
        console.error('Expense form not found');
        return false;
    }
    
    let isValid = true;
    clearFormErrors();
    
    // Date validation
    const date = document.getElementById('expenseDate');
    if (!date.value) {
        showFieldError('dateError', 'Date is required');
        isValid = false;
    }
    
    // Category validation
    const category = document.getElementById('expenseCategory');
    if (!category.value) {
        showFieldError('categoryError', 'Category is required');
        isValid = false;
    }
    
    // Payment method validation
    const paymentMethod = document.getElementById('paymentMethod');
    if (!paymentMethod || !paymentMethod.value || paymentMethod.value.trim() === '') {
        showFieldError('paymentError', 'Payment method is required');
        console.error('Payment method validation failed:', paymentMethod?.value);
        isValid = false;
    } else {
        console.log('Payment method selected:', paymentMethod.value);
    }
    
    // Description validation
    const description = document.getElementById('expenseDescription');
    if (!description.value || description.value.trim().length < 2) {
        showFieldError('descriptionError', 'Description must be at least 2 characters');
        isValid = false;
    }
    
    // Amount validation
    const amount = document.getElementById('expenseAmount');
    const amountValue = parseFloat(amount.value);
    if (!amount.value || amountValue <= 0) {
        showFieldError('amountError', 'Amount must be greater than 0');
        isValid = false;
    }
    
    // Receipt validation (if provided)
    const receipt = document.getElementById('receipt');
    if (receipt.files.length > 0) {
        const file = receipt.files[0];
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        const maxSize = 3 * 1024 * 1024; // 3MB
        
        if (!validTypes.includes(file.type)) {
            showFieldError('receiptError', 'Invalid file type. Use JPG, PNG, or PDF');
            isValid = false;
        }
        
        if (file.size > maxSize) {
            showFieldError('receiptError', 'File too large. Maximum 3MB');
            isValid = false;
        }
    }
    
    // Update submit button state
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = !isValid;
    }
    
    return isValid;
}

function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(fieldId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        // Find parent form-group and add error class
        const formGroup = errorEl.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('error');
        }
    }
}

function clearFormErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
    
    document.querySelectorAll('.form-group.error').forEach(el => {
        el.classList.remove('error');
    });
}

// ===== FILE UPLOAD =====

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 3 * 1024 * 1024;
    
    if (!validTypes.includes(file.type)) {
        showFieldError('receiptError', 'Invalid file type. Use JPG, PNG, or PDF');
        event.target.value = '';
        return;
    }
    
    if (file.size > maxSize) {
        showFieldError('receiptError', 'File too large. Maximum 3MB');
        event.target.value = '';
        return;
    }
    
    // Show preview
    const filePreview = document.getElementById('filePreview');
    if (filePreview) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                filePreview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                    <p>${file.name}</p>
                `;
            };
            reader.readAsDataURL(file);
        } else {
            filePreview.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-file-pdf" style="font-size: 40px; color: #ef4444;"></i>
                    <p>${file.name}</p>
                </div>
            `;
        }
    }
    
    clearFieldError('receiptError');
}

function clearFieldError(fieldId) {
    const errorEl = document.getElementById(fieldId);
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
        
        const formGroup = errorEl.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('error');
        }
    }
}

// ===== QUICK ADD =====

async function handleQuickAdd(event) {
    event.preventDefault();
    
    const amount = parseFloat(document.getElementById('quickAmount').value);
    const category = document.getElementById('quickCategory').value;
    
    if (!amount || amount <= 0 || !category) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    const expenseData = {
        date: new Date().toISOString().split('T')[0],
        category: category,
        description: `Quick add - ${category}`,
        amount: amount,
        payment_method: 'Cash',
        wallet: null,
        receipt: null,
        notes: null,
        tags: []
    };
    
    try {
        const result = await app.addExpense(expenseData);
        
        if (result.success) {
            closeModal('quickAddModal');
            showToast('Expense added quickly!', 'success');
            app.updateDashboard();
            document.getElementById('quickAddForm').reset();
        } else {
            showToast(result.error || 'Failed to add', 'error');
        }
    } catch (error) {
        console.error('Error in quick add:', error);
        showToast('Error adding expense', 'error');
    }
}

// ===== BUDGET OPERATIONS =====

// Create debounced budget update (500ms debounce)
let budgetUpdateTimeout;
function debouncedBudgetUpdate(event) {
    event.preventDefault();
    console.log('Budget form submitted');
    clearTimeout(budgetUpdateTimeout);
    
    budgetUpdateTimeout = setTimeout(() => {
        handleBudgetUpdate();
    }, 500);
}

async function handleBudgetUpdate() {
    const budgetData = {};
    const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Utilities', 'Healthcare', 'Others'];
    
    categories.forEach(cat => {
        const input = document.querySelector(`input[data-category="${cat}"]`);
        if (input) {
            budgetData[cat] = parseFloat(input.value) || 0;
        }
    });
    
    // Add monthly limit if present
    const monthlyLimitInput = document.getElementById('monthlyBudgetLimit');
    if (monthlyLimitInput) {
        budgetData.monthly_limit = parseFloat(monthlyLimitInput.value) || 0;
    }
    
    console.log('Saving budgets:', budgetData);
    
    try {
        const response = await fetch('/api/budgets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(budgetData)
        });
        
        const data = await response.json();
        console.log('Budget save response:', data);
        
        if (data.success) {
            app.budgets = data.data;
            app.saveData();
            app.clearCache('stats'); // Clear dashboard cache to force refresh
            app.clearCache('daily_chart');
            app.clearCache('category_chart');
            showToast('✓ Budgets updated successfully!', 'success');
            console.log('Budgets saved successfully');
            // Optionally update dashboard
            setTimeout(() => app.updateDashboard(), 100);
        } else {
            showToast(data.error || 'Failed to update budgets', 'error');
            console.error('Budget update error:', data.error);
        }
    } catch (error) {
        console.error('Error updating budgets:', error);
        showToast('Error updating budgets: ' + error.message, 'error');
    }
}

// ===== EXPENSE FILTERING & SORTING =====

function filterExpenses() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const paymentMethod = document.getElementById('paymentFilter').value;
    
    let filtered = app.expenses.filter(expense => {
        const matchesSearch = !searchTerm || 
            expense.description.toLowerCase().includes(searchTerm) ||
            expense.category.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !category || expense.category === category;
        const matchesPayment = !paymentMethod || expense.payment_method === paymentMethod;
        
        return matchesSearch && matchesCategory && matchesPayment;
    });
    
    // Sort
    filtered.sort((a, b) => {
        let aVal = a[app.sortColumn];
        let bVal = b[app.sortColumn];
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (app.sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
    
    renderExpenseTable(filtered);
}

function sortTable(column) {
    if (app.sortColumn === column) {
        app.sortOrder = app.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        app.sortColumn = column;
        app.sortOrder = 'asc';
    }
    
    filterExpenses();
}

function renderExpenseTable(expenses) {
    const tbody = document.getElementById('expenseTableBody');
    if (!tbody) return;
    
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="7">
                    <div class="empty-state-content">
                        <i class="fas fa-inbox"></i>
                        <p>No expenses found. <a href="#" onclick="changePage('add-expense'); return false;">Add one →</a></p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = expenses.map(expense => `
        <tr>
            <td>${expense.date}</td>
            <td>${getCategoryEmoji(expense.category)} ${expense.category}</td>
            <td>${expense.description}</td>
            <td>${getPaymentIcon(expense.payment_method)} ${expense.payment_method}</td>
            <td>${app.currencySymbol}${parseFloat(expense.amount).toFixed(2)}</td>
            <td>${expense.receipt ? '<i class="fas fa-receipt"></i>' : '-'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteExpenseHandler('${expense.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Update summary
    updateTableSummary(expenses);
}

async function deleteExpenseHandler(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    const result = await app.deleteExpense(expenseId);
    if (result.success) {
        showToast('Expense deleted', 'success');
        filterExpenses();
        app.updateDashboard();
    } else {
        showToast('Failed to delete', 'error');
    }
}

// ===== UTILITY FUNCTIONS =====

function getCategoryEmoji(category) {
    const emojis = {
        'Food': '🍔',
        'Transportation': '🚗',
        'Entertainment': '🎬',
        'Shopping': '🛍️',
        'Utilities': '💡',
        'Healthcare': '🏥',
        'Others': '📌'
    };
    return emojis[category] || '📝';
}

function getPaymentIcon(method) {
    const icons = {
        'Cash': '💵',
        'Card': '🏦',
        'UPI': '📱',
        'Bank Transfer': '🏧'
    };
    return icons[method] || '💳';
}

function formatCurrency(amount) {
    return `${app.currencySymbol}${parseFloat(amount).toFixed(2)}`;
}

function updateTableSummary(expenses) {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const highest = Math.max(...expenses.map(exp => exp.amount), 0);
    
    const summaryTotal = document.getElementById('summaryTotal');
    const summaryCount = document.getElementById('summaryCount');
    const summaryHighest = document.getElementById('summaryHighest');
    
    if (summaryTotal) summaryTotal.textContent = formatCurrency(total);
    if (summaryCount) summaryCount.textContent = expenses.length;
    if (summaryHighest) summaryHighest.textContent = formatCurrency(highest);
}

// ===== EXPORT FUNCTIONS =====

function exportToCSV() {
    if (app.expenses.length === 0) {
        showToast('No expenses to export', 'warning');
        return;
    }
    
    let csv = 'Date,Category,Description,Payment Method,Wallet,Amount,Notes\n';
    
    app.expenses.forEach(expense => {
        const row = [
            expense.date,
            expense.category,
            `"${expense.description}"`,
            expense.payment_method,
            expense.wallet || '',
            expense.amount,
            `"${expense.notes || ''}"`
        ];
        csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('Exported to CSV', 'success');
}

function exportToPDF() {
    showToast('PDF export coming soon', 'info');
}
