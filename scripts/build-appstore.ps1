# App Store Build Scripts
# Automated build pipeline for iOS and Android app store deployment

# Variables
$PROJECT_ROOT = $PSScriptRoot + "\.."
$DIST_DIR = "$PROJECT_ROOT\dist"
$ASSETS_DIR = "$PROJECT_ROOT\assets"

Write-Host "🚀 WeeWoo Map Friend - App Store Build Pipeline" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

function Test-Prerequisites {
    Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js not found. Please install Node.js" -ForegroundColor Red
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ npm not found" -ForegroundColor Red
        exit 1
    }
    
    # Check if Capacitor CLI is installed
    try {
        $capVersion = npx cap --version
        Write-Host "✅ Capacitor CLI: $capVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Capacitor CLI not found" -ForegroundColor Red
        exit 1
    }
}

function Install-Dependencies {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    
    Set-Location $PROJECT_ROOT
    
    # Install npm dependencies
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install npm dependencies" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}

function Build-WebAssets {
    Write-Host "🔨 Building web assets..." -ForegroundColor Yellow
    
    # Create dist directory
    if (Test-Path $DIST_DIR) {
        Remove-Item $DIST_DIR -Recurse -Force
    }
    New-Item -ItemType Directory -Path $DIST_DIR | Out-Null
    
    # Copy web files to dist
    $excludePatterns = @("node_modules", "scripts", "*.md", ".git*", "dist", "android", "ios")
    
    Get-ChildItem $PROJECT_ROOT | Where-Object {
        $item = $_
        -not ($excludePatterns | Where-Object { $item.Name -like $_ })
    } | Copy-Item -Destination $DIST_DIR -Recurse -Force
    
    Write-Host "✅ Web assets built successfully" -ForegroundColor Green
}

function Generate-Icons {
    Write-Host "🎨 Generating app icons..." -ForegroundColor Yellow
    
    # Create assets directory if it doesn't exist
    if (-not (Test-Path $ASSETS_DIR)) {
        New-Item -ItemType Directory -Path $ASSETS_DIR | Out-Null
    }
    
    # Generate basic icon if it doesn't exist
    $iconPath = "$ASSETS_DIR\icon.png"
    if (-not (Test-Path $iconPath)) {
        # Create a basic 1024x1024 icon using PowerShell (placeholder)
        Write-Host "⚠️  No icon.png found in assets directory" -ForegroundColor Yellow
        Write-Host "   Please add a 1024x1024 PNG icon at: $iconPath" -ForegroundColor Yellow
        Write-Host "   Creating placeholder icon..." -ForegroundColor Yellow
        
        # Create placeholder icon directory structure
        $iconSizes = @(
            @{size=1024; name="icon.png"},
            @{size=512; name="icon-512.png"},
            @{size=192; name="icon-192.png"},
            @{size=144; name="icon-144.png"},
            @{size=96; name="icon-96.png"},
            @{size=72; name="icon-72.png"},
            @{size=48; name="icon-48.png"}
        )
        
        foreach ($icon in $iconSizes) {
            $iconFile = "$ASSETS_DIR\$($icon.name)"
            if (-not (Test-Path $iconFile)) {
                # Create empty file as placeholder
                New-Item -ItemType File -Path $iconFile | Out-Null
                Write-Host "   Created placeholder: $($icon.name)" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host "✅ App icons ready" -ForegroundColor Green
}

function Initialize-Capacitor {
    Write-Host "⚡ Initializing Capacitor..." -ForegroundColor Yellow
    
    Set-Location $PROJECT_ROOT
    
    # Initialize Capacitor if not already done
    if (-not (Test-Path "$PROJECT_ROOT\capacitor.config.ts")) {
        Write-Host "❌ capacitor.config.ts not found" -ForegroundColor Red
        exit 1
    }
    
    # Sync Capacitor
    npx cap sync
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to sync Capacitor" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Capacitor initialized successfully" -ForegroundColor Green
}

function Add-Platforms {
    Write-Host "📱 Adding native platforms..." -ForegroundColor Yellow
    
    Set-Location $PROJECT_ROOT
    
    # Add iOS platform
    if (-not (Test-Path "$PROJECT_ROOT\ios")) {
        Write-Host "   Adding iOS platform..." -ForegroundColor Gray
        npx cap add ios
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to add iOS platform" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   iOS platform already exists" -ForegroundColor Gray
    }
    
    # Add Android platform
    if (-not (Test-Path "$PROJECT_ROOT\android")) {
        Write-Host "   Adding Android platform..." -ForegroundColor Gray
        npx cap add android
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to add Android platform" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   Android platform already exists" -ForegroundColor Gray
    }
    
    Write-Host "✅ Native platforms ready" -ForegroundColor Green
}

function Open-IDEs {
    param(
        [string]$Platform = "both"
    )
    
    Write-Host "🛠️  Opening native IDEs..." -ForegroundColor Yellow
    
    Set-Location $PROJECT_ROOT
    
    if ($Platform -eq "ios" -or $Platform -eq "both") {
        Write-Host "   Opening Xcode for iOS..." -ForegroundColor Gray
        npx cap open ios
    }
    
    if ($Platform -eq "android" -or $Platform -eq "both") {
        Write-Host "   Opening Android Studio..." -ForegroundColor Gray
        npx cap open android
    }
    
    Write-Host "✅ IDEs opened" -ForegroundColor Green
}

function Show-NextSteps {
    Write-Host ""
    Write-Host "🎉 Build pipeline completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps for app store submission:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📱 iOS App Store:" -ForegroundColor Yellow
    Write-Host "   1. Open Xcode (should be open now)"
    Write-Host "   2. Configure signing & capabilities"
    Write-Host "   3. Set deployment target (iOS 13.0+)"
    Write-Host "   4. Archive and upload to App Store Connect"
    Write-Host "   5. Submit for review"
    Write-Host ""
    Write-Host "🤖 Google Play Store:" -ForegroundColor Yellow
    Write-Host "   1. Open Android Studio (should be open now)"
    Write-Host "   2. Generate signed APK/AAB"
    Write-Host "   3. Test on devices"
    Write-Host "   4. Upload to Google Play Console"
    Write-Host "   5. Submit for review"
    Write-Host ""
    Write-Host "📋 Required assets:" -ForegroundColor Yellow
    Write-Host "   • App icons (check assets/ directory)"
    Write-Host "   • Screenshots for both platforms"
    Write-Host "   • App descriptions and metadata"
    Write-Host "   • Privacy policy"
    Write-Host "   • Terms of service"
    Write-Host ""
    Write-Host "🔗 Useful commands:" -ForegroundColor Yellow
    Write-Host "   npm run build:app        - Run this build pipeline"
    Write-Host "   npm run sync             - Sync web changes to native"
    Write-Host "   npm run open:ios         - Open iOS project in Xcode"
    Write-Host "   npm run open:android     - Open Android project"
    Write-Host ""
}

# Main execution
function Start-AppStoreBuild {
    param(
        [switch]$SkipDeps,
        [switch]$SkipOpen,
        [string]$Platform = "both"
    )
    
    try {
        Test-Prerequisites
        
        if (-not $SkipDeps) {
            Install-Dependencies
        }
        
        Build-WebAssets
        Generate-Icons
        Initialize-Capacitor
        Add-Platforms
        
        if (-not $SkipOpen) {
            Open-IDEs -Platform $Platform
        }
        
        Show-NextSteps
        
    } catch {
        Write-Host ""
        Write-Host "❌ Build pipeline failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        exit 1
    }
}

# Export function for direct calling
if ($MyInvocation.InvocationName -ne '.') {
    Start-AppStoreBuild @args
}
