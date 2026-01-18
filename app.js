// ==================== MTN IT ASSET MANAGEMENT DASHBOARD ====================
// Production-Ready Application with Complete Functionality
// Author: MTN IT Department
// Version: 2.0

console.log('%c MTN IT Asset Management Dashboard ', 'background: #FFCB05; color: #0A0A0A; font-size: 16px; font-weight: bold; padding: 10px;');
console.log('%c Initializing Application... ', 'background: #1A1A1A; color: #FFCB05; font-size: 12px; padding: 5px;');

// ==================== CSV PARSER CLASS ====================
class CSVParser {
    /**
     * Parse CSV text with proper handling of quoted fields
     * @param {string} csvText - Raw CSV text
     * @returns {Object} - { headers: [], data: [] }
     */
    static parseCSV(csvText) {
        console.log('📄 CSVParser: Starting CSV parsing...');

        const lines = csvText.trim().split('\n');
        if (lines.length === 0) {
            console.warn('⚠️ CSVParser: Empty CSV file');
            return { headers: [], data: [] };
        }

        // Parse headers
        const headers = this.parseCSVLine(lines[0]);
        console.log('📋 CSVParser: Headers detected:', headers);

        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const values = this.parseCSVLine(line);
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }

        console.log(`✅ CSVParser: Successfully parsed ${data.length} rows`);
        return { headers, data };
    }

    /**
     * Parse a single CSV line handling quoted fields properly
     * @param {string} line - Single line from CSV
     * @returns {Array} - Array of field values
     */
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
                    i++; // Skip next quote
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

    /**
     * Convert data to CSV format
     * @param {Array} headers - Column headers
     * @param {Array} data - Data rows
     * @returns {string} - CSV formatted string
     */
    static toCSV(headers, data) {
        console.log('💾 CSVParser: Exporting to CSV format...');

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

        console.log(`✅ CSVParser: Exported ${data.length} rows`);
        return csvLines.join('\n');
    }
}

// ==================== IT ASSET MANAGER CLASS ====================
class ITAssetManager {
    constructor() {
        this.storageKey = 'mtn-it-asset-data';
        this.headers = [];
        this.data = [];
        this.loadFromStorage();
        console.log('🗄️ ITAssetManager: Initialized');
    }

    /**
     * Load data from LocalStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.headers = parsed.headers || [];
                this.data = parsed.data || [];
                console.log(`📦 ITAssetManager: Loaded ${this.data.length} assets from storage`);
            }
        } catch (error) {
            console.error('❌ ITAssetManager: Error loading from storage:', error);
        }
    }

    /**
     * Save data to LocalStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({
                headers: this.headers,
                data: this.data,
                timestamp: new Date().toISOString()
            }));
            console.log('💾 ITAssetManager: Data saved to storage');
            this.notifyDataChange();
        } catch (error) {
            console.error('❌ ITAssetManager: Error saving to storage:', error);
        }
    }

    /**
     * Import CSV data
     */
    importCSV(csvText) {
        const parsed = CSVParser.parseCSV(csvText);
        this.headers = parsed.headers;
        this.data = parsed.data;
        this.saveToStorage();
        console.log('✅ ITAssetManager: CSV data imported successfully');
    }

    /**
     * Export data to CSV
     */
    exportCSV() {
        return CSVParser.toCSV(this.headers, this.data);
    }

    /**
     * Clear all data
     */
    clearAllData() {
        this.headers = [];
        this.data = [];
        this.saveToStorage();
        console.log('🗑️ ITAssetManager: All data cleared');
    }

    /**
     * Check if data exists
     */
    hasData() {
        return this.data.length > 0;
    }

    /**
     * Notify data change
     */
    notifyDataChange() {
        window.dispatchEvent(new Event('asset-data-changed'));
    }

    /**
     * Detect column by keywords
     */
    detectColumn(keywords) {
        return this.headers.find(h =>
            keywords.some(kw => h.toLowerCase().includes(kw.toLowerCase()))
        );
    }

    // ==================== IT-SPECIFIC ANALYTICS ====================

