// Constants
const EXCEL_COLORS = {
    HEADER_BG: '1F497D',
    SUBHEADER_BG: 'E6E6E6',
    ROW_ALTERNATE: 'F2F2F2',
    WHITE: 'FFFFFF',
    SUCCESS: '28A745',
    DANGER: 'DC3545',
    PRIMARY: '1877F2'
};

const EXCEL_STYLES = {
    header: {
        font: { bold: true, color: { argb: EXCEL_COLORS.WHITE } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.HEADER_BG } },
        border: {
            top: { style: 'double', color: { argb: '000000' } },
            left: { style: 'double', color: { argb: '000000' } },
            bottom: { style: 'double', color: { argb: '000000' } },
            right: { style: 'double', color: { argb: '000000' } }
        },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
    },
    subHeader: {
        font: { bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORS.SUBHEADER_BG } },
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        },
        alignment: { horizontal: 'center', vertical: 'middle' }
    },
    number: {
        numFmt: '_-"Rp"* #,##0.00_-;-"Rp"* #,##0.00_-;_-"Rp"* "-"??_-;_-@_-',
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        },
        alignment: { horizontal: 'right' }
    },
    percentage: {
        numFmt: '0.00%',
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        },
        alignment: { horizontal: 'right' }
    }
};

// Basic Format Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatNumber(number) {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}

function formatPercentage(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number / 100);
}

function parseIDRNumber(str) {
    if (!str) return 0;
    str = str.replace(/[^\d,.]/g, '');
    str = str.replace(/\./g, '');
    str = str.replace(',', '.');
    let value = parseFloat(str);
    return isNaN(value) ? 0 : value;
}

// Format Dates
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getFullFormattedDate(date) {
    return new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getDateRangeString(data) {
    if (data.length === 0) return 'Tidak ada data';
    
    const dates = data.map(item => new Date(item.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    return `${formatDate(minDate)} sampai ${formatDate(maxDate)}`;
}

// Calculation Functions
function calculateTotalCosts(adSpend, otherCosts) {
    return adSpend + (otherCosts || 0);
}

function calculateTax(totalCosts) {
    return totalCosts * 0.11;
}

function calculateProfit(revenue, adSpend, otherCosts) {
    const totalCosts = calculateTotalCosts(adSpend, otherCosts);
    const tax = calculateTax(totalCosts);
    return revenue - totalCosts - tax;
}

function calculateProfitRate(revenue, adSpend, otherCosts) {
    const totalCosts = calculateTotalCosts(adSpend, otherCosts);
    const tax = calculateTax(totalCosts);
    const profit = calculateProfit(revenue, adSpend, otherCosts);
    const totalCostWithTax = totalCosts + tax;
    
    if (totalCostWithTax === 0) return 0;
    return (profit / totalCostWithTax) * 100;
}

function calculateSummary(data) {
    try {
        const summary = data.reduce((acc, item) => {
            const totalCosts = calculateTotalCosts(item.adSpend, item.otherCosts);
            const tax = calculateTax(totalCosts);
            const profit = calculateProfit(item.revenue, item.adSpend, item.otherCosts);
            const profitRate = calculateProfitRate(item.revenue, item.adSpend, item.otherCosts);

            acc.totalCosts += totalCosts;
            acc.totalTax += tax;
            acc.totalRevenue += item.revenue;
            acc.totalProfit += profit;
            acc.profitRates.push(profitRate);

            return acc;
        }, {
            totalCosts: 0,
            totalTax: 0,
            totalRevenue: 0,
            totalProfit: 0,
            profitRates: []
        });

        summary.averageProfitRate = summary.profitRates.length > 0 
            ? summary.profitRates.reduce((a, b) => a + b, 0) / summary.profitRates.length 
            : 0;

        return summary;
    } catch (error) {
        console.error('Error calculating summary:', error);
        throw new Error('Gagal menghitung ringkasan data');
    }
}

// Input Handling
function setupRupiahInput(input) {
    let lastValidValue = '';
    
    function formatRupiah(str) {
        str = str.replace(/[^\d,]/g, '');
        
        let parts = str.split(',');
        let number = parts[0];
        let decimal = parts[1] || '';
        
        decimal = decimal.slice(0, 2);
        
        let formatted = '';
        while (number.length > 3) {
            formatted = '.' + number.slice(-3) + formatted;
            number = number.slice(0, -3);
        }
        formatted = number + formatted;
        
        if (decimal) {
            formatted += ',' + decimal;
        }
        
        return formatted;
    }
    
    input.addEventListener('input', function(e) {
        let curPos = this.selectionStart;
        let oldLength = this.value.length;
        let oldValue = this.value;
        
        if (this.value.length < lastValidValue.length) {
            lastValidValue = this.value;
            return;
        }
        
        let formattedValue = formatRupiah(this.value);
        
        if (formattedValue !== oldValue) {
            this.value = formattedValue;
            lastValidValue = formattedValue;
            
            let addedSeparators = (formattedValue.match(/\./g) || []).length - 
                                (oldValue.match(/\./g) || []).length;
            let newPosition = curPos + addedSeparators;
            
            this.setSelectionRange(newPosition, newPosition);
        }
    });
    
    input.addEventListener('blur', function() {
        if (this.value) {
            let parts = this.value.split(',');
            let decimal = parts[1] || '00';
            
            if (decimal.length === 0) {
                decimal = '00';
            } else if (decimal.length === 1) {
                decimal += '0';
            }
            
            this.value = parts[0] + ',' + decimal;
            lastValidValue = this.value;
        }
    });
    
    input.type = 'text';
    input.placeholder = '0,00';
}

// Web Chart Functions
function setupPerformanceChart(chartId) {
    const ctx = document.getElementById(chartId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Pendapatan',
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    data: []
                },
                {
                    label: 'Modal',
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    data: []
                },
                {
                    label: 'Profit',
                    borderColor: '#1877f2',
                    backgroundColor: 'rgba(24, 119, 242, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                title: {
                    display: true,
                    text: 'Performa Harian',
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + 
                                   formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function setupProfitRateChart(chartId) {
    const ctx = document.getElementById(chartId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Profit Rate',
                borderColor: '#1877f2',
                backgroundColor: 'rgba(24, 119, 242, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                data: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                title: {
                    display: true,
                    text: 'Profit Rate Harian',
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + 
                                   context.raw.toFixed(2) + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        }
                    }
                }
            }
        }
    });
}

