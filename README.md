# Nuzlocke Tracker with Real-Time Streaming Support

A comprehensive Nuzlocke tracker application with advanced features for Pokemon challenge runs, including real-time data streaming for OBS overlays and streaming setups. The tracker part is from https://github.com/domtronn/nuzlocke.app

## Features

### Core Tracking
- **Pokemon Management**: Track caught, dead, and boxed Pokemon with detailed information
- **Team Builder**: Manage your active team with drag-and-drop functionality
- **Death Tracking**: Record death causes with trainer, location, and opponent details
- **Boss Battle Analysis**: Get strategic advice for gym leaders and important battles
- **Multiple Game Support**: Supports various Pokemon games and ROM hacks

### Streaming & OBS Integration
- **Real-Time Data API**: Live data access for streaming overlays
- **Customizable OBS Overlay**: Fully configurable overlay with multiple layout options
- **Auto-Sync**: Automatic data synchronization between tracker and streaming setup
- **Graveyard Memorial**: Scrolling display of fallen Pokemon with death causes
- **Configuration Interface**: Easy setup tool for customizing overlay appearance

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NuzlockeApp/nuzlocke.app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the main tracker**
   ```bash
   npm run dev
   ```
   The tracker will be available at `http://localhost:5173`

### For Streaming Setup

1. **Start the standalone API server** (in a separate terminal)
   ```bash
   node standalone-server.js
   ```
   The API server will run on `http://localhost:5174`

2. **Access streaming tools**
   - **OBS Overlay**: `http://localhost:5174/examples/obs-overlay.html`
   - **Configuration Tool**: `http://localhost:5174/examples/obs-config.html`
   - **API Endpoints**: `http://localhost:5174/api/external?endpoint=full`

## Streaming Features

### OBS Overlay Customization
The overlay supports extensive customization through URL parameters:

- **Layout Options**: Grid (2x3), Horizontal Line, Vertical Line
- **Display Toggles**: Team, stats, graveyard, game info
- **Pokemon Details**: Nature, ability, catch location, types
- **Real-Time Updates**: Automatic data refresh every 2 seconds

### Configuration Tool
Use the web-based configuration interface to:
- Toggle display elements on/off
- Choose team layout styles
- Preview changes in real-time
- Generate custom URLs for OBS browser sources

### Auto-Sync System
- Automatically detects changes in your tracker
- Syncs data to the API server without manual intervention
- Visual indicator shows connection status
- Smart logging (only reports actual changes)

## API Endpoints

The standalone server provides several API endpoints:

- `/api/external?endpoint=full` - Complete game data
- `/api/external?endpoint=team` - Current team only
- `/api/external?endpoint=dead` - Graveyard data
- `/api/external?endpoint=stats` - Game statistics
- `/api/external?endpoint=box` - Boxed Pokemon

## Development

### Project Structure
```
nuzlocke.app/
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte components
│   │   ├── data/          # Game data and configurations
│   │   ├── utils/         # Utility functions
│   │   └── api/           # API integration
│   └── routes/            # SvelteKit routes
├── static/
│   ├── examples/          # OBS overlay examples
│   └── api/              # Static API data
├── standalone-server.js   # External API server
└── package.json
```

### Key Technologies
- **SvelteKit**: Main application framework
- **Tailwind CSS**: Styling and responsive design
- **Node.js**: Standalone API server
- **LocalStorage**: Data persistence
- **Real-time APIs**: Live data streaming

### Contributing

Contributions are welcome! Areas for improvement:

1. **Game Data**: Add support for new games and ROM hacks
2. **Overlay Themes**: Create new visual themes for streaming
3. **API Features**: Extend the external API with new endpoints
4. **Mobile Support**: Improve mobile responsiveness
5. **Performance**: Optimize data handling and rendering

### Adding New Games

To add support for a new game:

1. Add game data to `src/lib/data/games.json`
2. Create route data in `src/lib/data/routes.json`
3. Add trainer/boss data to `src/lib/data/trainers.json`
4. Include any patches in `src/lib/data/patches.json`

## Troubleshooting

### Common Issues

**OBS Overlay not updating**
- Ensure both servers are running (ports 5173 and 5174)
- Check browser console for API connection errors
- Verify auto-sync is enabled in the main tracker

**Data not syncing**
- Refresh the main tracker page to restart auto-sync
- Check that localStorage contains game data
- Verify the standalone server is accessible

**Pokemon sprites not loading**
- Sprites are loaded from Pokemon Showdown's servers
- Check internet connection for external sprite access
- Fallback sprites will be used if primary sources fail

## Usage Examples

### Basic Nuzlocke Tracking
1. Start a new run by selecting your game
2. Add Pokemon as you encounter them
3. Track their status (caught, dead, boxed)
4. Use the team builder for battle planning

### Streaming Setup
1. Start both the main tracker and standalone server
2. Add the OBS overlay as a browser source
3. Use the configuration tool to customize appearance
4. Auto-sync will keep your overlay updated in real-time

### Death Tracking
When a Pokemon dies:
- Use the death modal to record details
- Specify the trainer, location, and cause
- The graveyard will show "Killed by [trainer]" or "Caught at [location]" appropriately

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Pokemon Showdown for sprite resources
- SvelteKit team for the excellent framework
- The Nuzlocke community for inspiration and feedback

## Support

For issues, feature requests, or questions:
1. Check the troubleshooting section above
2. Review existing issues in the repository
3. Create a new issue with detailed information about your problem

---

**Happy Nuzlocking!** 🔥⚔️ 