    /**
     * Get deployment statistics (Physical vs VM vs Standalone)
     */
    getDeploymentStats() {
        const typeColumn = this.detectColumn(['Standalone/VM/Virtualised', 'Type', 'Deployment', 'Virtual']);

        if (!typeColumn) {
            console.warn('⚠️ No deployment type column found');
            return {};
        }

        const stats = {};
        this.data.forEach(row => {
            const value = row[typeColumn] || 'Unknown';
            const normalized = value.toLowerCase();

            // Normalize deployment types
            let category = 'Unknown';
            if (normalized.includes('vm') || normalized.includes('virtual')) {
                category = 'Virtual Machine';
            } else if (normalized.includes('physical') || normalized.includes('standalone')) {
                category = 'Physical Server';
            } else if (normalized.includes('container')) {
                category = 'Container';
            } else {
                category = value;
            }

            stats[category] = (stats[category] || 0) + 1;
        });

        console.log('📊 Deployment Stats:', stats);
        return stats;
    }

    /**
     * Get OS distribution
     */
    getOSDistribution() {
        const osColumn = this.detectColumn(['OS', 'Operating System', 'OS Type']);

        if (!osColumn) {
            console.warn('⚠️ No OS column found');
            return {};
        }

        const stats = {};
        this.data.forEach(row => {
            const os = row[osColumn] || 'Unknown';
            stats[os] = (stats[os] || 0) + 1;
        });

        console.log('💻 OS Distribution:', stats);
        return stats;
    }

    /**
     * Get application statistics
     */
    getApplicationStats() {
        const appColumn = this.detectColumn(['Application', 'App', 'Service']);

        if (!appColumn) {
            console.warn('⚠️ No application column found');
            return {
                topApps: [],
                uniqueCount: 0,
                totalInstances: 0
            };
        }

        const appCounts = {};
        this.data.forEach(row => {
            const app = row[appColumn] || 'Unknown';
            if (app && app !== 'Unknown' && app.trim() !== '') {
                appCounts[app] = (appCounts[app] || 0) + 1;
            }
        });

        const topApps = Object.entries(appCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        console.log('🎯 Application Stats:', {
            uniqueCount: Object.keys(appCounts).length,
            totalInstances: this.data.length,
            topApps: topApps.length
        });

        return {
            topApps,
            uniqueCount: Object.keys(appCounts).length,
            totalInstances: this.data.length,
            allApps: appCounts
        };
    }

    /**
     * Get environment/status statistics
     */
    getEnvironmentStats() {
        const envColumn = this.detectColumn(['Status/Environment', 'Environment', 'Status', 'State']);

        if (!envColumn) {
            console.warn('⚠️ No environment/status column found');
            return {};
        }

        const stats = {};
        this.data.forEach(row => {
            const env = row[envColumn] || 'Unknown';
            stats[env] = (stats[env] || 0) + 1;
        });

        console.log('🌍 Environment Stats:', stats);
        return stats;
    }

    /**
     * Get managed by statistics
     */
    getManagedByStats() {
        const managedColumn = this.detectColumn(['Managed by', 'Managed By', 'Owner', 'Team']);

        if (!managedColumn) {
            console.warn('⚠️ No managed by column found');
            return {};
        }

        const stats = {};
        this.data.forEach(row => {
            const managed = row[managedColumn] || 'Unknown';
            stats[managed] = (stats[managed] || 0) + 1;
        });

        console.log('👥 Managed By Stats:', stats);
        return stats;
    }

    /**
     * Get classification statistics
     */
    getClassificationStats() {
        const classColumn = this.detectColumn(['Classification', 'Class', 'Category']);

        if (!classColumn) {
            console.warn('⚠️ No classification column found');
            return {};
        }

        const stats = {};
        this.data.forEach(row => {
            const classification = row[classColumn] || 'Unknown';
            stats[classification] = (stats[classification] || 0) + 1;
        });

        console.log('🏷️ Classification Stats:', stats);
        return stats;
    }

    /**
     * Get comprehensive metrics
     */
    getMetrics() {
        const deployment = this.getDeploymentStats();
        const physical = Object.entries(deployment)
            .filter(([key]) => key.includes('Physical'))
            .reduce((sum, [, val]) => sum + val, 0);
        const vm = Object.entries(deployment)
            .filter(([key]) => key.includes('Virtual'))
            .reduce((sum, [, val]) => sum + val, 0);

        const appStats = this.getApplicationStats();

        return {
            totalAssets: this.data.length,
            physicalCount: physical,
            physicalPercent: this.data.length > 0 ? ((physical / this.data.length) * 100).toFixed(1) : 0,
            vmCount: vm,
            vmPercent: this.data.length > 0 ? ((vm / this.data.length) * 100).toFixed(1) : 0,
            appCount: appStats.uniqueCount
        };
    }
}

// ==================== CHART ENGINE CLASS ====================
class ChartEngine {
    constructor() {
        this.charts = {};
        this.mtnColors = {
            primary: '#FFCB05',
            success: '#4CAF50',
            info: '#2196F3',
            warning: '#FF9800',
            danger: '#F44336',
            purple: '#9C27B0',
            teal: '#00BCD4',
            lime: '#8BC34A',
            deepOrange: '#FF5722',
            blueGrey: '#607D8B'
        };
        console.log('📈 ChartEngine: Initialized');
    }

