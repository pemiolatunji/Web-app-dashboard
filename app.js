// MTN Asset Management Dashboard Application

// ==================== UTILITY FUNCTIONS ====================
class Utils {
    // Debounce function to limit rate of function calls
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Toast notification system
    static showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove toast after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    static getToastIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Loading spinner
    static showLoading(message = 'Loading...') {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.innerHTML = `
                <div class="loader-backdrop">
                    <div class="loader-content">
                        <div class="spinner"></div>
                        <p class="loader-message">${message}</p>
                    </div>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            loader.querySelector('.loader-message').textContent = message;
        }
        loader.style.display = 'flex';
    }

    static hideLoading() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    static updateLoadingMessage(message) {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.querySelector('.loader-message').textContent = message;
        }
    }
}

// ==================== CSV PARSER ====================
class CSVParser {
    static parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) return { headers: [], data: [] };

        const headers = this.parseCSVLine(lines[0]);
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = this.parseCSVLine(lines[i]);
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }

        return { headers, data };
    }

    static parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    static toCSV(headers, data) {
        const escapeCSVValue = (value) => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const csvLines = [headers.map(escapeCSVValue).join(',')];
        data.forEach(row => {
            const line = headers.map(header => escapeCSVValue(row[header])).join(',');
            csvLines.push(line);
        });

        return csvLines.join('\n');
    }
}

// ==================== DATA MANAGER ====================
class DataManager {
    constructor() {
        this.storageKey = 'mtn-asset-data';
        this.headers = [];
        this.data = [];
        this.charts = {};
        this.currentPage = 1;
        this.pageSize = 50;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.loadData();
    }

    loadData() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            const parsed = JSON.parse(stored);
            this.headers = parsed.headers || [];
            this.data = parsed.data || [];
        }
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify({
            headers: this.headers,
            data: this.data
        }));
        this.notifyChange();
    }

    importCSV(csvText) {
        const parsed = CSVParser.parseCSV(csvText);
        this.headers = parsed.headers;
        this.data = parsed.data;
        this.saveData();
    }

    exportCSV() {
        return CSVParser.toCSV(this.headers, this.data);
    }

    clearData() {
        this.headers = [];
        this.data = [];
        this.saveData();
    }

    getData() {
        return {
            headers: this.headers,
            data: this.data
        };
    }

    hasData() {
        return this.data.length > 0;
    }

    notifyChange() {
        window.dispatchEvent(new Event('data-changed'));
    }

    // ==================== ANALYTICS ENGINE ====================
    groupBy(field) {
        const grouped = {};
        this.data.forEach(row => {
            const key = row[field] || 'Unknown';
            grouped[key] = (grouped[key] || 0) + 1;
        });
        return grouped;
    }

    getAnalyticsByField(field) {
        if (!this.headers.includes(field)) return {};
        return this.groupBy(field);
    }

    getTopValues(field, limit = 5) {
        const grouped = this.groupBy(field);
        return Object.entries(grouped)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit);
    }

    detectLocationField() {
        const locationKeywords = ['location', 'city', 'region', 'site', 'area', 'zone', 'district'];
        return this.headers.find(h =>
            locationKeywords.some(kw => h.toLowerCase().includes(kw))
        );
    }

    detectCategoryField() {
        const categoryKeywords = ['category', 'type', 'class', 'kind', 'application', 'service'];
        return this.headers.find(h =>
            categoryKeywords.some(kw => h.toLowerCase().includes(kw))
        );
    }

    detectStatusField() {
        const statusKeywords = ['status', 'state', 'condition'];
        return this.headers.find(h =>
            statusKeywords.some(kw => h.toLowerCase().includes(kw))
        );
    }

    getKeyMetrics() {
        const locationField = this.detectLocationField();
        const categoryField = this.detectCategoryField();
        const statusField = this.detectStatusField();

        return {
            totalRecords: this.data.length,
            uniqueLocations: locationField ? Object.keys(this.groupBy(locationField)).length : 0,
            uniqueCategories: categoryField ? Object.keys(this.groupBy(categoryField)).length : 0,
            fields: this.headers.length
        };
    }

    // ==================== CSV DATA ANALYTICS ====================
    getDataQualityMetrics() {
        if (!this.hasData()) return null;

        const totalCells = this.data.length * this.headers.length;
        let emptyCells = 0;
        let filledCells = 0;

        this.data.forEach(row => {
            this.headers.forEach(header => {
                const value = row[header];
                if (!value || String(value).trim() === '') {
                    emptyCells++;
                } else {
                    filledCells++;
                }
            });
        });

        const completeness = ((filledCells / totalCells) * 100).toFixed(1);

        return {
            totalCells,
            filledCells,
            emptyCells,
            completeness: parseFloat(completeness)
        };
    }

    getFieldCompleteness() {
        if (!this.hasData()) return [];

        return this.headers.map(header => {
            let filled = 0;
            this.data.forEach(row => {
                const value = row[header];
                if (value && String(value).trim() !== '') {
                    filled++;
                }
            });
            const percentage = ((filled / this.data.length) * 100).toFixed(1);
            return {
                field: header,
                filled,
                total: this.data.length,
                percentage: parseFloat(percentage)
            };
        }).sort((a, b) => a.percentage - b.percentage);
    }

    getDuplicateAnalysis() {
        if (!this.hasData() || this.headers.length === 0) return null;

        // Check for duplicate rows (based on all fields)
        const rowHashes = new Map();
        let duplicates = 0;

        this.data.forEach((row, index) => {
            const hash = JSON.stringify(row);
            if (rowHashes.has(hash)) {
                duplicates++;
            } else {
                rowHashes.set(hash, index);
            }
        });

        return {
            totalRows: this.data.length,
            uniqueRows: rowHashes.size,
            duplicateRows: duplicates,
            duplicatePercentage: ((duplicates / this.data.length) * 100).toFixed(1)
        };
    }

    getFieldStatistics() {
        if (!this.hasData()) return [];

        return this.headers.map(header => {
            const values = this.data.map(row => row[header]);
            const uniqueValues = new Set(values.filter(v => v && String(v).trim() !== '')).size;
            const emptyCount = values.filter(v => !v || String(v).trim() === '').length;

            // Check if numeric
            const numericValues = values
                .filter(v => v && !isNaN(v))
                .map(v => parseFloat(v));

            const isNumeric = numericValues.length > this.data.length * 0.5;

            let stats = {
                field: header,
                uniqueValues,
                emptyCount,
                isNumeric
            };

            if (isNumeric && numericValues.length > 0) {
                stats.min = Math.min(...numericValues);
                stats.max = Math.max(...numericValues);
                stats.avg = (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2);
            }

            return stats;
        });
    }

    // ==================== SORTING & PAGINATION ====================
    sortData(data, column, direction) {
        if (!column) return data;

        return [...data].sort((a, b) => {
            let valA = a[column] || '';
            let valB = b[column] || '';

            // Try numeric comparison first
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);

            if (!isNaN(numA) && !isNaN(numB)) {
                return direction === 'asc' ? numA - numB : numB - numA;
            }

            // String comparison
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();

            if (direction === 'asc') {
                return valA.localeCompare(valB);
            } else {
                return valB.localeCompare(valA);
            }
        });
    }

    setSorting(column, direction) {
        this.sortColumn = column;
        this.sortDirection = direction;
    }

    setPagination(page, pageSize) {
        this.currentPage = page;
        this.pageSize = pageSize;
    }

    getPaginatedData(data) {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return data.slice(start, end);
    }

    getTotalPages(totalRecords) {
        return Math.ceil(totalRecords / this.pageSize);
    }
}

// ==================== CHART MANAGER ====================
class ChartManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.charts = {};
    }

    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }

    destroyAllCharts() {
        Object.keys(this.charts).forEach(id => this.destroyChart(id));
    }

    createPieChart(canvasId, label, data) {
        this.destroyChart(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const labels = Object.keys(data);
        const values = Object.values(data);

        const colors = this.generateColors(labels.length);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#0A0A0A',
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
                            color: '#FFFFFF',
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1A1A1A',
                        titleColor: '#FFCB05',
                        bodyColor: '#FFFFFF',
                        borderColor: '#FFCB05',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    createBarChart(canvasId, label, data) {
        this.destroyChart(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const labels = Object.keys(data);
        const values = Object.values(data);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: values,
                    backgroundColor: '#FFCB05',
                    borderColor: '#E6B500',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#FFFFFF',
                            stepSize: 1
                        },
                        grid: {
                            color: '#2A2A2A'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#FFFFFF'
                        },
                        grid: {
                            color: '#2A2A2A'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1A1A1A',
                        titleColor: '#FFCB05',
                        bodyColor: '#FFFFFF',
                        borderColor: '#FFCB05',
                        borderWidth: 1,
                        padding: 12
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    generateColors(count) {
        const baseColors = [
            '#FFCB05', '#4CAF50', '#FF9800', '#2196F3', '#E91E63',
            '#9C27B0', '#00BCD4', '#8BC34A', '#FF5722', '#607D8B'
        ];

        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }

    updateCharts() {
        const locationField = this.dataManager.detectLocationField();
        const categoryField = this.dataManager.detectCategoryField();

        if (locationField) {
            const locationData = this.dataManager.getAnalyticsByField(locationField);
            this.createPieChart('locationChart', 'By Location', locationData);
        }

        if (categoryField) {
            const categoryData = this.dataManager.getAnalyticsByField(categoryField);
            this.createBarChart('categoryChart', 'By Category', categoryData);
        }
    }
}

// ==================== UI MANAGER ====================
class UIManager {
    constructor(dataManager, chartManager) {
        this.dataManager = dataManager;
        this.chartManager = chartManager;
        this.currentView = 'dashboard';
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchView(btn.dataset.view);
            });
        });

        // File upload
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('csv-file-input');
        const browseBtn = document.getElementById('browse-file-btn');

        if (browseBtn) {
            browseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }

        if (uploadZone) {
            uploadZone.addEventListener('click', () => fileInput.click());

            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
            });

            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('dragover');
            });

            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file) this.handleFileUpload(file);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.handleFileUpload(file);
            });
        }

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Clear data button
        const clearBtn = document.getElementById('clear-data-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearData());
        }

        // Data change listener
        window.addEventListener('data-changed', () => {
            this.updateUI();
        });

        // Inventory search with debouncing
        const searchInput = document.getElementById('search-inventory');
        if (searchInput) {
            const debouncedSearch = Utils.debounce(() => {
                this.dataManager.currentPage = 1; // Reset to first page on search
                this.renderInventoryTable();
            }, 300);
            searchInput.addEventListener('input', debouncedSearch);
        }

        // Page size selector
        const pageSizeSelect = document.getElementById('page-size-select');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.dataManager.setPagination(1, parseInt(e.target.value));
                this.renderInventoryTable();
            });
        }
    }

    switchView(view) {
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });

        // Update active view
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');

        this.currentView = view;

        // Update charts when switching to dashboard
        if (view === 'dashboard' && this.dataManager.hasData()) {
            setTimeout(() => this.chartManager.updateCharts(), 100);
        }
    }

    handleFileUpload(file) {
        if (!file.name.endsWith('.csv')) {
            Utils.showToast('Please upload a CSV file', 'error');
            return;
        }

        Utils.showLoading('Reading CSV file...');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                Utils.updateLoadingMessage('Parsing CSV data...');
                this.dataManager.importCSV(e.target.result);
                Utils.hideLoading();
                Utils.showToast(`Successfully imported ${this.dataManager.data.length} records`, 'success', 4000);
                this.switchView('dashboard');
            } catch (error) {
                Utils.hideLoading();
                Utils.showToast('Error parsing CSV file: ' + error.message, 'error', 5000);
            }
        };
        reader.onerror = () => {
            Utils.hideLoading();
            Utils.showToast('Error reading file', 'error');
        };
        reader.readAsText(file);
    }

    exportData() {
        if (!this.dataManager.hasData()) {
            Utils.showToast('No data to export', 'warning');
            return;
        }

        Utils.showLoading('Generating CSV export...');

        try {
            const csv = this.dataManager.exportCSV();
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `asset-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            Utils.hideLoading();
            Utils.showToast('Data exported successfully', 'success');
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('Error exporting data: ' + error.message, 'error');
        }
    }

    clearData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            Utils.showLoading('Clearing data...');
            this.dataManager.clearData();
            this.chartManager.destroyAllCharts();
            Utils.hideLoading();
            Utils.showToast('All data cleared successfully', 'success');
        }
    }

    updateUI() {
        this.updateDashboardStats();
        this.updateAnalyticsBreakdown();
        this.renderInventoryTable();

        if (this.currentView === 'dashboard' && this.dataManager.hasData()) {
            setTimeout(() => this.chartManager.updateCharts(), 100);
        }
    }

    updateDashboardStats() {
        const metrics = this.dataManager.getKeyMetrics();
        const statusField = this.dataManager.detectStatusField();

        const setTextContent = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setTextContent('total-assets', metrics.totalRecords);
        setTextContent('total-locations', metrics.uniqueLocations);
        setTextContent('total-categories', metrics.uniqueCategories);

        // Calculate active percentage if status field exists
        if (statusField && metrics.totalRecords > 0) {
            const activeCount = this.dataManager.data.filter(row => {
                const status = String(row[statusField]).toLowerCase();
                return status.includes('active') || status.includes('operational');
            }).length;
            const percentage = Math.round((activeCount / metrics.totalRecords) * 100);
            setTextContent('active-percentage', `${percentage}%`);
        } else {
            setTextContent('active-percentage', 'N/A');
        }
    }

    updateAnalyticsBreakdown() {
        const analyticsGrid = document.getElementById('analytics-grid');
        if (!analyticsGrid) return;

        if (!this.dataManager.hasData()) {
            analyticsGrid.innerHTML = '<p class="no-data">No data available. Upload a CSV file to get started.</p>';
            return;
        }

        let html = '';

        // Data Quality Metrics
        const qualityMetrics = this.dataManager.getDataQualityMetrics();
        if (qualityMetrics) {
            html += this.createDataQualityCard(qualityMetrics);
        }

        // Duplicate Analysis
        const duplicateAnalysis = this.dataManager.getDuplicateAnalysis();
        if (duplicateAnalysis) {
            html += this.createDuplicateAnalysisCard(duplicateAnalysis);
        }

        // Field Completeness - show top 5 least complete fields
        const fieldCompleteness = this.dataManager.getFieldCompleteness();
        if (fieldCompleteness.length > 0) {
            const leastComplete = fieldCompleteness.slice(0, 5);
            html += this.createFieldCompletenessCard(leastComplete);
        }

        // Field Statistics - show interesting fields
        const fieldStats = this.dataManager.getFieldStatistics();
        if (fieldStats.length > 0) {
            const topStats = fieldStats
                .filter(stat => stat.uniqueValues > 1)
                .slice(0, 3);
            topStats.forEach(stat => {
                html += this.createFieldStatisticsCard(stat);
            });
        }

        // Category distribution if available
        const categoryField = this.dataManager.detectCategoryField();
        if (categoryField) {
            const topCategories = this.dataManager.getTopValues(categoryField, 5);
            html += this.createAnalyticsCard('Top Categories', topCategories);
        }

        analyticsGrid.innerHTML = html || '<p class="no-data">No analytics available</p>';
    }

    createAnalyticsCard(title, data) {
        const items = data.map(([name, count]) =>
            `<div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="color: #B0B0B0;">${name}</span>
                <span style="color: #FFCB05; font-weight: 600;">${count}</span>
            </div>`
        ).join('');

        return `
            <div class="analytics-card">
                <h3>${title}</h3>
                <div>${items}</div>
            </div>
        `;
    }

    createDataQualityCard(metrics) {
        const qualityColor = metrics.completeness >= 90 ? '#4CAF50' :
                            metrics.completeness >= 70 ? '#FF9800' : '#E91E63';

        return `
            <div class="analytics-card">
                <h3><i class="fas fa-clipboard-check"></i> Data Quality</h3>
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                        <span style="color: #B0B0B0;">Completeness</span>
                        <span style="color: ${qualityColor}; font-weight: 700; font-size: 1.2rem;">${metrics.completeness}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #B0B0B0;">Filled Cells</span>
                        <span style="color: #4CAF50;">${metrics.filledCells.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #B0B0B0;">Empty Cells</span>
                        <span style="color: #E91E63;">${metrics.emptyCells.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #B0B0B0;">Total Cells</span>
                        <span style="color: #FFCB05;">${metrics.totalCells.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    createDuplicateAnalysisCard(analysis) {
        const hasDuplicates = analysis.duplicateRows > 0;
        const statusColor = hasDuplicates ? '#E91E63' : '#4CAF50';

        return `
            <div class="analytics-card">
                <h3><i class="fas fa-clone"></i> Duplicate Detection</h3>
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                        <span style="color: #B0B0B0;">Duplicate Rows</span>
                        <span style="color: ${statusColor}; font-weight: 700; font-size: 1.2rem;">${analysis.duplicateRows}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #B0B0B0;">Unique Rows</span>
                        <span style="color: #4CAF50;">${analysis.uniqueRows.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #B0B0B0;">Total Rows</span>
                        <span style="color: #FFCB05;">${analysis.totalRows.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #B0B0B0;">Duplicate %</span>
                        <span style="color: ${statusColor};">${analysis.duplicatePercentage}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    createFieldCompletenessCard(fields) {
        const items = fields.map(field => {
            const barColor = field.percentage >= 90 ? '#4CAF50' :
                           field.percentage >= 70 ? '#FF9800' : '#E91E63';
            return `
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span style="color: #B0B0B0; font-size: 0.85rem;">${field.field}</span>
                        <span style="color: ${barColor}; font-weight: 600;">${field.percentage}%</span>
                    </div>
                    <div style="background: #2A2A2A; border-radius: 4px; height: 6px; overflow: hidden;">
                        <div style="background: ${barColor}; height: 100%; width: ${field.percentage}%;"></div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="analytics-card">
                <h3><i class="fas fa-chart-pie"></i> Field Completeness</h3>
                <div>${items}</div>
            </div>
        `;
    }

    createFieldStatisticsCard(stat) {
        let content = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="color: #B0B0B0;">Unique Values</span>
                <span style="color: #FFCB05; font-weight: 600;">${stat.uniqueValues.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="color: #B0B0B0;">Empty Values</span>
                <span style="color: #E91E63;">${stat.emptyCount.toLocaleString()}</span>
            </div>
        `;

        if (stat.isNumeric && stat.min !== undefined) {
            content += `
                <div style="border-top: 1px solid #2A2A2A; margin: 0.75rem 0; padding-top: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #B0B0B0;">Min</span>
                        <span style="color: #4CAF50;">${stat.min}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #B0B0B0;">Max</span>
                        <span style="color: #4CAF50;">${stat.max}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #B0B0B0;">Average</span>
                        <span style="color: #FFCB05;">${stat.avg}</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="analytics-card">
                <h3><i class="fas fa-database"></i> ${stat.field} ${stat.isNumeric ? '(Numeric)' : ''}</h3>
                <div>${content}</div>
            </div>
        `;
    }

    renderInventoryTable() {
        const tbody = document.getElementById('inventory-tbody');
        const headerRow = document.getElementById('inventory-header-row');

        if (!tbody || !headerRow) return;

        if (!this.dataManager.hasData()) {
            headerRow.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100" class="no-data">No data available. Upload a CSV file to get started.</td></tr>';
            const dataInfo = document.getElementById('data-info');
            if (dataInfo) dataInfo.innerHTML = 'Showing <strong>0</strong> of <strong>0</strong> records';
            this.renderPaginationControls(0, 0);
            return;
        }

        // Search filter
        const searchTerm = document.getElementById('search-inventory')?.value.toLowerCase() || '';

        let filteredData = searchTerm
            ? this.dataManager.data.filter(row =>
                Object.values(row).some(val =>
                    String(val).toLowerCase().includes(searchTerm)
                )
            )
            : [...this.dataManager.data];

        // Apply sorting
        if (this.dataManager.sortColumn) {
            filteredData = this.dataManager.sortData(
                filteredData,
                this.dataManager.sortColumn,
                this.dataManager.sortDirection
            );
        }

        const totalFiltered = filteredData.length;

        // Apply pagination
        const paginatedData = this.dataManager.getPaginatedData(filteredData);
        const totalPages = this.dataManager.getTotalPages(totalFiltered);

        // Render sortable headers
        headerRow.innerHTML = this.dataManager.headers.map(header => {
            const isSorted = this.dataManager.sortColumn === header;
            const sortIcon = isSorted
                ? (this.dataManager.sortDirection === 'asc' ? '↑' : '↓')
                : '↕';
            return `<th class="sortable" data-column="${header}">
                ${header} <span class="sort-indicator">${sortIcon}</span>
            </th>`;
        }).join('');

        // Add click handlers to headers
        headerRow.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.column;
                const newDirection = this.dataManager.sortColumn === column && this.dataManager.sortDirection === 'asc' ? 'desc' : 'asc';
                this.dataManager.setSorting(column, newDirection);
                this.renderInventoryTable();
            });
        });

        // Render data
        if (paginatedData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${this.dataManager.headers.length}" class="no-data">No matching records found</td></tr>`;
        } else {
            tbody.innerHTML = paginatedData.map(row => {
                const cells = this.dataManager.headers.map(header => {
                    const value = row[header] || '';
                    return `<td>${this.formatCellValue(value)}</td>`;
                }).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
        }

        // Update record count
        const dataInfo = document.getElementById('data-info');
        if (dataInfo) {
            const start = totalFiltered > 0 ? (this.dataManager.currentPage - 1) * this.dataManager.pageSize + 1 : 0;
            const end = Math.min(this.dataManager.currentPage * this.dataManager.pageSize, totalFiltered);
            dataInfo.innerHTML = `Showing <strong>${start}-${end}</strong> of <strong>${totalFiltered}</strong> records${searchTerm ? ` (filtered from ${this.dataManager.data.length} total)` : ''}`;
        }

        // Render pagination controls
        this.renderPaginationControls(totalPages, totalFiltered);
    }

    renderPaginationControls(totalPages, totalRecords) {
        const paginationContainer = document.getElementById('pagination-controls');
        if (!paginationContainer) return;

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        const currentPage = this.dataManager.currentPage;
        let html = '<div class="pagination">';

        // Previous button
        html += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i> Previous
        </button>`;

        // Page numbers
        const maxButtons = 7;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        if (startPage > 1) {
            html += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) html += '<span class="pagination-ellipsis">...</span>';
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += '<span class="pagination-ellipsis">...</span>';
            html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next button
        html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
            Next <i class="fas fa-chevron-right"></i>
        </button>`;

        html += '</div>';
        paginationContainer.innerHTML = html;

        // Add click handlers
        paginationContainer.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                this.dataManager.setPagination(page, this.dataManager.pageSize);
                this.renderInventoryTable();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    formatCellValue(value) {
        if (!value) return '<span style="color: #666;">-</span>';

        // Check if it's a status-like value
        const statusKeywords = ['active', 'inactive', 'pending', 'maintenance', 'operational', 'offline'];
        const lowerValue = String(value).toLowerCase();

        if (statusKeywords.includes(lowerValue)) {
            const statusClass = lowerValue === 'active' || lowerValue === 'operational' ? 'status-active'
                              : lowerValue === 'inactive' || lowerValue === 'offline' ? 'status-inactive'
                              : 'status-maintenance';
            return `<span class="status-badge ${statusClass}">${value}</span>`;
        }

        return value;
    }
}

// ==================== MAIN APPLICATION ====================
class MTNAssetDashboard {
    constructor() {
        this.dataManager = new DataManager();
        this.chartManager = new ChartManager(this.dataManager);
        this.uiManager = new UIManager(this.dataManager, this.chartManager);
    }

    init() {
        this.uiManager.init();
        console.log('MTN Asset Management Dashboard initialized');
    }
}

// Initialize application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MTNAssetDashboard();
    app.init();
});
