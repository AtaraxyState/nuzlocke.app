<script>
  import { onMount } from 'svelte'
  
  let syncStatus = 'disconnected'
  let lastSync = null
  let syncInterval = null
  let activityLog = []
  let showLog = false
  let lastDataHash = null
  
  onMount(() => {
    // Check if auto-sync is running
    checkSyncStatus()
    
    // Update status every 5 seconds
    const statusInterval = setInterval(checkSyncStatus, 5000)
    
    // Override console.log to capture sync messages
    const originalConsoleLog = console.log
    console.log = (...args) => {
      const message = args.join(' ')
      
      // Capture sync-related messages
      if (message.includes('🔄 Data synced') || message.includes('✅ Data refreshed') || message.includes('🔄 Data fetched')) {
        addLogEntry(message, 'success')
      } else if (message.includes('🔍 Fetching') || message.includes('🔄 Auto-starting')) {
        addLogEntry(message, 'info')
      } else if (message.includes('❌') || message.includes('Error')) {
        addLogEntry(message, 'error')
      }
      
      // Call original console.log
      originalConsoleLog.apply(console, args)
    }
    
    return () => {
      if (statusInterval) clearInterval(statusInterval)
      console.log = originalConsoleLog
    }
  })
  
  function addLogEntry(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    const entry = { timestamp, message, type }
    
    // Only add if it's different from the last message (avoid spam)
    if (activityLog.length === 0 || activityLog[activityLog.length - 1].message !== message) {
      activityLog = [...activityLog.slice(-9), entry] // Keep last 10 entries
    }
  }
  
  function checkSyncStatus() {
    if (typeof window !== 'undefined' && window.NuzlockeAPI) {
      // Check if we have game data (sync is possible)
      const gameData = window.NuzlockeAPI.getCurrentGameData()
      if (gameData) {
        // Check if data has changed
        const currentDataHash = JSON.stringify(gameData)
        const dataChanged = currentDataHash !== lastDataHash
        
        if (dataChanged && lastDataHash !== null) {
          addLogEntry('✅ Data refreshed successfully', 'success')
        } else if (lastDataHash !== null) {
          addLogEntry('🔄 Data fetched - no changes detected', 'fetch')
        }
        
        lastDataHash = currentDataHash
        syncStatus = 'connected'
        
        // Try to detect if sync is running by checking console logs
        // This is a simple approach - in production you'd want a more robust method
        if (window.NuzlockeAPI._syncInterval) {
          syncStatus = 'syncing'
          lastSync = new Date().toLocaleTimeString()
        }
      } else {
        syncStatus = 'no-data'
      }
    } else {
      syncStatus = 'disconnected'
    }
  }
  
  function startSync() {
    if (window.NuzlockeAPI) {
      syncInterval = window.NuzlockeAPI.startStandaloneSync()
      if (syncInterval) {
        syncStatus = 'syncing'
        addLogEntry('🔄 Manual sync started', 'info')
      }
    }
  }
  
  function stopSync() {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
      syncStatus = 'connected'
      addLogEntry('⏹️ Sync stopped', 'info')
    }
  }
  
  function toggleLog() {
    showLog = !showLog
  }
  
  function clearLog() {
    activityLog = []
  }
</script>

<div class="sync-indicator" class:connected={syncStatus === 'connected'} class:syncing={syncStatus === 'syncing'} class:disconnected={syncStatus === 'disconnected'}>
  <div class="status-dot"></div>
  <div class="status-text">
    {#if syncStatus === 'syncing'}
      <span>🔄 Auto-Sync Active</span>
      <button on:click={stopSync} class="sync-button">Stop</button>
    {:else if syncStatus === 'connected'}
      <span>📡 Ready to Sync</span>
      <button on:click={startSync} class="sync-button">Start</button>
    {:else if syncStatus === 'no-data'}
      <span>⚠️ No Game Data</span>
    {:else}
      <span>🔌 API Disconnected</span>
    {/if}
  </div>
  {#if lastSync}
    <div class="last-sync">Last: {lastSync}</div>
  {/if}
  <button on:click={toggleLog} class="log-toggle" title="Toggle Activity Log">
    📋
  </button>
</div>

{#if showLog}
  <div class="activity-log">
    <div class="log-header">
      <span>📈 Activity Log</span>
      <button on:click={clearLog} class="clear-button">Clear</button>
    </div>
    <div class="log-content">
      {#each activityLog as entry}
        <div class="log-entry log-{entry.type}">
          <span class="log-time">[{entry.timestamp}]</span>
          <span class="log-message">{entry.message}</span>
        </div>
      {:else}
        <div class="log-entry log-info">
          <span class="log-message">No activity yet...</span>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .sync-indicator {
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #666;
  }
  
  .syncing .status-dot {
    background: #4ade80;
    animation: pulse 1.5s infinite;
  }
  
  .connected .status-dot {
    background: #fbbf24;
  }
  
  .disconnected .status-dot {
    background: #ef4444;
  }
  
  .status-text {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .sync-button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .sync-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .last-sync {
    font-size: 10px;
    opacity: 0.7;
  }
  
  .log-toggle {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 10px;
    cursor: pointer;
    transition: background 0.2s;
    margin-left: 6px;
  }
  
  .log-toggle:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .activity-log {
    position: fixed;
    top: 60px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    border-radius: 8px;
    width: 350px;
    max-height: 300px;
    z-index: 999;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 12px;
    font-weight: bold;
  }
  
  .clear-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .clear-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .log-content {
    max-height: 250px;
    overflow-y: auto;
    padding: 8px;
  }
  
  .log-entry {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 4px;
    font-size: 11px;
    line-height: 1.3;
  }
  
  .log-time {
    color: #888;
    font-family: monospace;
    flex-shrink: 0;
  }
  
  .log-message {
    flex: 1;
  }
  
  .log-success .log-message {
    color: #22c55e;
  }
  
  .log-error .log-message {
    color: #ef4444;
  }
  
  .log-info .log-message {
    color: #3b82f6;
  }
  
  .log-fetch .log-message {
    color: #fbbf24;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @media (max-width: 768px) {
    .sync-indicator {
      position: relative;
      top: auto;
      right: auto;
      margin: 10px;
    }
    
    .activity-log {
      position: fixed;
      top: 70px;
      left: 10px;
      right: 10px;
      width: auto;
    }
  }
</style> 