    /**
     * Destroy specific chart
     */
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
            console.log(`🗑️ ChartEngine: Destroyed chart ${chartId}`);
        }
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        Object.keys(this.charts).forEach(id => this.destroyChart(id));
        console.log('🗑️ ChartEngine: All charts destroyed');
    }

    /**
     * Generate color palette
     */
    generateColors(count) {
        const colorValues = Object.values(this.mtnColors);
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(colorValues[i % colorValues.length]);
        }
        return colors;
    }

    /**
     * Create doughnut chart
     */
    createDoughnutChart(canvasId, title, data) {
        this.destroyChart(canvasId);

        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`⚠️ Canvas ${canvasId} not found`);
            return null;
        }

        const labels = Object.keys(data);
        const values = Object.values(data);
        const colors = this.generateColors(labels.length);

        this.charts[canvasId] = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#0A0A0A',
                    borderWidth: 3,
                    hoverOffset: 15
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
                                size: 12,
                                family: 'Segoe UI'
                            },
                            boxWidth: 15,
                            boxHeight: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1A1A1A',
                        titleColor: '#FFCB05',
                        bodyColor: '#FFFFFF',
                        borderColor: '#FFCB05',
                        borderWidth: 2,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        console.log(`✅ ChartEngine: Created doughnut chart ${canvasId}`);
        return this.charts[canvasId];
    }

    /**
     * Create bar chart
     */
    createBarChart(canvasId, title, data) {
        this.destroyChart(canvasId);

        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`⚠️ Canvas ${canvasId} not found`);
            return null;
        }

        const labels = Object.keys(data);
        const values = Object.values(data);

        this.charts[canvasId] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: values,
                    backgroundColor: this.mtnColors.primary,
                    borderColor: '#E6B500',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
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
                            stepSize: 1,
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: '#2A2A2A',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#FFFFFF',
                            font: {
                                size: 11
                            },
                            maxRotation: 45,
                            minRotation: 0
                        },
                        grid: {
                            display: false,
                            drawBorder: false
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
                        borderWidth: 2,
                        padding: 12,
                        displayColors: false
                    }
                }
            }
        });

        console.log(`✅ ChartEngine: Created bar chart ${canvasId}`);
        return this.charts[canvasId];
    }
}

// ==================== UI CONTROLLER CLASS ====================
class UIController {
    constructor(assetManager, chartEngine) {
        this.assetManager = assetManager;
        this.chartEngine = chartEngine;
        this.currentView = 'dashboard';
        this.currentFilters = {
            search: '',
            os: '',
            type: '',
            environment: ''
        };
        console.log('🎨 UIController: Initialized');
    }

