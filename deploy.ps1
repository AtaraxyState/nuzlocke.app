# Nuzlocke Tracker Portable Deployment Script
# This script creates a portable folder with everything needed to run the Nuzlocke tracker and streaming setup

param(
    [string]$OutputPath = ".\NuzlockeTracker-Portable",
    [switch]$Clean = $false
)

Write-Host "Nuzlocke Tracker Portable Deployment" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Yellow

# Clean existing deployment if requested
if ($Clean -and (Test-Path $OutputPath)) {
    Write-Host "Cleaning existing deployment..." -ForegroundColor Cyan
    Remove-Item -Path $OutputPath -Recurse -Force
}

# Create main deployment directory
Write-Host "Creating deployment directory..." -ForegroundColor Green
New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null

# Create subdirectories
$Directories = @(
    "app",
    "shortcuts",
    "docs"
)

foreach ($dir in $Directories) {
    New-Item -ItemType Directory -Path "$OutputPath\$dir" -Force | Out-Null
}

Write-Host "Copying application files..." -ForegroundColor Green

# Copy essential application files
$AppFiles = @(
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "svelte.config.js",
    "vite.config.js",
    "tailwind.config.cjs",
    "postcss.config.cjs",
    "jsconfig.json",
    "standalone-server.js"
)

foreach ($file in $AppFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination "$OutputPath\app\" -Force
        Write-Host "  [OK] $file" -ForegroundColor DarkGreen
    }
}

# Copy directories
$AppDirectories = @(
    "src",
    "static"
)

foreach ($dir in $AppDirectories) {
    if (Test-Path $dir) {
        Copy-Item -Path $dir -Destination "$OutputPath\app\" -Recurse -Force
        Write-Host "  [OK] $dir\" -ForegroundColor DarkGreen
    }
}

Write-Host "Creating startup scripts..." -ForegroundColor Green

# Create start-tracker.bat
$StartTrackerBat = @'
@echo off
title Nuzlocke Tracker - Main App
echo Starting Nuzlocke Tracker...
echo.
echo The tracker will be available at: http://localhost:5173
echo.
cd /d "%~dp0app"
npm run dev
pause
'@

$StartTrackerBat | Out-File -FilePath "$OutputPath\start-tracker.bat" -Encoding ascii
Write-Host "  [OK] start-tracker.bat" -ForegroundColor DarkGreen

# Create start-api.bat
$StartApiBat = @'
@echo off
title Nuzlocke API Server
echo Starting Nuzlocke API Server...
echo.
echo The API server will be available at: http://localhost:5174
echo OBS Overlay: http://localhost:5174/examples/obs-overlay.html
echo Config Tool: http://localhost:5174/examples/obs-config.html
echo.
cd /d "%~dp0app"
node standalone-server.js
pause
'@

$StartApiBat | Out-File -FilePath "$OutputPath\start-api.bat" -Encoding ascii
Write-Host "  [OK] start-api.bat" -ForegroundColor DarkGreen

