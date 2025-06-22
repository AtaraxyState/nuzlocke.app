# 🔥 Nuzlocke External API

The Nuzlocke External API provides real-time access to your Nuzlocke run data for streaming platforms, OBS overlays, and third-party integrations.

## 🚀 Quick Start

The API is automatically loaded when you use the Nuzlocke tracker. You can access it through the browser console or external scripts.

### Browser Console Access

```javascript
// Get current team
await NuzlockeAPI.getTeam()

// Get full run data
await NuzlockeAPI.getFull()

// Get run statistics
await NuzlockeAPI.getStatus()
```

### Real-time Updates

```javascript
// Start listening for updates
NuzlockeEmitter.startPolling(1000) // Poll every 1 second

// Listen for team changes
NuzlockeEmitter.addEventListener('teamUpdate', (event) => {
  console.log('Team updated:', event.detail)
})

// Listen for any data changes
NuzlockeEmitter.addEventListener('dataUpdate', (event) => {
  console.log('Data updated:', event.detail)
})
```

## 📡 API Endpoints

### Base URL: `/api/external`

All endpoints support CORS and return JSON data.

#### Required Headers
- `x-game-data`: Current game localStorage data
- `x-saves-data`: Saved games localStorage data

### Available Endpoints

#### 1. Status Overview
**GET** `/api/external?endpoint=status`

Returns basic run information and statistics.

**Response:**
```json
{
  "gameId": "abc123",
  "gameName": "My Emerald Nuzlocke",
  "gameVersion": "emerald",
  "created": "1640995200000",
  "updated": "1640999999000",
  "attempts": 1,
  "team": [...],
  "teamCount": 6,
  "boxCount": 15,
  "deadCount": 3,
  "starter": "fire"
}
```

#### 2. Current Team
**GET** `/api/external?endpoint=team`

Returns the active team Pokemon.

**Response:**
```json
{
  "gameId": "abc123",
  "team": [
    {
      "locationId": "route_103",
      "pokemon": "blaziken",
      "name": "Blaziken",
      "level": 45,
      "status": 1,
      "nature": "adamant",
      "ability": "blaze",
      "moves": ["flamethrower", "sky_uppercut", "slash", "focus_energy"],
      "types": ["fire", "fighting"],
      "stats": { "hp": 156, "atk": 142, "def": 89, "spa": 120, "spd": 89, "spe": 100 },
      "nickname": "Flamebird"
    }
  ]
}
```

#### 3. Box Pokemon
**GET** `/api/external?endpoint=box`

Returns all available (living) Pokemon in the box.

#### 4. Deceased Pokemon
**GET** `/api/external?endpoint=dead`

Returns all deceased Pokemon.

#### 5. Boss Teams
**GET** `/api/external?endpoint=bosses`

Returns boss fight team history.

#### 6. Full Data
**GET** `/api/external?endpoint=full`

Returns all data combined - most useful for overlays.

## 🎮 OBS Integration

### Browser Source Setup

1. **Add Browser Source** in OBS
2. **URL**: `http://localhost:5173/examples/obs-overlay.html`
3. **Width**: 1920, **Height**: 1080
4. **Custom CSS** (optional): Add your own styling

### Example Overlay Features

- **Current Team Display**: Shows active team with levels and types
- **Statistics Panel**: Team size, box count, deaths, total caught
- **Game Information**: Current game name and version
- **Real-time Updates**: Automatically refreshes when data changes
- **Type Color Coding**: Pokemon types with official colors
- **Shiny Highlighting**: Special border for shiny Pokemon

## 🔧 Custom Integration

### Creating Your Own Overlay

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Nuzlocke Overlay</title>
</head>
<body>
    <div id="team-display"></div>
    
    <script>
        async function updateTeam() {
            try {
                // Access parent window's API (for browser source)
                if (window.parent && window.parent.NuzlockeAPI) {
                    const data = await window.parent.NuzlockeAPI.getTeam()
                    displayTeam(data.team)
                }
            } catch (error) {
                console.error('Failed to get team:', error)
            }
        }
        
        function displayTeam(team) {
            const display = document.getElementById('team-display')
            display.innerHTML = team.map(pokemon => `
                <div class="pokemon">
                    <h3>${pokemon.nickname || pokemon.name}</h3>
                    <p>Level ${pokemon.level}</p>
                    <p>Types: ${pokemon.types.join(', ')}</p>
                </div>
            `).join('')
        }
        
        // Update every 2 seconds
        setInterval(updateTeam, 2000)
        updateTeam() // Initial load
    </script>
    
    <style>
        .pokemon {
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            margin: 5px;
            border-radius: 5px;
        }
    </style>
