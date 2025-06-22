#!/usr/bin/env node

/**
 * Standalone server for Nuzlocke External API
 * This connects to real localStorage data from the Nuzlocke tracker
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Storage for real-time data (updated via HTTP requests)
let realTimeData = {
  gameData: null,
  savesData: null,
  lastUpdate: null,
  lastDataHash: null
}

// Storage keys (from the main app)
const IDS = {
  user: 'nuzlocke.user',
  theme: 'nuzlocke.theme',
  active: 'nuzlocke',
  saves: 'nuzlocke.saves',
  consent: 'nuzlocke.consent',
  support: 'nuzlocke.support',
  game: (id) => `nuzlocke.${id}`
}

// Fallback mock data for demo purposes (when no real data available)
const fallbackGameData = JSON.stringify({
  '__team': ['route_103', 'route_102'],
  '__teams': [
    {
      id: 'gym_1',
      name: 'Roxanne',
      type: 'rock',
      group: 'gym',
      team: [
        { sprite: 'geodude', id: 'route_103' },
        { sprite: 'nosepass', id: 'route_102' }
      ]
    }
  ],
  '__starter': 'fire',
  '__custom': [],
  'route_103': {
    pokemon: 'blaziken',
    name: 'Blaziken',
    level: 45,
    status: 1,
    nature: 'adamant',
    ability: 'blaze',
    moves: ['flamethrower', 'sky_uppercut', 'slash', 'focus_energy'],
    types: ['fire', 'fighting'],
    stats: { hp: 156, atk: 142, def: 89, spa: 120, spd: 89, spe: 100 },
    nickname: 'Flamebird'
  },
  'route_102': {
    pokemon: 'swellow',
    name: 'Swellow',
    level: 42,
    status: 1,
    types: ['normal', 'flying']
  },
  'route_104': {
    pokemon: 'gardevoir',
    name: 'Gardevoir',
    level: 44,
    status: 5, // Dead
    types: ['psychic', 'fairy'],
    death: {
      type: 'boss',
      trainer: {
        name: 'Norman',
        type: 'Gym Leader',
        speciality: 'normal'
      },
      opponent: {
        name: 'Slaking',
        types: ['normal']
      },
      attack: {
        name: 'Facade',
        type: 'normal'
      },
      location: {
        name: 'Petalburg Gym'
      }
    }
  },
  'route_105': {
    pokemon: 'pikachu',
    name: 'Pikachu',
    level: 25,
    status: 6, // Shiny
    types: ['electric']
  }
})

const fallbackSavesData = 'abc123|1640995200000>1640999999000|My%20Emerald%20Nuzlocke|emerald|settings|1'

// API logic (copied from our implementation)
function parseSavedGames(gameData) {
  if (!gameData) return {}
  
  return gameData
    .split(',')
    .filter(i => i.length)
    .map(i => i.split('|'))
    .reduce((acc, [id, time, name, game, settings, attempts = 1]) => {
      const [created, updated] = time.split('>')
      return {
        ...acc,
        [id]: {
          id,
          created,
          ...(updated ? { updated } : {}),
          name: decodeURIComponent(name),
          game,
          settings,
          attempts: +attempts || 1
        }
      }
    }, {})
}

function readGameData(payload) {
  if (!payload) return {}
  try {
    return typeof payload === 'string' ? JSON.parse(payload) : {}
  } catch (e) {
    console.error('Error parsing game data:', e)
    return {}
  }
}

function extractTeamData(data) {
  const team = data.__team || []
  return team
    .map(locationId => {
      const pokemon = data[locationId]
      if (!pokemon || !pokemon.pokemon) return null
      
      return {
        locationId,
        pokemon: pokemon.pokemon,
        name: pokemon.name || pokemon.pokemon,
        level: pokemon.level || 1,
        status: pokemon.status || 1,
        nature: pokemon.nature,
        ability: pokemon.ability,
        moves: pokemon.moves || [],
        types: pokemon.types || [],
        stats: pokemon.stats || {},
        nickname: pokemon.nickname
      }
    })
    .filter(Boolean)
    .filter(pokemon => pokemon.status !== 5) // Remove dead Pokemon from team
}

function extractBoxData(data) {
  const NuzlockeGroups = {
    Available: [1, 2, 3, 6], // Captured, Received, Traded, Shiny
    Dead: [5],
    Unavailable: [4, 5, 7] // Missed, Dead, Trash
  }
  
  return Object.entries(data)
    .filter(([, pokemon]) => pokemon.pokemon)
    .filter(([, { status }]) => NuzlockeGroups.Available.includes(status))
    .map(([locationId, pokemon]) => ({
      locationId,
      pokemon: pokemon.pokemon,
      name: pokemon.name || pokemon.pokemon,
      level: pokemon.level || 1,
      status: pokemon.status || 1,
      nature: pokemon.nature,
      ability: pokemon.ability,
      moves: pokemon.moves || [],
      types: pokemon.types || [],
      stats: pokemon.stats || {},
      nickname: pokemon.nickname
    }))
}

function extractDeadData(data) {
  return Object.entries(data)
    .filter(([, pokemon]) => pokemon.pokemon && pokemon.status === 5)
    .map(([locationId, pokemon]) => ({
      locationId,
      pokemon: pokemon.pokemon,
      name: pokemon.name || pokemon.pokemon,
      level: pokemon.level || 1,
      status: pokemon.status,
      nature: pokemon.nature,
      ability: pokemon.ability,
      moves: pokemon.moves || [],
      types: pokemon.types || [],
      stats: pokemon.stats || {},
      nickname: pokemon.nickname,
      death: pokemon.death || null // Include death information
    }))
}

function extractBossTeams(data) {
  const teams = data.__teams || []
  return teams.map(boss => ({
    id: boss.id,
    name: boss.name,
    type: boss.type,
    group: boss.group,
    team: boss.team || []
  }))
}

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase()
  return mimeTypes[ext] || 'text/plain'
}

// Helper to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString()
}

// Server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-game-data, x-saves-data')
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }
  
  // Data update endpoint (for browser to send localStorage data)
  if (url.pathname === '/api/update-data' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => body += chunk.toString())
    req.on('end', () => {
      try {
        const { gameData, savesData } = JSON.parse(body)
        const newDataHash = JSON.stringify({ gameData, savesData })
        
        if (newDataHash !== realTimeData.lastDataHash) {
          realTimeData = {
            gameData,
            savesData,
            lastUpdate: getCurrentTimestamp(),
            lastDataHash: newDataHash
          }
          console.log(`✅ Data refreshed successfully`)
        } else {
          console.log(`🔄 Data fetched - no changes detected`)
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, timestamp: realTimeData.lastUpdate }))
      } catch (error) {
        console.error('❌ Error updating data:', error)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON data' }))
      }
    })
    return
  }
  
  // API endpoint
  if (url.pathname === '/api/external') {
    const endpoint = url.searchParams.get('endpoint') || 'status'
    
    try {
      // Use real-time data if available, otherwise fall back to mock data
      const gameDataSource = realTimeData.gameData || fallbackGameData
      const savesDataSource = realTimeData.savesData || fallbackSavesData
      const isRealData = realTimeData.gameData !== null
      
      const gameData = readGameData(gameDataSource)
      const savesData = parseSavedGames(savesDataSource)
      const activeGameId = Object.keys(savesData)[0]
      const gameMetadata = savesData[activeGameId]
      
      let response
      
      switch (endpoint) {
        case 'status':
          response = {
            gameId: activeGameId,
            gameName: gameMetadata.name,
            gameVersion: gameMetadata.game,
            created: gameMetadata.created,
            updated: gameMetadata.updated,
            attempts: gameMetadata.attempts,
            team: extractTeamData(gameData),
            teamCount: (gameData.__team || []).length,
            boxCount: extractBoxData(gameData).length,
            deadCount: extractDeadData(gameData).length,
            starter: gameData.__starter || 'unknown',
            _meta: {
              dataSource: isRealData ? 'real' : 'mock',
              lastUpdate: realTimeData.lastUpdate
            }
          }
          break
          
        case 'team':
          response = {
            gameId: activeGameId,
            team: extractTeamData(gameData),
            _meta: {
              dataSource: isRealData ? 'real' : 'mock',
              lastUpdate: realTimeData.lastUpdate
            }
          }
          break
          
        case 'box':
          response = {
            gameId: activeGameId,
            box: extractBoxData(gameData),
            _meta: {
              dataSource: isRealData ? 'real' : 'mock',
              lastUpdate: realTimeData.lastUpdate
            }
          }
          break
          
        case 'dead':
          response = {
            gameId: activeGameId,
            dead: extractDeadData(gameData),
            _meta: {
              dataSource: isRealData ? 'real' : 'mock',
              lastUpdate: realTimeData.lastUpdate
            }
          }
          break
          
        case 'bosses':
          response = {
            gameId: activeGameId,
            bosses: extractBossTeams(gameData),
            _meta: {
              dataSource: isRealData ? 'real' : 'mock',
              lastUpdate: realTimeData.lastUpdate
            }
          }
          break
          
        case 'full':
          response = {
            gameId: activeGameId,
            gameName: gameMetadata.name,
            gameVersion: gameMetadata.game,
            created: gameMetadata.created,
            updated: gameMetadata.updated,
            attempts: gameMetadata.attempts,
            starter: gameData.__starter || 'unknown',
            team: extractTeamData(gameData),
            box: extractBoxData(gameData),
            dead: extractDeadData(gameData),
            bosses: extractBossTeams(gameData),
            stats: {
              teamCount: (gameData.__team || []).length,
              boxCount: extractBoxData(gameData).length,
              deadCount: extractDeadData(gameData).length,
              totalCaught: Object.values(gameData).filter(p => p.pokemon && [1, 2, 3, 6].includes(p.status)).length
            },
            _meta: {
              dataSource: isRealData ? 'real' : 'mock',
              lastUpdate: realTimeData.lastUpdate
            }
          }
          break
          
        default:
          response = {
            error: 'Invalid endpoint',
            availableEndpoints: ['status', 'team', 'box', 'dead', 'bosses', 'full']
          }
          res.writeHead(400)
      }
      
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(200)
      res.end(JSON.stringify(response, null, 2))
      
    } catch (error) {
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(500)
      res.end(JSON.stringify({ error: 'Internal server error', message: error.message }))
    }
    return
  }
  
  // Static file serving
  let filePath
  
  // Handle root path with a simple status page
  if (url.pathname === '/') {
    const statusPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuzlocke API Server</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .header { text-align: center; color: #333; }
        .status { background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .links { background: #f9f9f9; padding: 20px; border-radius: 8px; }
        .links a { display: block; margin: 10px 0; color: #0066cc; text-decoration: none; }
        .links a:hover { text-decoration: underline; }
        .api-status { color: ${realTimeData.gameData ? '#008000' : '#ff6600'}; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔥 Nuzlocke API Server</h1>
        <p>Real-time data server for streaming and external access</p>
    </div>
    
    <div class="status">
        <h2>Server Status</h2>
        <p><strong>Port:</strong> ${PORT}</p>
        <p><strong>Data Status:</strong> <span class="api-status">${realTimeData.gameData ? '✅ Real data connected' : '⚠️ Using mock data'}</span></p>
        <p><strong>Last Update:</strong> ${realTimeData.lastUpdate || 'Never'}</p>
    </div>
    
    <div class="links">
        <h2>Available Services</h2>
        <a href="/api/external?endpoint=status">📊 API Status</a>
        <a href="/api/external?endpoint=full">📋 Full Game Data</a>
        <a href="/examples/obs-overlay.html">🎥 OBS Overlay</a>
        <a href="/examples/obs-config.html">⚙️ Configuration Tool</a>
    </div>
    
    <div class="links">
        <h2>API Endpoints</h2>
        <a href="/api/external?endpoint=team">Team Data</a>
        <a href="/api/external?endpoint=box">Box Data</a>
        <a href="/api/external?endpoint=dead">Graveyard Data</a>
        <a href="/api/external?endpoint=bosses">Boss Data</a>
    </div>
</body>
</html>`
    
    res.setHeader('Content-Type', 'text/html')
    res.writeHead(200)
    res.end(statusPage)
    return
  }
  
  // Handle special routes
  if (url.pathname === '/examples/obs-overlay.html') {
    filePath = path.join(__dirname, 'static/examples/obs-overlay.html')
  } else if (url.pathname === '/examples/obs-config.html') {
    filePath = path.join(__dirname, 'static/examples/obs-config.html')
  } else {
    // Try to serve static files from various locations
    const possiblePaths = [
      path.join(__dirname, url.pathname),
      path.join(__dirname, 'static', url.pathname),
      path.join(__dirname, url.pathname.replace(/^\//, ''))
    ]
    
    filePath = possiblePaths.find(p => fs.existsSync(p))
  }
  
  // Check if file exists
  if (!filePath || !fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end(`
<!DOCTYPE html>
<html>
<head><title>404 - Not Found</title></head>
<body>
    <h1>404 - File Not Found</h1>
    <p>The requested file <code>${url.pathname}</code> was not found.</p>
    <p><a href="/">← Back to API Server Home</a></p>
</body>
</html>`)
    return
  }
  
  // Serve file
  const mimeType = getMimeType(filePath)
  res.setHeader('Content-Type', mimeType)
  
  const fileStream = fs.createReadStream(filePath)
  fileStream.pipe(res)
  
  fileStream.on('error', (error) => {
    res.writeHead(500)
    res.end('Error reading file')
  })
})

const PORT = 5174
server.listen(PORT, () => {
  console.log('🔥 Nuzlocke Real-Data Server running!')
  console.log(`📡 Server: http://localhost:${PORT}`)
  console.log(`🎮 Demo: http://localhost:${PORT}/real-data-demo.html`)
  console.log(`🎥 OBS Overlay: http://localhost:${PORT}/examples/obs-overlay.html`)
  console.log(`⚙️  Config Page: http://localhost:${PORT}/examples/obs-config.html`)
  console.log(`📊 API Status: http://localhost:${PORT}/api/external?endpoint=status`)
  console.log('')
  console.log('🔗 To connect to real Nuzlocke data:')
  console.log('1. Open your Nuzlocke tracker in another browser tab')
  console.log('2. Open browser console and run: NuzlockeAPI.sendToStandaloneServer()')
  console.log('3. Or use the data bridge in the demo page')
  console.log('')
  console.log('📈 Data Status:', realTimeData.gameData ? '✅ Real data connected' : '⚠️  Using mock data')
  console.log('🎬 Ready for streaming setup!')
}) 