# Create start-both.bat
$StartBothBat = @'
@echo off
title Nuzlocke Tracker - Launcher
echo Nuzlocke Tracker Launcher
echo ===========================
echo.
echo This will start both servers in separate windows:
echo 1. Main Tracker (http://localhost:5173)
echo 2. API Server (http://localhost:5174)
echo.
echo Press any key to continue...
pause >nul

echo Starting API Server...
start "Nuzlocke API Server" "%~dp0start-api.bat"

timeout /t 3 /nobreak >nul

echo Starting Main Tracker...
start "Nuzlocke Tracker" "%~dp0start-tracker.bat"

echo.
echo Both servers are starting!
echo.
echo Main Tracker: http://localhost:5173
echo API Server: http://localhost:5174
echo OBS Overlay: http://localhost:5174/examples/obs-overlay.html
echo Config Tool: http://localhost:5174/examples/obs-config.html
echo.
echo Press any key to exit launcher...
pause >nul
'@

$StartBothBat | Out-File -FilePath "$OutputPath\start-both.bat" -Encoding ascii
Write-Host "  [OK] start-both.bat" -ForegroundColor DarkGreen

# Create install-dependencies.bat
$InstallDepsBat = @'
@echo off
title Install Dependencies
echo Installing Nuzlocke Tracker Dependencies...
echo.
echo This will install all required Node.js packages.
echo Make sure you have Node.js installed on your system.
echo.
pause

cd /d "%~dp0app"
echo Installing dependencies with npm...
npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Dependencies installed successfully!
    echo You can now run the tracker using start-both.bat
) else (
    echo.
    echo Error installing dependencies!
    echo Make sure Node.js is installed and try again.
)

echo.
pause
'@

$InstallDepsBat | Out-File -FilePath "$OutputPath\install-dependencies.bat" -Encoding ascii
Write-Host "  [OK] install-dependencies.bat" -ForegroundColor DarkGreen

Write-Host "Creating browser shortcuts..." -ForegroundColor Green

# Create browser shortcuts
$ShortcutTargets = @{
    "Main Tracker" = "http://localhost:5173"
    "API Server" = "http://localhost:5174"
    "OBS Overlay" = "http://localhost:5174/examples/obs-overlay.html"
    "Config Tool" = "http://localhost:5174/examples/obs-config.html"
    "API Status" = "http://localhost:5174/api/external?endpoint=status"
}

foreach ($name in $ShortcutTargets.Keys) {
    $url = $ShortcutTargets[$name]
    $shortcutPath = "$OutputPath\shortcuts\$name.url"
    
    $shortcutContent = @"
[InternetShortcut]
URL=$url
IconFile=shell32.dll
IconIndex=14
"@
    
    $shortcutContent | Out-File -FilePath $shortcutPath -Encoding ascii
    Write-Host "  [OK] $name.url" -ForegroundColor DarkGreen
}

Write-Host "Creating documentation..." -ForegroundColor Green

# Create main README
$ReadmeContent = @"
# 🔥 Nuzlocke Tracker Portable Edition

Welcome to your portable Nuzlocke Tracker with streaming capabilities!

## 🚀 Quick Start (3 Easy Steps)

### Step 1: Install Dependencies
1. Make sure you have **Node.js** installed on your computer
   - Download from: https://nodejs.org/
   - Choose the LTS version (recommended)
2. Double-click **install-dependencies.bat**
3. Wait for installation to complete

### Step 2: Start the Servers
- Double-click **start-both.bat** to start everything at once
- OR start them individually:
  - **start-tracker.bat** - Main Nuzlocke tracker
  - **start-api.bat** - API server for streaming

### Step 3: Open the Tracker
- Use the shortcuts in the **shortcuts** folder
- OR open your browser and go to: http://localhost:5173

## 📱 Available Services

| Service | URL | Shortcut |
|---------|-----|----------|
| **Main Tracker** | http://localhost:5173 | shortcuts/Main Tracker.url |
| **API Server** | http://localhost:5174 | shortcuts/API Server.url |
| **OBS Overlay** | http://localhost:5174/examples/obs-overlay.html | shortcuts/OBS Overlay.url |
| **Config Tool** | http://localhost:5174/examples/obs-config.html | shortcuts/Config Tool.url |
| **API Status** | http://localhost:5174/api/external?endpoint=status | shortcuts/API Status.url |

## 🎥 Streaming Setup

### For OBS Studio:
1. Start both servers using **start-both.bat**
2. In OBS, add a **Browser Source**
3. Set URL to: `http://localhost:5174/examples/obs-overlay.html`
4. Set Width: 1920, Height: 1080
5. Use the **Config Tool** to customize appearance

### Auto-Sync:
- The tracker automatically syncs data to the overlay
- Look for the sync indicator in the top-right corner
- No manual refresh needed!

## 🛠️ Troubleshooting

### Servers won't start:
- Make sure Node.js is installed
- Run **install-dependencies.bat** first
- Check if ports 5173 and 5174 are available

### OBS overlay not updating:
- Ensure both servers are running
- Check that auto-sync is enabled (green indicator)
- Refresh the browser source in OBS

### Pokemon sprites not loading:
- Check your internet connection
- Sprites load from external servers
- Fallback sprites will be used if needed

## 📁 Folder Structure

```
NuzlockeTracker-Portable/
├── start-both.bat          # Start everything
├── start-tracker.bat       # Start main tracker only
├── start-api.bat          # Start API server only
├── install-dependencies.bat # Install Node.js packages
├── shortcuts/             # Browser shortcuts
│   ├── Main Tracker.url
│   ├── OBS Overlay.url
│   └── Config Tool.url
├── app/                   # Application files
│   ├── src/              # Source code
│   ├── static/           # Static assets
│   └── package.json      # Dependencies
└── docs/                 # Documentation
    └── README.txt        # This file
```

## 🎮 Using the Tracker

1. **Start a New Run**: Click "New Game" and select your Pokemon game
2. **Add Pokemon**: Click locations to add encountered Pokemon
3. **Manage Team**: Drag Pokemon to your active team
4. **Track Deaths**: Use the death button to record casualties
5. **View Stats**: Check your progress in the stats panel

## 🔧 Advanced Configuration

### Overlay Customization:
- Use the Config Tool for easy setup
- Supports multiple layouts: Grid, Horizontal, Vertical
- Toggle elements: Team, Stats, Graveyard, Game Info
- Real-time preview of changes

### API Endpoints:
- `/api/external?endpoint=full` - Complete data
- `/api/external?endpoint=team` - Current team
- `/api/external?endpoint=dead` - Graveyard
- `/api/external?endpoint=stats` - Statistics

## 💡 Tips

- Keep both servers running while streaming
- Use the Config Tool to customize your overlay
- The graveyard shows death causes when available
- Shiny Pokemon are highlighted with golden borders
- Auto-sync works automatically - no manual refresh needed

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Make sure Node.js is properly installed
3. Verify both servers are running
4. Check browser console for error messages

---

**Happy Nuzlocking!** 🔥⚔️

Made with ❤️ for the Nuzlocke community
"@

$ReadmeContent | Out-File -FilePath "$OutputPath\README.txt" -Encoding utf8
Write-Host "  [OK] README.txt" -ForegroundColor DarkGreen

# Create technical documentation
$TechDocsContent = @"
# Technical Documentation

## System Requirements
- Node.js 16+ (LTS recommended)
- Modern web browser (Chrome, Firefox, Edge)
- 100MB free disk space
- Internet connection (for Pokemon sprites)

## Port Usage
- 5173: Main Nuzlocke tracker application
- 5174: Standalone API server for streaming

## File Structure
- app/: Complete application source code
- app/standalone-server.js: API server for external access
- app/src/: SvelteKit application source
- app/static/: Static assets and overlay examples

## Development Mode
To run in development mode:
1. cd app
2. npm run dev

## Production Build
To create a production build:
1. cd app
2. npm run build
3. npm run preview

## API Endpoints
All endpoints support CORS and return JSON data:

- GET /api/external?endpoint=full
- GET /api/external?endpoint=team  
- GET /api/external?endpoint=box
- GET /api/external?endpoint=dead
- GET /api/external?endpoint=stats
- GET /api/external?endpoint=bosses
- POST /api/update-data (for real-time sync)

## Customization
- Modify app/static/examples/obs-overlay.html for overlay changes
- Use app/static/examples/obs-config.html for easy configuration
- Edit app/src/ files for application changes
"@

$TechDocsContent | Out-File -FilePath "$OutputPath\docs\TECHNICAL.txt" -Encoding utf8
Write-Host "  [OK] TECHNICAL.txt" -ForegroundColor DarkGreen

# Create version info
$VersionContent = @"
Nuzlocke Tracker Portable Edition
Version: 1.0.0
Build Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Platform: Windows PowerShell Deployment

Features:
- Real-time Pokemon tracking
- Streaming overlay support
- OBS integration
- Auto-sync functionality
- Customizable layouts
- Death cause tracking
- Multiple game support

Deployment Info:
- Created by: deploy.ps1
- Output Path: $OutputPath
- Source: $(Get-Location)
"@

$VersionContent | Out-File -FilePath "$OutputPath\VERSION.txt" -Encoding utf8
Write-Host "  [OK] VERSION.txt" -ForegroundColor DarkGreen

Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host ""
Write-Host "Portable folder created: $OutputPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Navigate to: $OutputPath" -ForegroundColor White
Write-Host "2. Run: install-dependencies.bat" -ForegroundColor White
Write-Host "3. Run: start-both.bat" -ForegroundColor White
Write-Host "4. Open: shortcuts/Main Tracker.url" -ForegroundColor White
Write-Host ""
Write-Host "For streaming:" -ForegroundColor Yellow
Write-Host "- OBS Browser Source: http://localhost:5174/examples/obs-overlay.html" -ForegroundColor White
Write-Host "- Configuration Tool: http://localhost:5174/examples/obs-config.html" -ForegroundColor White
Write-Host ""
Write-Host "Documentation available in README.txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy Nuzlocking!" -ForegroundColor Green 