// MTN Infrastructure Mapper Application
// Data Storage
class AssetManager {
    constructor() {
        this.storageKey = 'mtn-assets';
        this.assets = this.loadAssets();
        this.editingAssetId = null;
    }

    loadAssets() {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            return JSON.parse(data);
        }
        // Sample data for demonstration
        return [
            {
                id: this.generateId(),
                name: 'Lagos Central Tower',
                type: 'tower',
                latitude: 6.5244,
                longitude: 3.3792,
                address: 'Victoria Island, Lagos',
                status: 'active',
                notes: 'Main tower serving VI area',
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                name: 'Abuja North Station',
                type: 'station',
                latitude: 9.0765,
                longitude: 7.3986,
                address: 'Maitama, Abuja',
                status: 'active',
                notes: 'Base station for Maitama district',
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                name: 'Port Harcourt Equipment Hub',
                type: 'equipment',
                latitude: 4.8156,
                longitude: 7.0498,
                address: 'Trans Amadi, Port Harcourt',
                status: 'maintenance',
                notes: 'Network equipment under routine maintenance',
                createdAt: new Date().toISOString()
            }
        ];
    }

    saveAssets() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.assets));
        this.notifyChange();
    }

    generateId() {
        return 'asset-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    addAsset(assetData) {
        const asset = {
            ...assetData,
            id: this.generateId(),
            createdAt: new Date().toISOString()
        };
        this.assets.push(asset);
        this.saveAssets();
        return asset;
    }

    updateAsset(id, assetData) {
        const index = this.assets.findIndex(a => a.id === id);
        if (index !== -1) {
            this.assets[index] = {
                ...this.assets[index],
                ...assetData,
                updatedAt: new Date().toISOString()
            };
            this.saveAssets();
            return this.assets[index];
        }
        return null;
    }

    deleteAsset(id) {
        const index = this.assets.findIndex(a => a.id === id);
        if (index !== -1) {
            this.assets.splice(index, 1);
            this.saveAssets();
            return true;
        }
        return false;
    }

    getAsset(id) {
        return this.assets.find(a => a.id === id);
    }

    getAllAssets() {
        return this.assets;
    }

    filterAssets(filters) {
        return this.assets.filter(asset => {
            if (filters.type && filters.type !== 'all' && asset.type !== filters.type) {
                return false;
            }
            if (filters.status && filters.status !== 'all' && asset.status !== filters.status) {
                return false;
            }
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                return asset.name.toLowerCase().includes(searchTerm) ||
                       asset.address.toLowerCase().includes(searchTerm);
            }
            return true;
        });
    }

    notifyChange() {
        window.dispatchEvent(new Event('assets-changed'));
    }
}