function updateCharts(performanceChart, profitRateChart, data) {
    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get last 30 days of data
    const last30Days = sortedData.slice(-30);
    
    const labels = last30Days.map(item => formatDate(item.date));
    const revenues = last30Days.map(item => item.revenue);
    const costs = last30Days.map(item => calculateTotalCosts(item.adSpend, item.otherCosts));
    const profits = last30Days.map(item => 
        calculateProfit(item.revenue, item.adSpend, item.otherCosts)
    );
    const profitRates = last30Days.map(item => 
        calculateProfitRate(item.revenue, item.adSpend, item.otherCosts)
    );

    // Update performance chart
    performanceChart.data.labels = labels;
    performanceChart.data.datasets[0].data = revenues;
    performanceChart.data.datasets[1].data = costs;
    performanceChart.data.datasets[2].data = profits;
    performanceChart.update();

    // Update profit rate chart
    profitRateChart.data.labels = labels;
    profitRateChart.data.datasets[0].data = profitRates;
    profitRateChart.update();
}

// Excel Helper Functions
function calculateMonthlyData(data) {
    // Group data by month
    const monthlyGroups = data.reduce((groups, item) => {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!groups[monthKey]) {
            groups[monthKey] = {
                costs: 0,
                revenue: 0,
                transactions: 0
            };
        }
        
        const totalCosts = calculateTotalCosts(item.adSpend, item.otherCosts);
        groups[monthKey].costs += totalCosts;
        groups[monthKey].revenue += item.revenue;
        groups[monthKey].transactions += 1;
        
        return groups;
    }, {});

    // Convert to array dan hitung metrik
    return Object.entries(monthlyGroups)
        .map(([monthKey, data]) => {
            const tax = calculateTax(data.costs);
            const profit = data.revenue - data.costs - tax;
            const profitRate = data.costs + tax === 0 ? 0 : (profit / (data.costs + tax)) * 100;

            const [year, month] = monthKey.split('-');
            const monthName = new Date(year, parseInt(month) - 1)
                .toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

            return {
                month: monthName,
                costs: data.costs,
                tax: tax,
                revenue: data.revenue,
                profit: profit,
                profitRate: profitRate,
                transactions: data.transactions
            };
        })
        .sort((a, b) => b.month.localeCompare(a.month));
}

