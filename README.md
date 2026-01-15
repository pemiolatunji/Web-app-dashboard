# MTN Infrastructure Mapper

A web application that illustrates the footprint of MTN infrastructure across Nigeria and enables collecting and updating asset inventory through an intuitive UI. Built with vanilla JavaScript, featuring a dark mode theme with MTN's signature yellow accent colors.

![MTN Infrastructure Mapper](https://img.shields.io/badge/MTN-Infrastructure%20Mapper-FFCB05?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzBBMEEwQSIgZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIvPjwvc3ZnPg==)

## Features

- **Interactive Map Visualization**: View all MTN infrastructure on an interactive map powered by Leaflet.js
- **Asset Management**: Full CRUD operations (Create, Read, Update, Delete) for infrastructure assets
- **Real-time Dashboard**: Overview of total towers, base stations, equipment, and active assets
- **Inventory Management**: Searchable and filterable asset inventory table
- **Dark Mode Design**: MTN-branded dark theme with yellow accents (#FFCB05)
- **Local Storage**: All data persists in browser's local storage
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Three Asset Types**:
  - Cell Towers 📡
  - Base Stations 🏢
  - Network Equipment ⚙️

## Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom styling with CSS Grid, Flexbox, and animations
- **Vanilla JavaScript**: No frameworks, pure ES6+
- **Leaflet.js**: Interactive map library
- **Font Awesome**: Icon library
- **LocalStorage API**: Client-side data persistence

## Project Structure

```
Web-app-mtn-dashboard/
│
├── index.html          # Main HTML structure
├── styles.css          # MTN-branded dark theme styling
├── app.js              # Application logic and functionality
└── README.md           # Documentation
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No installation required - it's a static web application!

### Installation & Launch

#### Method 1: Direct File Opening (Quick Start)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/pemiolatunji/Web-app-mtn-dashboard.git
   cd Web-app-mtn-dashboard
   ```

2. Open `index.html` directly in your browser:
   - **Windows**: Double-click `index.html` or right-click → Open with → Chrome/Firefox
   - **macOS**: Double-click `index.html` or right-click → Open With → Chrome/Firefox
   - **Linux**: Double-click or use: `xdg-open index.html`

#### Method 2: Using Python HTTP Server (Recommended)

1. Navigate to the project directory:
   ```bash
   cd Web-app-mtn-dashboard
   ```

2. Start a local server:

   **Python 3:**
   ```bash
   python -m http.server 8000
   ```

   **Python 2:**
   ```bash
   python -m SimpleHTTPServer 8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

#### Method 3: Using Node.js http-server

1. Install http-server globally (one-time):
   ```bash
   npm install -g http-server
   ```

2. Navigate to project directory and run:
   ```bash
   cd Web-app-mtn-dashboard
   http-server -p 8000
   ```

3. Open your browser to:
   ```
   http://localhost:8000
   ```

#### Method 4: Using PHP Built-in Server

1. Navigate to the project directory:
   ```bash
   cd Web-app-mtn-dashboard
   ```

2. Start PHP server:
   ```bash
   php -S localhost:8000
   ```

3. Open your browser to:
   ```
   http://localhost:8000
   ```

#### Method 5: Using VS Code Live Server Extension

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. Browser will automatically open at `http://127.0.0.1:5500`

## Usage Guide

### Dashboard View

The dashboard provides an overview of your infrastructure:
- **Total Towers**: Count of all cell towers
- **Base Stations**: Count of all base stations
- **Network Equipment**: Count of network equipment
- **Active Assets**: Count of currently active assets
- **Mini Map**: Quick visualization of asset locations
- **Recent Activity**: Latest updates to your inventory

### Map View

Interactive map showing all infrastructure assets:
- Click on markers to view asset details
- Click anywhere on the map to add a new asset at that location
- Use the filter dropdown to show specific asset types
- Different colored markers for different asset types:
  - Yellow 📡: Cell Towers
  - Green 🏢: Base Stations
  - Orange ⚙️: Network Equipment

### Inventory View

Complete asset management interface:
- **Search**: Find assets by name or location
- **Filters**: Filter by asset type and status
- **Add Asset**: Click the "+ Add Asset" button
- **Edit Asset**: Click the edit icon (✏️) in the actions column
- **Delete Asset**: Click the delete icon (🗑️) in the actions column

### Adding/Editing Assets

1. Click "Add Asset" button or click on the map
2. Fill in the form:
   - **Asset Name**: Descriptive name (e.g., "Lagos Central Tower")
   - **Asset Type**: Select from dropdown (Tower/Station/Equipment)
   - **Latitude/Longitude**: Coordinates (auto-filled if clicked on map)
   - **Address**: Physical location (optional)
   - **Status**: Active, Maintenance, or Inactive
   - **Notes**: Additional information (optional)
3. Click "Save Asset" to confirm

### Data Persistence

- All data is stored in your browser's LocalStorage
- Data persists between sessions
- To reset data: Clear browser's local storage or delete via browser DevTools
- Sample data is provided on first launch

## Sample Data

The application comes with three pre-loaded sample assets:

1. **Lagos Central Tower**
   - Type: Cell Tower
   - Location: Victoria Island, Lagos
   - Coordinates: 6.5244°N, 3.3792°E
   - Status: Active

2. **Abuja North Station**
   - Type: Base Station
   - Location: Maitama, Abuja
   - Coordinates: 9.0765°N, 7.3986°E
   - Status: Active

3. **Port Harcourt Equipment Hub**
   - Type: Network Equipment
   - Location: Trans Amadi, Port Harcourt
   - Coordinates: 4.8156°N, 7.0498°E
   - Status: Maintenance

## Testing the Application

### Basic Functionality Tests

1. **View Dashboard**:
   - Verify stat cards show correct counts
   - Check mini map displays markers
   - Confirm recent activity shows sample data

2. **Add New Asset**:
   - Click "Add Asset" button
   - Fill in all required fields
   - Submit and verify it appears in inventory and map

3. **Edit Existing Asset**:
   - Go to Inventory view
   - Click edit icon on any asset
   - Modify details and save
   - Verify changes appear everywhere

4. **Delete Asset**:
   - Click delete icon on any asset
   - Confirm deletion prompt
   - Verify asset is removed from all views

5. **Filter Assets**:
   - Use search box to find specific assets
   - Use type filter to show only towers/stations/equipment
   - Use status filter to show active/maintenance/inactive

6. **Map Interaction**:
   - Click markers to see popup details
   - Click on map to add asset at coordinates
   - Use map filter dropdown

### Browser Compatibility

Tested on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Customization

### Changing Colors

Edit `styles.css` and modify the CSS variables:

```css
:root {
    --mtn-yellow: #FFCB05;      /* MTN brand yellow */
    --bg-dark: #0A0A0A;         /* Main background */
    --bg-secondary: #1A1A1A;    /* Card backgrounds */
    --bg-tertiary: #2A2A2A;     /* Hover states */
}
```

### Adding New Asset Types

1. Update the `type` select options in `index.html`
2. Add corresponding icon in `app.js` `createMarkerIcons()` method
3. Add display formatting in `formatType()` method

### Modifying Map Center

Change default center in `app.js`:

```javascript
this.map = L.map('map').setView([9.0820, 8.6753], 6);
// [latitude, longitude], zoom_level
```

## Troubleshooting

### Map Not Displaying

- Ensure you have an active internet connection (Leaflet tiles load from CDN)
- Check browser console for errors (F12)
- Try refreshing the page

### Data Not Persisting

- Check if browser allows LocalStorage
- Verify you're not in private/incognito mode
- Clear cache and reload

### Markers Not Showing

- Ensure assets have valid latitude/longitude values
- Check that coordinates are within valid ranges (-90 to 90, -180 to 180)
- Verify asset type is one of: tower, station, equipment

### Performance Issues

- Clear old data from LocalStorage
- Reduce number of assets (optimize for <1000 assets)
- Close other browser tabs

## Future Enhancements

Potential features for future versions:
- Export data to CSV/JSON
- Import data from files
- User authentication
- Backend API integration
- Real-time asset status monitoring
- Advanced analytics and reporting
- Heatmap visualization
- Route planning between assets

## Browser DevTools Tips

### View Stored Data

1. Open DevTools (F12)
2. Go to Application tab
3. Click LocalStorage → your domain
4. Find key: `mtn-assets`
5. View/Edit JSON data

### Clear All Data

```javascript
localStorage.removeItem('mtn-assets');
location.reload();
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Author

Created for MTN Nigeria Infrastructure Management

## Support

For issues or questions, please open an issue on the GitHub repository.