// Map Manager
class MapManager {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.map = null;
        this.miniMap = null;
        this.markers = {};
        this.markerIcons = this.createMarkerIcons();
    }

    createMarkerIcons() {
        const iconConfigs = {
            tower: { color: '#FFCB05', icon: '📡' },
            station: { color: '#4CAF50', icon: '🏢' },
            equipment: { color: '#FF9800', icon: '⚙️' }
        };

        const icons = {};
        for (const [type, config] of Object.entries(iconConfigs)) {
            icons[type] = L.divIcon({
                html: `
                    <div style="
                        background: ${config.color};
                        width: 35px;
                        height: 35px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 3px solid #0A0A0A;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
                        font-size: 18px;
                    ">${config.icon}</div>
                `,
                className: 'custom-marker',
                iconSize: [35, 35],
                iconAnchor: [17, 17]
            });
        }
        return icons;
    }

    initMainMap() {
        if (this.map) return;

        // Center on Nigeria
        this.map = L.map('map').setView([9.0820, 8.6753], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        this.updateMarkers();

        // Click to add new asset
        this.map.on('click', (e) => {
            if (window.confirm('Add a new asset at this location?')) {
                document.getElementById('asset-latitude').value = e.latlng.lat.toFixed(6);
                document.getElementById('asset-longitude').value = e.latlng.lng.toFixed(6);
                app.openAssetModal();
            }
        });
    }

    initMiniMap() {
        if (this.miniMap) return;

        this.miniMap = L.map('mini-map').setView([9.0820, 8.6753], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.miniMap);

        this.updateMiniMapMarkers();
    }

    updateMarkers(filter = 'all') {
        if (!this.map) return;

        // Clear existing markers
        Object.values(this.markers).forEach(marker => marker.remove());
        this.markers = {};

        // Add markers for assets
        const assets = filter === 'all'
            ? this.assetManager.getAllAssets()
            : this.assetManager.filterAssets({ type: filter });

        assets.forEach(asset => {
            const marker = L.marker([asset.latitude, asset.longitude], {
                icon: this.markerIcons[asset.type]
            }).addTo(this.map);

            const popupContent = `
                <div class="popup-content">
                    <h3>${asset.name}</h3>
                    <p><strong>Type:</strong> ${this.formatType(asset.type)}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${asset.status}">${asset.status.toUpperCase()}</span></p>
                    <p><strong>Location:</strong> ${asset.address || 'N/A'}</p>
                    ${asset.notes ? `<p><strong>Notes:</strong> ${asset.notes}</p>` : ''}
                </div>
            `;

            marker.bindPopup(popupContent);
            this.markers[asset.id] = marker;
        });
    }

    updateMiniMapMarkers() {
        if (!this.miniMap) return;

        const assets = this.assetManager.getAllAssets();
        assets.forEach(asset => {
            L.marker([asset.latitude, asset.longitude], {
                icon: this.markerIcons[asset.type]
            }).addTo(this.miniMap);
        });
    }

    formatType(type) {
        const types = {
            tower: 'Cell Tower',
            station: 'Base Station',
            equipment: 'Network Equipment'
        };
        return types[type] || type;
    }

    fitBounds() {
        if (!this.map || this.assetManager.getAllAssets().length === 0) return;

        const bounds = L.latLngBounds(
            this.assetManager.getAllAssets().map(a => [a.latitude, a.longitude])
        );
        this.map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Main Application
class MTNDashboard {
    constructor() {
        this.assetManager = new AssetManager();
        this.mapManager = new MapManager(this.assetManager);
        this.currentView = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboardStats();
        this.updateActivityList();
        this.renderInventoryTable();

        // Listen for asset changes
        window.addEventListener('assets-changed', () => {
            this.updateDashboardStats();
            this.updateActivityList();
            this.renderInventoryTable();
            this.mapManager.updateMarkers();
            this.mapManager.updateMiniMapMarkers();
        });
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        // Map filter
        const mapFilter = document.getElementById('asset-filter');
        if (mapFilter) {
            mapFilter.addEventListener('change', (e) => {
                this.mapManager.updateMarkers(e.target.value);
            });
        }

        // Inventory filters
        document.getElementById('search-inventory').addEventListener('input', () => {
            this.renderInventoryTable();
        });

        document.getElementById('type-filter').addEventListener('change', () => {
            this.renderInventoryTable();
        });

        document.getElementById('status-filter').addEventListener('change', () => {
            this.renderInventoryTable();
        });

        // Modal controls
        document.getElementById('add-asset-btn').addEventListener('click', () => {
            this.openAssetModal();
        });

        document.getElementById('add-inventory-btn').addEventListener('click', () => {
            this.openAssetModal();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeAssetModal();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeAssetModal();
        });

        // Form submission
        document.getElementById('asset-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAssetSubmit();
        });

        // Close modal on outside click
        document.getElementById('asset-modal').addEventListener('click', (e) => {
            if (e.target.id === 'asset-modal') {
                this.closeAssetModal();
            }
        });
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

        // Initialize maps when switching to map views
        if (view === 'map') {
            setTimeout(() => {
                this.mapManager.initMainMap();
                this.mapManager.fitBounds();
            }, 100);
        } else if (view === 'dashboard') {
            setTimeout(() => {
                this.mapManager.initMiniMap();
            }, 100);
        }
    }

    updateDashboardStats() {
        const assets = this.assetManager.getAllAssets();

        const towers = assets.filter(a => a.type === 'tower').length;
        const stations = assets.filter(a => a.type === 'station').length;
        const equipment = assets.filter(a => a.type === 'equipment').length;
        const active = assets.filter(a => a.status === 'active').length;

        document.getElementById('total-towers').textContent = towers;
        document.getElementById('total-stations').textContent = stations;
        document.getElementById('total-equipment').textContent = equipment;
        document.getElementById('active-assets').textContent = active;
    }

    updateActivityList() {
        const activityList = document.getElementById('activity-list');
        const assets = this.assetManager.getAllAssets();

        if (assets.length === 0) {
            activityList.innerHTML = '<p class="no-data">No recent activity</p>';
            return;
        }

        // Sort by most recent
        const sortedAssets = [...assets].sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt);
            const dateB = new Date(b.updatedAt || b.createdAt);
            return dateB - dateA;
        });

        const recentAssets = sortedAssets.slice(0, 5);

        activityList.innerHTML = recentAssets.map(asset => {
            const date = new Date(asset.updatedAt || asset.createdAt);
            const timeAgo = this.getTimeAgo(date);
            const action = asset.updatedAt ? 'Updated' : 'Added';

            return `
                <div class="activity-item">
                    <div class="activity-time">${timeAgo}</div>
                    <div class="activity-text">
                        ${action} <strong>${asset.name}</strong> (${this.mapManager.formatType(asset.type)})
                    </div>
                </div>
            `;
        }).join('');
    }

    renderInventoryTable() {
        const tbody = document.getElementById('inventory-tbody');
        const searchTerm = document.getElementById('search-inventory').value;
        const typeFilter = document.getElementById('type-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        const filteredAssets = this.assetManager.filterAssets({
            search: searchTerm,
            type: typeFilter,
            status: statusFilter
        });

        if (filteredAssets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No assets found</td></tr>';
            return;
        }

        tbody.innerHTML = filteredAssets.map(asset => {
            const lastUpdated = new Date(asset.updatedAt || asset.createdAt);
            return `
                <tr>
                    <td>${asset.id.substring(0, 8)}...</td>
                    <td>${asset.name}</td>
                    <td>${this.mapManager.formatType(asset.type)}</td>
                    <td>${asset.address || 'N/A'}</td>
                    <td><span class="status-badge status-${asset.status}">${asset.status.toUpperCase()}</span></td>
                    <td>${lastUpdated.toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn" onclick="app.editAsset('${asset.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="app.deleteAsset('${asset.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    openAssetModal(assetId = null) {
        const modal = document.getElementById('asset-modal');
        const form = document.getElementById('asset-form');
        const title = document.getElementById('modal-title');

        form.reset();
        this.assetManager.editingAssetId = assetId;

        if (assetId) {
            title.textContent = 'Edit Asset';
            const asset = this.assetManager.getAsset(assetId);
            if (asset) {
                document.getElementById('asset-name').value = asset.name;
                document.getElementById('asset-type').value = asset.type;
                document.getElementById('asset-latitude').value = asset.latitude;
                document.getElementById('asset-longitude').value = asset.longitude;
                document.getElementById('asset-address').value = asset.address || '';
                document.getElementById('asset-status').value = asset.status;
                document.getElementById('asset-notes').value = asset.notes || '';
            }
        } else {
            title.textContent = 'Add New Asset';
        }

        modal.classList.add('active');
    }

    closeAssetModal() {
        document.getElementById('asset-modal').classList.remove('active');
        this.assetManager.editingAssetId = null;
    }

    handleAssetSubmit() {
        const assetData = {
            name: document.getElementById('asset-name').value,
            type: document.getElementById('asset-type').value,
            latitude: parseFloat(document.getElementById('asset-latitude').value),
            longitude: parseFloat(document.getElementById('asset-longitude').value),
            address: document.getElementById('asset-address').value,
            status: document.getElementById('asset-status').value,
            notes: document.getElementById('asset-notes').value
        };

        if (this.assetManager.editingAssetId) {
            this.assetManager.updateAsset(this.assetManager.editingAssetId, assetData);
        } else {
            this.assetManager.addAsset(assetData);
        }

        this.closeAssetModal();
    }

    editAsset(id) {
        this.openAssetModal(id);
    }

    deleteAsset(id) {
        const asset = this.assetManager.getAsset(id);
        if (asset && confirm(`Are you sure you want to delete "${asset.name}"?`)) {
            this.assetManager.deleteAsset(id);
        }
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }

        return 'Just now';
    }
}

// Initialize application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MTNDashboard();
});