    /**
     * Initialize UI and event listeners
     */
    init() {
        this.setupEventListeners();
        this.updateUI();
        console.log('✅ UIController: Ready');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchView(btn.dataset.view);
            });
        });

        // File upload - Drop zone
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const browseBtn = document.getElementById('browse-btn');

        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file) this.handleFileUpload(file);
            });
        }

        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
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

        // Clear button
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllData());
        }

        // Search and filters
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.renderInventoryTable();
            });
        }

        const osFilter = document.getElementById('os-filter');
        if (osFilter) {
            osFilter.addEventListener('change', (e) => {
                this.currentFilters.os = e.target.value;
                this.renderInventoryTable();
            });
        }

        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.currentFilters.type = e.target.value;
                this.renderInventoryTable();
            });
        }

        const envFilter = document.getElementById('env-filter');
        if (envFilter) {
            envFilter.addEventListener('change', (e) => {
                this.currentFilters.environment = e.target.value;
                this.renderInventoryTable();
            });
        }

        // Data change listener
        window.addEventListener('asset-data-changed', () => {
            this.updateUI();
        });

        console.log('✅ UIController: Event listeners setup complete');
    }

    /**
     * Switch between views
     */
    switchView(viewName) {
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === viewName) {
                btn.classList.add('active');
            }
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }

        this.currentView = viewName;
        console.log(`📍 UIController: Switched to ${viewName} view`);

        // Render charts if switching to dashboard
        if (viewName === 'dashboard' && this.assetManager.hasData()) {
            setTimeout(() => this.renderAllCharts(), 100);
        }

        // Update inventory if switching to inventory view
        if (viewName === 'inventory') {
            this.populateFilters();
            this.renderInventoryTable();
        }
    }

    /**
     * Handle file upload
     */
    handleFileUpload(file) {
        if (!file.name.endsWith('.csv')) {
            alert('⚠️ Please upload a CSV file');
            return;
        }

        console.log(`📁 UIController: Uploading file ${file.name}`);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.assetManager.importCSV(e.target.result);
                alert(`✅ Successfully imported ${this.assetManager.data.length} asset records!`);
                this.switchView('dashboard');
            } catch (error) {
                console.error('❌ Error importing CSV:', error);
                alert('❌ Error parsing CSV file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    /**
     * Export data to CSV
     */
    exportData() {
        if (!this.assetManager.hasData()) {
            alert('⚠️ No data to export');
            return;
        }

        const csv = this.assetManager.exportCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mtn-it-assets-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('💾 UIController: Data exported successfully');
    }

    /**
     * Clear all data
     */
    clearAllData() {
        if (confirm('⚠️ Are you sure you want to clear all data? This action cannot be undone.')) {
            this.assetManager.clearAllData();
            this.chartEngine.destroyAllCharts();
            this.updateUI();
            alert('✅ All data has been cleared');
        }
    }

    /**
     * Update entire UI
     */
    updateUI() {
        this.renderMetrics();
        this.renderAllCharts();
        this.renderTopApplications();
        this.renderBreakdowns();
        this.populateFilters();
        this.renderInventoryTable();
        console.log('🔄 UIController: UI updated');
    }

    /**
     * Render metric cards
     */
    renderMetrics() {
        const metrics = this.assetManager.getMetrics();

        this.setElementText('total-assets', metrics.totalAssets);
        this.setElementText('physical-count', metrics.physicalCount);
        this.setElementText('physical-percent', `${metrics.physicalPercent}%`);
        this.setElementText('vm-count', metrics.vmCount);
        this.setElementText('vm-percent', `${metrics.vmPercent}%`);
        this.setElementText('app-count', metrics.appCount);

        console.log('📊 UIController: Metrics rendered');
    }

    /**
     * Render all charts
     */
    renderAllCharts() {
        if (!this.assetManager.hasData()) {
            console.log('⚠️ UIController: No data for charts');
            return;
        }

        // OS Distribution Chart
        const osData = this.assetManager.getOSDistribution();
        if (Object.keys(osData).length > 0) {
            this.chartEngine.createDoughnutChart('osChart', 'Operating Systems', osData);
        }

        // Deployment Types Chart
        const deploymentData = this.assetManager.getDeploymentStats();
        if (Object.keys(deploymentData).length > 0) {
            this.chartEngine.createDoughnutChart('deploymentChart', 'Deployment Types', deploymentData);
        }

        // Environment Status Chart
        const envData = this.assetManager.getEnvironmentStats();
        if (Object.keys(envData).length > 0) {
            this.chartEngine.createDoughnutChart('statusChart', 'Environment Status', envData);
        }

        // Managed By Chart
        const managedData = this.assetManager.getManagedByStats();
        if (Object.keys(managedData).length > 0) {
            this.chartEngine.createBarChart('managedChart', 'Managed By', managedData);
        }

        console.log('📈 UIController: All charts rendered');
    }

    /**
     * Render top 10 applications
     */
    renderTopApplications() {
        const container = document.getElementById('top-apps');
        if (!container) return;

        if (!this.assetManager.hasData()) {
            container.innerHTML = '<p class="no-data">No application data available</p>';
            return;
        }

        const appStats = this.assetManager.getApplicationStats();
        const topApps = appStats.topApps;

        if (topApps.length === 0) {
            container.innerHTML = '<p class="no-data">No applications found</p>';
            return;
        }

        const maxCount = Math.max(...topApps.map(([, count]) => count));

        container.innerHTML = topApps.map(([name, count]) => {
            const percentage = (count / maxCount) * 100;
            return `
                <div class="app-item">
                    <div class="app-item-header">
                        <span class="app-name">${name}</span>
                        <span class="app-count">${count}</span>
                    </div>
                    <div class="app-bar">
                        <div class="app-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        console.log('🎯 UIController: Top applications rendered');
    }

    /**
     * Render breakdown sections
     */
    renderBreakdowns() {
        if (!this.assetManager.hasData()) {
            this.renderEmptyBreakdown('os-breakdown');
            this.renderEmptyBreakdown('classification-breakdown');
            this.renderEmptyBreakdown('environment-breakdown');
            return;
        }

        // OS Breakdown
        const osData = this.assetManager.getOSDistribution();
        this.renderBreakdownSection('os-breakdown', osData);

        // Classification Breakdown
        const classData = this.assetManager.getClassificationStats();
        this.renderBreakdownSection('classification-breakdown', classData);

        // Environment Breakdown
        const envData = this.assetManager.getEnvironmentStats();
        this.renderBreakdownSection('environment-breakdown', envData);

        console.log('📋 UIController: Breakdowns rendered');
    }

    /**
     * Render individual breakdown section
     */
    renderBreakdownSection(elementId, data) {
        const container = document.getElementById(elementId);
        if (!container) return;

        const entries = Object.entries(data).slice(0, 5);
        const total = Object.values(data).reduce((a, b) => a + b, 0);

        if (entries.length === 0) {
            container.innerHTML = '<p class="no-data" style="font-size: 0.9rem;">No data</p>';
            return;
        }

        container.innerHTML = entries.map(([label, value]) => {
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `
                <div class="breakdown-item">
                    <span class="breakdown-label">${label}</span>
                    <span class="breakdown-value">${value}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Render empty breakdown
     */
    renderEmptyBreakdown(elementId) {
        const container = document.getElementById(elementId);
        if (container) {
            container.innerHTML = '<p class="no-data" style="font-size: 0.9rem;">No data available</p>';
        }
    }

    /**
     * Populate filter dropdowns
     */
    populateFilters() {
        if (!this.assetManager.hasData()) return;

        // OS Filter
        const osColumn = this.assetManager.detectColumn(['OS', 'Operating System', 'OS Type']);
        if (osColumn) {
            const osValues = [...new Set(this.assetManager.data.map(row => row[osColumn]))].filter(v => v);
            this.populateSelect('os-filter', osValues, 'All OS');
        }

        // Type Filter
        const typeColumn = this.assetManager.detectColumn(['Standalone/VM/Virtualised', 'Type', 'Deployment']);
        if (typeColumn) {
            const typeValues = [...new Set(this.assetManager.data.map(row => row[typeColumn]))].filter(v => v);
            this.populateSelect('type-filter', typeValues, 'All Types');
        }

        // Environment Filter
        const envColumn = this.assetManager.detectColumn(['Status/Environment', 'Environment', 'Status']);
        if (envColumn) {
            const envValues = [...new Set(this.assetManager.data.map(row => row[envColumn]))].filter(v => v);
            this.populateSelect('env-filter', envValues, 'All Environments');
        }

        console.log('🔽 UIController: Filters populated');
    }

    /**
     * Populate select dropdown
     */
    populateSelect(selectId, values, defaultText) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = `<option value="">${defaultText}</option>`;

        values.sort().forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    }

    /**
     * Render inventory table
     */
    renderInventoryTable() {
        const tableHeaders = document.getElementById('table-headers');
        const tableBody = document.getElementById('table-body');
        const inventoryCount = document.getElementById('inventory-count');

        if (!tableHeaders || !tableBody) return;

        if (!this.assetManager.hasData()) {
            tableHeaders.innerHTML = '';
            tableBody.innerHTML = '<tr><td colspan="100" class="no-data">No asset data available. Import a CSV file to get started.</td></tr>';
            if (inventoryCount) inventoryCount.textContent = 'Showing 0 of 0 assets';
            return;
        }

        // Apply filters
        let filteredData = this.assetManager.data;

        // Search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filteredData = filteredData.filter(row =>
                Object.values(row).some(val =>
                    String(val).toLowerCase().includes(searchTerm)
                )
            );
        }

        // OS filter
        if (this.currentFilters.os) {
            const osColumn = this.assetManager.detectColumn(['OS', 'Operating System', 'OS Type']);
            if (osColumn) {
                filteredData = filteredData.filter(row => row[osColumn] === this.currentFilters.os);
            }
        }

        // Type filter
        if (this.currentFilters.type) {
            const typeColumn = this.assetManager.detectColumn(['Standalone/VM/Virtualised', 'Type', 'Deployment']);
            if (typeColumn) {
                filteredData = filteredData.filter(row => row[typeColumn] === this.currentFilters.type);
            }
        }

        // Environment filter
        if (this.currentFilters.environment) {
            const envColumn = this.assetManager.detectColumn(['Status/Environment', 'Environment', 'Status']);
            if (envColumn) {
                filteredData = filteredData.filter(row => row[envColumn] === this.currentFilters.environment);
            }
        }

        // Render headers
        tableHeaders.innerHTML = this.assetManager.headers.map(h => `<th>${h}</th>`).join('');

        // Render rows
        if (filteredData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${this.assetManager.headers.length}" class="no-data">No matching assets found</td></tr>`;
        } else {
            tableBody.innerHTML = filteredData.map(row => {
                const cells = this.assetManager.headers.map(header => {
                    const value = row[header] || '';
                    return `<td>${this.formatCellValue(value)}</td>`;
                }).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
        }

        // Update count
        if (inventoryCount) {
            inventoryCount.textContent = `Showing ${filteredData.length} of ${this.assetManager.data.length} assets`;
        }

        console.log(`📋 UIController: Inventory table rendered (${filteredData.length} rows)`);
    }

    /**
     * Format cell value with badges for status
     */
    formatCellValue(value) {
        if (!value || value === '') return '<span style="color: #808080;">-</span>';

        const lowerValue = String(value).toLowerCase();

        // Status badges
        if (lowerValue === 'active' || lowerValue === 'production' || lowerValue === 'operational') {
            return `<span class="status-badge status-active">${value}</span>`;
        }
        if (lowerValue === 'inactive' || lowerValue === 'offline' || lowerValue === 'decommissioned') {
            return `<span class="status-badge status-inactive">${value}</span>`;
        }
        if (lowerValue === 'maintenance' || lowerValue === 'development' || lowerValue === 'staging') {
            return `<span class="status-badge status-maintenance">${value}</span>`;
        }

        return value;
    }

    /**
     * Set element text safely
     */
    setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }
}

// ==================== APPLICATION INITIALIZATION ====================
class MTNITAssetDashboard {
    constructor() {
        this.assetManager = new ITAssetManager();
        this.chartEngine = new ChartEngine();
        this.uiController = new UIController(this.assetManager, this.chartEngine);
        console.log('🚀 MTN IT Asset Dashboard: Application instance created');
    }

    init() {
        this.uiController.init();
        console.log('%c ✅ Application Ready! ', 'background: #4CAF50; color: #FFFFFF; font-size: 14px; font-weight: bold; padding: 8px;');
    }
}

// Initialize application when DOM is ready
let dashboardApp;
document.addEventListener('DOMContentLoaded', () => {
    dashboardApp = new MTNITAssetDashboard();
    dashboardApp.init();
});

// Export for debugging
window.MTNDashboard = {
    app: () => dashboardApp,
    version: '2.0',
    author: 'MTN IT Department'
};

console.log('%c Dashboard v2.0 Loaded ', 'background: #2196F3; color: #FFFFFF; font-size: 12px; padding: 5px;');
