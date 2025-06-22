import { json } from '@sveltejs/kit'

/**
 * External API for Nuzlocke data access
 * Designed for streaming platforms and OBS integration
 * This API provides read-only access to Nuzlocke run data
 */

// Helper function to parse saved games from localStorage format
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

// Helper function to read game data
function readGameData(payload) {
  if (!payload) return {}
  try {
    return typeof payload === 'string' ? JSON.parse(payload) : {}
  } catch (e) {
    console.error('Error parsing game data:', e)
    return {}
  }
}

// Helper function to extract team data
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
}

// Helper function to extract box data
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

// Helper function to extract deceased Pokemon
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
      nickname: pokemon.nickname
    }))
}

// Helper function to extract boss teams
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

export async function GET({ url, request }) {
  // Enable CORS for external access
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }

  const searchParams = url.searchParams
  const gameId = searchParams.get('gameId')
  const endpoint = searchParams.get('endpoint') || 'status'

  // Get game data from request headers (would be passed by client)
  const gameDataHeader = request.headers.get('x-game-data')
  const savesDataHeader = request.headers.get('x-saves-data')

  if (!gameDataHeader || !savesDataHeader) {
    return json({
      error: 'Missing game data. Please provide x-game-data and x-saves-data headers.',
      help: 'These headers should contain the localStorage data for the active game.'
    }, { status: 400, headers })
  }

  try {
    const gameData = readGameData(gameDataHeader)
    const savesData = parseSavedGames(savesDataHeader)
    
    // If no specific gameId provided, use the first available game
    const activeGameId = gameId || Object.keys(savesData)[0]
    const gameMetadata = savesData[activeGameId]

    if (!gameMetadata) {
      return json({
        error: 'Game not found',
        availableGames: Object.keys(savesData)
      }, { status: 404, headers })
    }

    // Route to different endpoints
    switch (endpoint) {
      case 'status':
        return json({
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
          starter: gameData.__starter || 'unknown'
        }, { headers })

      case 'team':
        return json({
          gameId: activeGameId,
          team: extractTeamData(gameData)
        }, { headers })

      case 'box':
        return json({
          gameId: activeGameId,
          box: extractBoxData(gameData)
        }, { headers })

      case 'dead':
        return json({
          gameId: activeGameId,
          dead: extractDeadData(gameData)
        }, { headers })

      case 'bosses':
        return json({
          gameId: activeGameId,
          bosses: extractBossTeams(gameData)
        }, { headers })

      case 'full':
        return json({
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
          }
        }, { headers })

      default:
        return json({
          error: 'Invalid endpoint',
          availableEndpoints: ['status', 'team', 'box', 'dead', 'bosses', 'full']
        }, { status: 400, headers })
    }

  } catch (error) {
    console.error('External API error:', error)
    return json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500, headers })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-game-data, x-saves-data'
    }
  })
} 