/**
 * External API Bridge
 * Provides a way to expose Nuzlocke data to external applications
 * This runs in the browser and can be used by OBS browser sources, Twitch overlays, etc.
 */

// Storage keys from the main store
const IDS = {
  user: 'nuzlocke.user',
  theme: 'nuzlocke.theme',
  active: 'nuzlocke',
  saves: 'nuzlocke.saves',
  consent: 'nuzlocke.consent',
  support: 'nuzlocke.support',
  game: (id) => `nuzlocke.${id}`
}

/**
 * Extract current game data from localStorage
 */
export function getCurrentGameData() {
  if (typeof window === 'undefined') return null

  try {
    const activeGameId = localStorage.getItem(IDS.active)
    const savesData = localStorage.getItem(IDS.saves)
    const gameData = localStorage.getItem(IDS.game(activeGameId))

    if (!activeGameId || !savesData || !gameData) {
      return null
    }

    return {
      activeGameId,
      savesData,
      gameData,
      parsedGameData: JSON.parse(gameData)
    }
  } catch (error) {
    console.error('Error extracting game data:', error)
    return null
  }
}

/**
 * Send current game data to standalone server
 */
export async function sendToStandaloneServer(serverUrl = 'http://localhost:5174') {
  if (typeof window === 'undefined') {
    console.error('sendToStandaloneServer can only be used in browser environment')
    return false
  }

  try {
    const data = getCurrentGameData()
    if (!data) {
      console.error('No Nuzlocke data found. Make sure you have an active game.')
      return false
    }

    const response = await fetch(`${serverUrl}/api/update-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameData: data.gameData,
        savesData: data.savesData
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Data sent to standalone server successfully:', result)
      return true
    } else {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.error('❌ Failed to send data to standalone server:', error)
    return false
  }
}

/**
 * Set up automatic data synchronization with standalone server
 */
export function startStandaloneSync(serverUrl = 'http://localhost:5174', intervalMs = 2000) {
  if (typeof window === 'undefined') {
    console.error('startStandaloneSync can only be used in browser environment')
    return null
  }

  let lastDataHash = null
  
  const syncData = async () => {
    try {
      const data = getCurrentGameData()
      if (!data) return

      // Check if data has changed
      const currentDataHash = JSON.stringify({ gameData: data.gameData, savesData: data.savesData })
      if (currentDataHash === lastDataHash) return

      lastDataHash = currentDataHash
      await sendToStandaloneServer(serverUrl)
      console.log(`🔄 Data synced to standalone server at ${new Date().toLocaleTimeString()}`)
    } catch (error) {
      console.error('Sync error:', error)
    }
  }

  // Initial sync
  syncData()

  // Set up interval
  const intervalId = setInterval(syncData, intervalMs)

  // Store interval ID for status detection
  if (typeof window !== 'undefined' && window.NuzlockeAPI) {
    window.NuzlockeAPI._syncInterval = intervalId
  }

  console.log(`🔄 Started automatic sync to ${serverUrl} every ${intervalMs}ms`)
  console.log('To stop: clearInterval() with the returned ID')

  return intervalId
}

/**
 * Get formatted data for external consumption
 */
export function getExternalData(endpoint = 'full') {
  const data = getCurrentGameData()
  if (!data) return null

  const apiUrl = '/api/external'
  const searchParams = new URLSearchParams({
    endpoint,
    gameId: data.activeGameId
  })

  // Make a request to our external API
  return fetch(`${apiUrl}?${searchParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-game-data': data.gameData,
      'x-saves-data': data.savesData
    }
  }).then(response => response.json())
}

/**
 * Create a WebSocket-like event emitter for real-time updates
 */
export class NuzlockeDataEmitter extends EventTarget {
  constructor() {
    super()
    this.lastData = null
    this.pollInterval = null
    this.isPolling = false
  }

  startPolling(intervalMs = 1000) {
    if (this.isPolling) return

    this.isPolling = true
    this.pollInterval = setInterval(() => {
      this.checkForUpdates()
    }, intervalMs)

    // Also check immediately
    this.checkForUpdates()
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    this.isPolling = false
  }

  async checkForUpdates() {
    try {
      const currentData = await getExternalData('full')
      
      if (!currentData) return

      // Check if data has changed
      const dataString = JSON.stringify(currentData)
      if (dataString !== this.lastData) {
        this.lastData = dataString
        
        // Emit specific events
        this.dispatchEvent(new CustomEvent('dataUpdate', { detail: currentData }))
        this.dispatchEvent(new CustomEvent('teamUpdate', { detail: currentData.team }))
        this.dispatchEvent(new CustomEvent('statsUpdate', { detail: currentData.stats }))
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
      this.dispatchEvent(new CustomEvent('error', { detail: error }))
    }
  }

  // Get current data without polling
  async getCurrentData(endpoint = 'full') {
    return await getExternalData(endpoint)
  }
}

/**
 * Create a global instance that can be used by external scripts
 */
if (typeof window !== 'undefined') {
  window.NuzlockeAPI = {
    // Direct data access
    getCurrentGameData,
    getExternalData,
    
    // Standalone server integration
    sendToStandaloneServer,
    startStandaloneSync,
    
    // Event-based updates
    createEmitter: () => new NuzlockeDataEmitter(),
    
    // Convenience methods
    getTeam: () => getExternalData('team'),
    getBox: () => getExternalData('box'),
    getDead: () => getExternalData('dead'),
    getStatus: () => getExternalData('status'),
    getBosses: () => getExternalData('bosses'),
    getFull: () => getExternalData('full'),
    
    // Storage helpers
    getStorageKeys: () => IDS,
    
    // Debug helpers
    debug: {
      localStorage: () => {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('nuzlocke'))
        return keys.reduce((acc, key) => {
          acc[key] = localStorage.getItem(key)
          return acc
        }, {})
      },
      currentGame: () => getCurrentGameData(),
      formatSize: (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      },
      storageSize: () => {
        let total = 0
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key) && key.startsWith('nuzlocke')) {
            total += localStorage[key].length + key.length
          }
        }
        return window.NuzlockeAPI.debug.formatSize(total * 2) // *2 for UTF-16
      }
    }
  }

  // Auto-start emitter for convenience
  window.NuzlockeEmitter = new NuzlockeDataEmitter()
  
  console.log('🔥 Nuzlocke External API loaded!')
  console.log('Usage examples:')
  console.log('- await NuzlockeAPI.getTeam()')
  console.log('- await NuzlockeAPI.getFull()')
  console.log('- NuzlockeEmitter.startPolling(1000)')
  console.log('- NuzlockeEmitter.addEventListener("teamUpdate", (e) => console.log(e.detail))')
  console.log('')
  console.log('Standalone server integration:')
  console.log('- await NuzlockeAPI.sendToStandaloneServer()')
  console.log('- NuzlockeAPI.startStandaloneSync() // Auto-sync every 2 seconds')
} 