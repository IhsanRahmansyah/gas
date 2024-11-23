// Main application logic
let db;
let currentAccount = null;
let performanceChart = null;
let profitRateChart = null;

// Initialize the application
async function init() {
    try {
        db = new Database();
        await db.init();
        
        // Initialize charts
        performanceChart = setupPerformanceChart('performanceChart');
        profitRateChart = setupProfitRateChart('profitRateChart');
        
        await loadAccounts();
        setupEventListeners();
        setupRupiahInputs();
        
        // Set default date to today
        document.getElementById('date').valueAsDate = new Date();
    } catch (error) {
        showError('Error initializing application: ' + error.message);
    }
}

// Setup Rupiah inputs
function setupRupiahInputs() {
    const rupiahInputs = [
        document.getElementById('adSpend'),
        document.getElementById('revenue'),
        document.getElementById('otherCosts')
    ];

    rupiahInputs.forEach(input => {
        if (input) setupRupiahInput(input);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Form submissions
    document.getElementById('addAccountForm').addEventListener('submit', handleAddAccount);
    document.getElementById('adsForm').addEventListener('submit', handleAddTransaction);
    
    // Account selection
    document.getElementById('accountSelector').addEventListener('change', handleAccountChange);
}

// Handle account addition
async function handleAddAccount(event) {
    event.preventDefault();
    
    const accountName = document.getElementById('accountName').value;
    const description = document.getElementById('accountDescription').value;

    try {
        await db.addAccount({
            name: accountName,
            description: description,
            createdAt: new Date().toISOString()
        });

        closeAddAccountModal();
        await loadAccounts();
        document.getElementById('addAccountForm').reset();
    } catch (error) {
        showError('Error adding account: ' + error.message);
    }
}

// Load accounts into selector
async function loadAccounts() {
    try {
        const accounts = await db.getAccounts();
        const selector = document.getElementById('accountSelector');
        
        // Clear existing options except the first one
        while (selector.options.length > 1) {
            selector.remove(1);
        }

        // Add accounts to selector
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = account.name;
            selector.appendChild(option);
        });

        // If we have a current account selected, keep it selected
        if (currentAccount) {
            selector.value = currentAccount;
        }
    } catch (error) {
        showError('Error loading accounts: ' + error.message);
    }
}

// Handle account selection change
async function handleAccountChange(event) {
    const accountId = parseInt(event.target.value);
    if (accountId) {
        currentAccount = accountId;
        await loadTransactions();
    } else {
        currentAccount = null;
        updateTable([]);
        updateSummary([]);
        updateCharts(performanceChart, profitRateChart, []);
    }
}

// Load transactions for current account
async function loadTransactions() {
    if (!currentAccount) return;

    try {
        const transactions = await db.getTransactionsByAccount(currentAccount);
        updateTable(transactions);
        updateSummary(transactions);
        updateCharts(performanceChart, profitRateChart, transactions);
    } catch (error) {
        showError('Error loading transactions: ' + error.message);
    }
}

// Handle new transaction addition
async function handleAddTransaction(event) {
    event.preventDefault();

    if (!currentAccount) {
        showError('Silahkan pilih akun terlebih dahulu');
        return;
    }

    const formData = {
        date: document.getElementById('date').value,
        adSpend: parseIDRNumber(document.getElementById('adSpend').value),
        revenue: parseIDRNumber(document.getElementById('revenue').value),
        otherCosts: parseIDRNumber(document.getElementById('otherCosts').value),
        notes: document.getElementById('notes').value,
        accountId: currentAccount
    };

    const validationError = validateFormData(formData);
    if (validationError) {
        showError(validationError);
        return;
    }

    try {
        await db.addTransaction(formData);
        await loadTransactions();
        document.getElementById('adsForm').reset();
        // Reset date to today after form submission
        document.getElementById('date').valueAsDate = new Date();
    } catch (error) {
        showError('Error adding transaction: ' + error.message);
    }
}