</body>
</html>
```

### JavaScript API Reference

#### `NuzlockeAPI` Object

| Method | Description | Returns |
|--------|-------------|---------|
| `getTeam()` | Get current team | Promise<TeamData> |
| `getBox()` | Get box Pokemon | Promise<BoxData> |
| `getDead()` | Get deceased Pokemon | Promise<DeadData> |
| `getStatus()` | Get run status | Promise<StatusData> |
| `getBosses()` | Get boss history | Promise<BossData> |
| `getFull()` | Get all data | Promise<FullData> |
| `getCurrentGameData()` | Get raw localStorage data | Object\|null |

#### `NuzlockeEmitter` Object

| Method | Description |
|--------|-------------|
| `startPolling(ms)` | Start checking for updates |
| `stopPolling()` | Stop checking for updates |
| `addEventListener(event, callback)` | Listen for events |

#### Events

- `dataUpdate`: Any data changed
- `teamUpdate`: Team composition changed
- `statsUpdate`: Statistics changed
- `error`: API error occurred

## 🎨 Customization

### Pokemon Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 1 | Captured | Caught in the wild |
| 2 | Received | Gift or starter Pokemon |
| 3 | Traded | Obtained through trade |
| 4 | Missed | Encounter missed/fled |
| 5 | Dead | Fainted (deceased) |
| 6 | Shiny | Shiny Pokemon |
| 7 | Trash | Unwanted/released |

### Type Colors (CSS Classes)

Use these CSS classes for type-colored badges:

```css
.type-normal { background-color: #A8A090; }
.type-fire { background-color: #F05030; }
.type-water { background-color: #3890F0; }
.type-electric { background-color: #F0C040; }
.type-grass { background-color: #78C850; }
.type-ice { background-color: #58C8E0; }
.type-fighting { background-color: #A05038; }
.type-poison { background-color: #A040A0; }
.type-ground { background-color: #E0C068; }
.type-flying { background-color: #A890F0; }
.type-psychic { background-color: #F05898; }
.type-bug { background-color: #A8B820; }
.type-rock { background-color: #B8A038; }
.type-ghost { background-color: #705898; }
.type-dragon { background-color: #7038F8; }
.type-dark { background-color: #705848; }
.type-steel { background-color: #B8B8D0; }
.type-fairy { background-color: #F0B6BC; }
```

## 🐛 Troubleshooting

### Common Issues

1. **"NuzlockeAPI is not defined"**
   - Make sure you're accessing the API from within the Nuzlocke app context
   - For browser sources, ensure the parent window has the app loaded

2. **"No data available"**
   - Check that you have an active Nuzlocke run
   - Verify localStorage has data (use `NuzlockeAPI.debug.localStorage()`)

3. **Data not updating**
   - Check if polling is started: `NuzlockeEmitter.startPolling(1000)`
   - Verify the game data is actually changing in the app

4. **CORS errors**
   - The external API endpoint includes CORS headers
   - For local development, make sure you're accessing from the same origin

### Debug Helpers

```javascript
// Check available storage data
NuzlockeAPI.debug.localStorage()

// Get current game info
NuzlockeAPI.debug.currentGame()

// Check storage size
NuzlockeAPI.debug.storageSize()
```

## 🔒 Security & Privacy

- The API only exposes read-only access to your run data
- No personal information is transmitted
- All data stays in your browser's localStorage
- CORS is enabled for local integrations only

## 📞 Support

If you encounter issues with the external API:

1. Check the browser console for error messages
2. Verify your Nuzlocke app is working normally
3. Test with the debug helpers provided
4. Open an issue on the GitHub repository with detailed information

---

**Happy streaming! 🎮✨** 