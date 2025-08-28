# Development Sync Script
# Quick sync for development iterations with native apps

param(
    [string]$Platform = "both",
    [switch]$Live,
    [switch]$Open
)

$PROJECT_ROOT = $PSScriptRoot + "\.."

Write-Host "🔄 WeeWoo Map Friend - Development Sync" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

function Sync-WebChanges {
    Write-Host "📦 Syncing web changes to native platforms..." -ForegroundColor Yellow
    
    Set-Location $PROJECT_ROOT
    
    # Sync Capacitor
    npx cap sync
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to sync Capacitor" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Web changes synced successfully" -ForegroundColor Green
}

function Start-LiveReload {
    Write-Host "🔥 Starting live reload server..." -ForegroundColor Yellow
    
    Set-Location $PROJECT_ROOT
    
    # Start local development server with live reload
    Start-Process -NoNewWindow -FilePath "npx" -ArgumentList @("cap", "run", $Platform.ToLower(), "--livereload")
    
    Write-Host "✅ Live reload started for $Platform" -ForegroundColor Green
}

function Open-Platform {
    param([string]$PlatformName)
    
    Write-Host "🛠️  Opening $PlatformName project..." -ForegroundColor Yellow
    
    Set-Location $PROJECT_ROOT
    
    npx cap open $PlatformName.ToLower()
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to open $PlatformName project" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ $PlatformName project opened" -ForegroundColor Green
}

# Main execution
try {
    if ($Live) {
        if ($Platform -eq "both") {
            Write-Host "⚠️  Live reload can only target one platform at a time" -ForegroundColor Yellow
            Write-Host "   Please specify -Platform ios or -Platform android" -ForegroundColor Yellow
            exit 1
        }
        Start-LiveReload
    } else {
        Sync-WebChanges
        
        if ($Open) {
            if ($Platform -eq "both") {
                Open-Platform "ios"
                Open-Platform "android"
            } else {
                Open-Platform $Platform
            }
        }
    }
    
    Write-Host ""
    Write-Host "🎉 Development sync completed!" -ForegroundColor Green
    Write-Host ""
    
    if ($Live) {
        Write-Host "📱 Live reload is running for $Platform" -ForegroundColor Cyan
        Write-Host "   Make changes to your web files and they'll sync automatically" -ForegroundColor Gray
        Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
    } else {
        Write-Host "🔗 Quick commands:" -ForegroundColor Cyan
        Write-Host "   npm run sync             - Sync web changes"
        Write-Host "   npm run dev:ios          - Live reload for iOS"
        Write-Host "   npm run dev:android      - Live reload for Android"
    }
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Development sync failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}