// Update summary statistics
function updateSummary(data) {
    // Calculate total costs
    const totalCosts = data.reduce((sum, item) => 
        sum + calculateTotalCosts(item.adSpend, item.otherCosts), 0);
    
    // Calculate tax based on total costs
    const taxEstimate = calculateTax(totalCosts);
    
    // Calculate total revenue
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    
    // Calculate net profit (revenue - (costs + tax))
    const netProfit = totalRevenue - totalCosts - taxEstimate;
    
    // Calculate profit rate
    const profitRate = totalCosts + taxEstimate === 0 ? 0 : 
        (netProfit / (totalCosts + taxEstimate)) * 100;

    // Update display
    document.getElementById('totalCosts').textContent = formatCurrency(totalCosts);
    document.getElementById('taxEstimate').textContent = formatCurrency(taxEstimate);
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    
    const netProfitElement = document.getElementById('netProfit');
    netProfitElement.textContent = formatCurrency(netProfit);
    netProfitElement.className = netProfit >= 0 ? 'positive-value' : 'negative-value';
    
    const profitRateElement = document.getElementById('profitRate');
    profitRateElement.textContent = formatPercentage(profitRate);
    profitRateElement.className = profitRate >= 0 ? 'positive-value' : 'negative-value';
}

// Update data table
function updateTable(data) {
    const tbody = document.querySelector('#dataTable tbody');
    tbody.innerHTML = '';

    data.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((item) => {
        const row = document.createElement('tr');
        const totalCosts = calculateTotalCosts(item.adSpend, item.otherCosts);
        const tax = calculateTax(totalCosts);
        const profit = calculateProfit(item.revenue, item.adSpend, item.otherCosts);
        const profitRate = calculateProfitRate(item.revenue, item.adSpend, item.otherCosts);

        row.innerHTML = `
            <td>${formatDate(item.date)}</td>
            <td>${formatCurrency(item.adSpend)}</td>
            <td>${formatCurrency(item.otherCosts || 0)}</td>
            <td>${formatCurrency(tax)}</td>
            <td>${formatCurrency(item.revenue)}</td>
            <td class="${profit >= 0 ? 'positive-value' : 'negative-value'}">${formatCurrency(profit)}</td>
            <td class="${profitRate >= 0 ? 'positive-value' : 'negative-value'}">${formatPercentage(profitRate)}</td>
            <td>${item.notes || '-'}</td>
            <td>
                <button class="btn" onclick="deleteTransaction(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Delete transaction
async function deleteTransaction(id) {
    if (confirm('Yakin ingin menghapus data ini?')) {
        try {
            await db.deleteTransaction(id);
            await loadTransactions();
        } catch (error) {
            showError('Error deleting transaction: ' + error.message);
        }
    }
}

// Export current account data
async function exportData() {
    if (!currentAccount) {
        showError('Silahkan pilih akun terlebih dahulu');
        return;
    }

    try {
        const transactions = await db.getTransactionsByAccount(currentAccount);
        if (transactions.length === 0) {
            showError('Tidak ada data untuk diekspor');
            return;
        }

        const accountName = document.getElementById('accountSelector').selectedOptions[0].text;
        
        // Show loading indicator
        const exportBtn = document.querySelector('.export-btn');
        const originalText = exportBtn.textContent;
        exportBtn.textContent = 'Mengekspor...';
        exportBtn.disabled = true;

        // Call the new export function
        await exportToExcel(accountName, transactions);

        // Reset button
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
    } catch (error) {
        console.error('Error exporting data:', error);
        showError('Error mengekspor data: ' + error.message);
        // Reset button on error
        const exportBtn = document.querySelector('.export-btn');
        exportBtn.textContent = 'Export Data';
        exportBtn.disabled = false;
    }
}

// Show error message
function showError(message) {
    alert(message);
}

// Validate form data
function validateFormData(formData) {
    if (!formData.date) return 'Tanggal harus diisi';
    if (formData.adSpend < 0) return 'Modal iklan tidak boleh negatif';
    if (formData.revenue < 0) return 'Pendapatan tidak boleh negatif';
    if (formData.otherCosts && formData.otherCosts < 0) return 'Biaya lain tidak boleh negatif';
    return null;
}

// Modal functions
function showAddAccountModal() {
    document.getElementById('addAccountModal').style.display = 'block';
}

function closeAddAccountModal() {
    document.getElementById('addAccountModal').style.display = 'none';
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);