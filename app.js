// MTN Asset Management Dashboard Application

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

        // Inventory search
        const searchInput = document.getElementById('search-inventory');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderInventoryTable());
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
            alert('Please upload a CSV file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.dataManager.importCSV(e.target.result);
                alert(`Successfully imported ${this.dataManager.data.length} records`);
                this.switchView('dashboard');
            } catch (error) {
                alert('Error parsing CSV file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    exportData() {
        if (!this.dataManager.hasData()) {
            alert('No data to export');
            return;
        }

        const csv = this.dataManager.exportCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mtn-asset-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            this.dataManager.clearData();
            this.chartManager.destroyAllCharts();
            alert('All data cleared');
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

        const locationField = this.dataManager.detectLocationField();
        const categoryField = this.dataManager.detectCategoryField();

        let html = '';

        if (locationField) {
            const topLocations = this.dataManager.getTopValues(locationField, 5);
            html += this.createAnalyticsCard('Top Locations', topLocations);
        }

        if (categoryField) {
            const topCategories = this.dataManager.getTopValues(categoryField, 5);
            html += this.createAnalyticsCard('Top Categories', topCategories);
        }

        // Additional analytics for other fields
        this.dataManager.headers.slice(0, 4).forEach(field => {
            if (field !== locationField && field !== categoryField) {
                const topValues = this.dataManager.getTopValues(field, 5);
                if (topValues.length > 1) {
                    html += this.createAnalyticsCard(`Top ${field}`, topValues);
                }
            }
        });

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

    renderInventoryTable() {
        const tbody = document.getElementById('inventory-tbody');
        const headerRow = document.getElementById('inventory-header-row');

        if (!tbody || !headerRow) return;

        if (!this.dataManager.hasData()) {
            headerRow.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100" class="no-data">No data available. Upload a CSV file to get started.</td></tr>';
            document.getElementById('data-info').innerHTML = 'Showing <strong>0</strong> of <strong>0</strong> records';
            return;
        }

        // Search filter
        const searchTerm = document.getElementById('search-inventory')?.value.toLowerCase() || '';

        const filteredData = searchTerm
            ? this.dataManager.data.filter(row =>
                Object.values(row).some(val =>
                    String(val).toLowerCase().includes(searchTerm)
                )
            )
            : this.dataManager.data;

        // Render headers
        headerRow.innerHTML = this.dataManager.headers.map(h => `<th>${h}</th>`).join('');

        // Render data
        if (filteredData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${this.dataManager.headers.length}" class="no-data">No matching records found</td></tr>`;
            document.getElementById('data-info').innerHTML = `Showing <strong>0</strong> of <strong>${this.dataManager.data.length}</strong> records`;
            return;
        }

        tbody.innerHTML = filteredData.map(row => {
            const cells = this.dataManager.headers.map(header => {
                const value = row[header] || '';
                return `<td>${this.formatCellValue(value)}</td>`;
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('');

        // Update record count
        const dataInfo = document.getElementById('data-info');
        if (dataInfo) {
            dataInfo.innerHTML = `Showing <strong>${filteredData.length}</strong> of <strong>${this.dataManager.data.length}</strong> records`;
        }
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