// Main Export Function
async function exportToExcel(accountName, data) {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'FB Ads Manager';
        workbook.lastModifiedBy = 'FB Ads Manager';
        workbook.created = new Date();
        workbook.modified = new Date();

        // Create worksheets
        const summarySheet = workbook.addWorksheet('Ringkasan');
        const monthlySheet = workbook.addWorksheet('Data Bulanan');
        const detailSheet = workbook.addWorksheet('Data Harian');
        const chartSheet = workbook.addWorksheet('Grafik');

        // Setup sheets in parallel
        await Promise.all([
            setupDetailSheet(workbook, detailSheet, data, EXCEL_STYLES),
            setupMonthlySheet(workbook, monthlySheet, data, EXCEL_STYLES),
            setupSummarySheet(workbook, summarySheet, data, accountName, EXCEL_STYLES),
            setupChartSheet(workbook, chartSheet, data, EXCEL_STYLES)
        ]);

        // Save file
        const buffer = await workbook.xlsx.writeBuffer();
        saveExcelFile(buffer, `FB_Ads_${accountName}_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
        console.error('Error exporting to Excel:', error);
        throw new Error('Gagal mengekspor data ke Excel: ' + error.message);
    }
}

// Save Excel File Helper
function saveExcelFile(buffer, fileName) {
    const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
}

// Error Handling Wrapper
function withErrorHandling(fn, errorMessage) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            console.error(`${errorMessage}:`, error);
            throw new Error(errorMessage + ': ' + error.message);
        }
    };
}

// Sheet Setup Functions
async function setupDetailSheet(workbook, sheet, data, styles) {
    try {
        // Sort data by date ascending
        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Set columns
        sheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Tanggal', key: 'date', width: 12 },
            { header: 'Modal Iklan', key: 'adSpend', width: 15 },
            { header: 'Biaya Lain', key: 'otherCosts', width: 15 },
            { header: 'Total Modal', key: 'totalCosts', width: 15 },
            { header: 'Estimasi Pajak', key: 'tax', width: 15 },
            { header: 'Pendapatan', key: 'revenue', width: 15 },
            { header: 'Profit Bersih', key: 'profit', width: 15 },
            { header: 'Profit Rate', key: 'profitRate', width: 12 },
            { header: 'Catatan', key: 'notes', width: 30 }
        ];

        // Add title
        sheet.mergeCells('A1:J1');
        sheet.getCell('A1').value = 'DATA TRANSAKSI HARIAN';
        sheet.getCell('A1').style = styles.header;

        // Add summary info
        sheet.mergeCells('A2:J2');
        sheet.getCell('A2').value = `Total Data: ${sortedData.length} transaksi`;
        sheet.getCell('A2').style = styles.subHeader;

        // Add period info
        sheet.mergeCells('A3:J3');
        sheet.getCell('A3').value = `Periode: ${getDateRangeString(data)}`;
        sheet.getCell('A3').style = styles.subHeader;

        // Add header row style
        const headerRow = sheet.getRow(4);
        headerRow.values = sheet.columns.map(col => col.header);
        headerRow.eachCell(cell => {
            cell.style = styles.header;
        });

        // Add data
        sortedData.forEach((item, index) => {
            const totalCosts = calculateTotalCosts(item.adSpend, item.otherCosts);
            const tax = calculateTax(totalCosts);
            const profit = calculateProfit(item.revenue, item.adSpend, item.otherCosts);
            const profitRate = calculateProfitRate(item.revenue, item.adSpend, item.otherCosts);

            const row = sheet.addRow({
                no: index + 1,
                date: new Date(item.date),
                adSpend: item.adSpend,
                otherCosts: item.otherCosts || 0,
                totalCosts: totalCosts,
                tax: tax,
                revenue: item.revenue,
                profit: profit,
                profitRate: profitRate,
                notes: item.notes || ''
            });

            // Apply styles to each cell
            row.eachCell((cell, colNumber) => {
                // Base style
                const baseStyle = {
                    ...styles.number,
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: index % 2 === 0 ? 'FFFFFF' : 'F2F2F2' }
                    }
                };

                // Special formatting for different column types
                switch(colNumber) {
                    case 1: // No
                        cell.style = { ...baseStyle, alignment: { horizontal: 'center' } };
                        break;
                    case 2: // Date
                        cell.style = { ...baseStyle, numFmt: 'dd/mm/yyyy' };
                        break;
                    case 9: // Profit Rate
                        cell.style = { ...baseStyle, numFmt: '0.00%' };
                        break;
                    case 10: // Notes
                        cell.style = { 
                            ...baseStyle, 
                            alignment: { horizontal: 'left', wrapText: true },
                            numFmt: '@'
                        };
                        break;
                    default: // Numbers
                        cell.style = baseStyle;
                }
            });
        });

        // Add summary section
        const summary = calculateSummary(sortedData);
        const summaryStartRow = sheet.rowCount + 2;

        // Add summary header
        sheet.mergeCells(`A${summaryStartRow}:J${summaryStartRow}`);
        sheet.getCell(`A${summaryStartRow}`).value = 'RINGKASAN';
        sheet.getCell(`A${summaryStartRow}`).style = styles.header;

        // Add summary data
        const summaryData = [
            ['Total Modal', '', '', '', summary.totalCosts],
            ['Total Pajak', '', '', '', summary.totalTax],
            ['Total Pendapatan', '', '', '', '', '', summary.totalRevenue],
            ['Total Profit', '', '', '', '', '', '', summary.totalProfit],
            ['Rata-rata Profit Rate', '', '', '', '', '', '', '', summary.averageProfitRate + '%']
        ];

        summaryData.forEach((rowData, index) => {
            const row = sheet.addRow(rowData);
            row.eachCell((cell, colNumber) => {
                cell.style = {
                    ...styles.number,
                    font: { bold: true },
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'E6E6E6' }
                    }
                };
            });
        });

    } catch (error) {
        console.error('Error setting up detail sheet:', error);
        throw new Error('Gagal menyiapkan sheet detail: ' + error.message);
    }
}

async function setupMonthlySheet(workbook, sheet, data, styles) {
    try {
        // Get monthly summary
        const monthlyData = calculateMonthlyData(data);

        // Set columns
        sheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Bulan', key: 'month', width: 15 },
            { header: 'Modal', key: 'costs', width: 15 },
            { header: 'Pajak', key: 'tax', width: 15 },
            { header: 'Pendapatan', key: 'revenue', width: 15 },
            { header: 'Profit', key: 'profit', width: 15 },
            { header: 'Profit Rate', key: 'profitRate', width: 12 },
            { header: 'Jumlah Transaksi', key: 'transactions', width: 15 }
        ];

        // Add title
        sheet.mergeCells('A1:H1');
        sheet.getCell('A1').value = 'LAPORAN BULANAN FB ADS';
        sheet.getCell('A1').style = styles.header;

        // Add period info
        sheet.mergeCells('A2:H2');
        sheet.getCell('A2').value = `Periode: ${getDateRangeString(data)}`;
        sheet.getCell('A2').style = styles.subHeader;

        // Add header row
        const headerRow = sheet.getRow(4);
        headerRow.values = sheet.columns.map(col => col.header);
        headerRow.eachCell(cell => {
            cell.style = styles.header;
        });

        // Add monthly data
        monthlyData.forEach((item, index) => {
            const row = sheet.addRow({
                no: index + 1,
                month: item.month,
                costs: item.costs,
                tax: item.tax,
                revenue: item.revenue,
                profit: item.profit,
                profitRate: item.profitRate,
                transactions: item.transactions
            });

            row.eachCell((cell, colNumber) => {
                const baseStyle = {
                    ...styles.number,
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: index % 2 === 0 ? 'FFFFFF' : 'F2F2F2' }
                    }
                };

                switch(colNumber) {
                    case 1: // No
                    case 8: // Transactions
                        cell.style = { ...baseStyle, alignment: { horizontal: 'center' } };
                        break;
                    case 2: // Month
                        cell.style = { ...baseStyle, alignment: { horizontal: 'left' } };
                        break;
                    case 7: // Profit Rate
                        cell.style = { ...baseStyle, numFmt: '0.00%' };
                        break;
                    default: // Numbers
                        cell.style = baseStyle;
                }
            });
        });

    } catch (error) {
        console.error('Error setting up monthly sheet:', error);
        throw new Error('Gagal menyiapkan sheet bulanan: ' + error.message);
    }
}

async function setupSummarySheet(workbook, sheet, data, accountName, styles) {
    try {
        // Calculate summary data
        const summary = calculateSummary(data);

        // Title
        sheet.mergeCells('A1:E1');
        sheet.getCell('A1').value = 'RINGKASAN FB ADS MANAGER';
        sheet.getCell('A1').style = styles.header;

        // Account Info
        const infoData = [
            ['Informasi Akun'],
            ['Nama Akun', accountName],
            ['Periode', getDateRangeString(data)],
            ['Total Transaksi', data.length],
            ['']
        ];

        infoData.forEach((row, index) => {
            sheet.addRow(row);
            if (index === 0) {
                sheet.getRow(sheet.rowCount).eachCell(cell => {
                    cell.style = styles.subHeader;
                });
            }
        });

        // Financial Summary
        const summaryStartRow = sheet.rowCount + 1;
        sheet.getCell(`A${summaryStartRow}`).value = 'Ringkasan Keuangan';
        sheet.getCell(`A${summaryStartRow}`).style = styles.subHeader;

        const financialData = [
            ['Metrik', 'Nilai', 'Keterangan'],
            ['Total Modal', formatNumber(summary.totalCosts), 'Total biaya iklan dan biaya lain'],
            ['Estimasi Pajak', formatNumber(summary.totalTax), '11% dari total modal'],
            ['Total Pendapatan', formatNumber(summary.totalRevenue), 'Total pendapatan kotor'],
            ['Profit Bersih', formatNumber(summary.totalProfit), 'Pendapatan - (Modal + Pajak)'],
            ['Profit Rate', formatPercentage(summary.averageProfitRate/100), 'Persentase keuntungan bersih']
        ];

        financialData.forEach((row, index) => {
            const currentRow = sheet.addRow(row);
            if (index === 0) {
                currentRow.eachCell(cell => {
                    cell.style = styles.header;
                });
            } else {
                row.forEach((cell, cellIndex) => {
                    currentRow.getCell(cellIndex + 1).style = cellIndex === 1 ? 
                        styles.number : 
                        { ...styles.subHeader, alignment: { horizontal: 'left' } };
                });
            }
        });

    } catch (error) {
        console.error('Error setting up summary sheet:', error);
        throw new Error('Gagal menyiapkan sheet ringkasan: ' + error.message);
    }
}

async function setupChartSheet(workbook, sheet, data, styles) {
    try {
        // Sort and get last 30 days data
        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
        const last30Days = sortedData.slice(-30);

        // Add title
        sheet.mergeCells('A1:D1');
        sheet.getCell('A1').value = 'DATA GRAFIK (30 HARI TERAKHIR)';
        sheet.getCell('A1').style = styles.header;

        // Add headers
        const headerRow = sheet.addRow(['Tanggal', 'Modal', 'Pendapatan', 'Profit']);
        headerRow.eachCell(cell => {
            cell.style = styles.header;
        });

        // Add data
        last30Days.forEach(item => {
            const totalCosts = calculateTotalCosts(item.adSpend, item.otherCosts);
            const profit = calculateProfit(item.revenue, item.adSpend, item.otherCosts);
            
            const row = sheet.addRow([
                new Date(item.date),
                totalCosts,
                item.revenue,
                profit
            ]);

            row.getCell(1).style = { ...styles.number, numFmt: 'dd/mm/yyyy' };
            [2,3,4].forEach(colIndex => {
                row.getCell(colIndex).style = styles.number;
            });
        });

        // Set column widths
        sheet.getColumn(1).width = 15;
        [2,3,4].forEach(colIndex => {
            sheet.getColumn(colIndex).width = 20;
        });

    } catch (error) {
        console.error('Error setting up chart sheet:', error);
        throw new Error('Gagal menyiapkan sheet grafik: ' + error.message);
    }
}