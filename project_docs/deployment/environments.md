# Environment Configuration

Detailed environment configuration for WeeWoo Map Friend, covering development, staging, production, and mobile deployment scenarios.

## 📋 **Table of Contents**

- [Development Environment](#development-environment)
- [Staging Environment](#staging-environment)
- [Production Environment](#production-environment)
- [Mobile Deployment](#mobile-deployment)
- [Environment Variables](#environment-variables)
- [Configuration Management](#configuration-management)

## 🖥️ **Development Environment**

### **Local Development Setup**

Development environment optimized for rapid iteration and debugging.

#### **System Requirements**
- **Operating System**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Python**: Python 3.8+ with pip
- **Node.js**: Node.js 16+ with npm
- **Git**: Git 2.20+ for version control
- **Browser**: Modern browser with developer tools

#### **Backend Setup**
```bash
# Create virtual environment
cd backend
python -m venv .venv

# Activate virtual environment
# Windows
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set development environment variables
export USE_MOCK=1
export WILLYWEATHER_API_KEY=dev_key_here
export ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
export CACHE_TTL_SECONDS=60
export REQUEST_TIMEOUT=10
export WEATHER_PROVIDER=mock

# Run development server
python app.py
```

#### **Frontend Setup**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production testing
npm run build

# Run tests
npm test
```

#### **Development Features**
- **Hot Reloading**: Automatic browser refresh on file changes
- **Mock Data**: Weather API uses mock data for development
- **Debug Logging**: Verbose logging for troubleshooting
- **CORS Relaxed**: Permissive CORS for local development
- **Cache Disabled**: Minimal caching for development iteration

---

## 🧪 **Staging Environment**

### **Pre-Production Testing**

Staging environment for testing production-like configurations and data.

#### **Environment Characteristics**
- **Purpose**: Pre-production testing and validation
- **Data**: Real API data with test credentials
- **Users**: Development team and stakeholders
- **Update Frequency**: Daily or on-demand updates

#### **Staging Configuration**
```bash
# Staging environment variables
export USE_MOCK=0
export WILLYWEATHER_API_KEY=staging_key_here
export ALLOWED_ORIGINS=https://staging.mapexp.com
export CACHE_TTL_SECONDS=300
export REQUEST_TIMEOUT=5
export WEATHER_PROVIDER=willyweather
export LOG_LEVEL=INFO
export DEBUG_MODE=false
```

#### **Staging Deployment**
```bash
# Deploy to staging
git checkout staging
git pull origin staging

# Backend deployment
cd backend
pip install -r requirements.txt
python app.py

# Frontend deployment
npm run build
# Deploy dist/ folder to staging web server
```

#### **Staging Validation**
- **API Testing**: Verify all endpoints with real data
- **Performance Testing**: Measure response times and load handling
- **Integration Testing**: Test third-party service integrations
- **User Acceptance Testing**: Stakeholder validation of features

---

## 🌐 **Production Environment**

### **Live Production Deployment**

Production environment for live user access with full monitoring and security.

#### **Production Requirements**
- **Uptime**: 99.9% availability target
- **Security**: HTTPS only, API key protection, CORS restrictions
- **Performance**: < 3 second page load, < 500ms API response
- **Monitoring**: Health checks, performance metrics, error tracking
- **Backup**: Automated backups with rollback capability

#### **Production Configuration**
```bash
# Production environment variables
export USE_MOCK=0
export WILLYWEATHER_API_KEY=production_key_here
export ALLOWED_ORIGINS=https://mapexp.com,https://www.mapexp.com
export CACHE_TTL_SECONDS=300
export REQUEST_TIMEOUT=5
export WEATHER_PROVIDER=willyweather
export LOG_LEVEL=WARNING
export DEBUG_MODE=false
export PRODUCTION=true
```

#### **Production Infrastructure**

##### **Web Server Configuration**
```nginx
# Nginx configuration for production
server {
    listen 80;
    server_name mapexp.com www.mapexp.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mapexp.com www.mapexp.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/mapexp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mapexp.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Static file serving
    location / {
        root /var/www/mapexp.com;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

##### **Backend Service Configuration**
```bash
# Systemd service configuration
[Unit]
Description=WeeWoo Map Friend Backend
After=network.target

[Service]
Type=simple
User=mapexp
WorkingDirectory=/opt/mapexp/backend
Environment=PATH=/opt/mapexp/backend/.venv/bin
ExecStart=/opt/mapexp/backend/.venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### **Production Monitoring**

##### **Health Checks**
```bash
# Health check endpoint
curl -f https://mapexp.com/health || exit 1

# API health check
curl -f https://mapexp.com/api/weather?lat=-37.8136&lon=144.9631&days=1 || exit 1
```

##### **Performance Monitoring**
- **Response Time**: Track API response times
- **Error Rates**: Monitor 4xx and 5xx error rates
- **Resource Usage**: CPU, memory, and disk usage
- **User Experience**: Page load times and map rendering performance

---

## 📱 **Mobile Deployment**

### **Capacitor Mobile Application**

Mobile deployment using Capacitor framework for cross-platform mobile apps.

#### **Mobile Environment Setup**

##### **Prerequisites**
- **Node.js**: Node.js 16+ with npm
- **Capacitor CLI**: `npm install -g @capacitor/cli`
- **Platform SDKs**: Xcode (iOS), Android Studio (Android)
- **Device Testing**: Physical devices for testing

##### **Capacitor Configuration**
```json
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mapexp.weewoo',
  appName: 'WeeWoo Map Friend',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#FF9900",
      showSpinner: true,
      spinnerColor: "#FFFFFF"
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#FF9900'
    }
  }
};

export default config;
```

#### **Platform-Specific Configuration**

##### **iOS Configuration**
```xml
<!-- ios/App/App/Info.plist -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>WeeWoo Map Friend needs location access to show nearby emergency services.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>WeeWoo Map Friend needs location access to show nearby emergency services.</string>

<key>UIBackgroundModes</key>
<array>
    <string>location</string>
    <string>background-processing</string>
</array>
```

##### **Android Configuration**
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme">
    
    <activity
        android:name="com.mapexp.weewoo.MainActivity"
        android:exported="true"
        android:launchMode="singleTask"
        android:theme="@style/AppTheme.NoActionBarLaunch">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
    </activity>
</application>
```

#### **Mobile Build Process**
```bash
# Build web application
npm run build

# Add mobile platforms
npx cap add ios
npx cap add android

# Copy web assets to mobile platforms
npx cap copy

# Open in native IDEs
npx cap open ios      # Opens Xcode
npx cap open android  # Opens Android Studio
```

#### **Mobile Testing**

##### **Device Testing Checklist**
- [ ] **iOS Devices**: iPhone 12+, iPad 8+ (iOS 12+)
- [ ] **Android Devices**: Samsung Galaxy S10+, Google Pixel 4+ (Android 6+)
- [ ] **Network Conditions**: WiFi, 4G, 3G, offline
- [ ] **Orientation**: Portrait and landscape modes
- [ ] **Accessibility**: VoiceOver (iOS), TalkBack (Android)

##### **Mobile-Specific Features**
- **Touch Gestures**: Pinch to zoom, pan, tap
- **Device Integration**: GPS location, camera, notifications
- **Offline Support**: Service worker caching
- **Performance**: Smooth 60fps scrolling and animations

---

## 🔧 **Environment Variables**

### **Core Configuration Variables**

| Variable | Development | Staging | Production | Description |
|----------|-------------|---------|------------|-------------|
| `USE_MOCK` | `1` | `0` | `0` | Use mock weather data |
| `WILLYWEATHER_API_KEY` | `dev_key` | `staging_key` | `prod_key` | Weather API key |
| `ALLOWED_ORIGINS` | `localhost` | `staging.mapexp.com` | `mapexp.com` | CORS allowed origins |
| `CACHE_TTL_SECONDS` | `60` | `300` | `300` | Cache time-to-live |
| `REQUEST_TIMEOUT` | `10` | `5` | `5` | API request timeout |
| `WEATHER_PROVIDER` | `mock` | `willyweather` | `willyweather` | Weather service provider |
| `LOG_LEVEL` | `DEBUG` | `INFO` | `WARNING` | Logging verbosity |
| `DEBUG_MODE` | `true` | `false` | `false` | Enable debug features |

### **Environment-Specific Overrides**

#### **Development Overrides**
```bash
# .env.development
USE_MOCK=1
LOG_LEVEL=DEBUG
DEBUG_MODE=true
CACHE_TTL_SECONDS=60
REQUEST_TIMEOUT=10
```

#### **Staging Overrides**
```bash
# .env.staging
USE_MOCK=0
LOG_LEVEL=INFO
DEBUG_MODE=false
CACHE_TTL_SECONDS=300
REQUEST_TIMEOUT=5
```

#### **Production Overrides**
```bash
# .env.production
USE_MOCK=0
LOG_LEVEL=WARNING
DEBUG_MODE=false
CACHE_TTL_SECONDS=300
REQUEST_TIMEOUT=5
PRODUCTION=true
```

---

## 📁 **Configuration Management**

### **Configuration File Structure**

```
mapexp.github.io/
├── .env.development      # Development environment variables
├── .env.staging         # Staging environment variables
├── .env.production      # Production environment variables
├── .env.local           # Local overrides (git ignored)
├── backend/
│   ├── config/
│   │   ├── development.py
│   │   ├── staging.py
│   │   └── production.py
│   └── app.py
├── frontend/
│   ├── .env.development
│   ├── .env.staging
│   └── .env.production
└── mobile/
    ├── ios/
    └── android/
```

### **Configuration Loading**

#### **Backend Configuration Loading**
```python
# backend/config/__init__.py
import os
from pathlib import Path

def load_config():
    env = os.getenv('FLASK_ENV', 'development')
    
    if env == 'production':
        from .production import ProductionConfig
        return ProductionConfig()
    elif env == 'staging':
        from .staging import StagingConfig
        return StagingConfig()
    else:
        from .development import DevelopmentConfig
        return DevelopmentConfig()

# backend/app.py
from config import load_config

app = Flask(__name__)
app.config.from_object(load_config())
```

#### **Frontend Configuration Loading**
```javascript
// frontend/config/environment.js
const getEnvironment = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'mapexp.com' || hostname === 'www.mapexp.com') {
    return 'production';
  } else if (hostname === 'staging.mapexp.com') {
    return 'staging';
  } else {
    return 'development';
  }
};

const config = {
  development: {
    apiBase: 'http://localhost:5000',
    useMock: true,
    debugMode: true
  },
  staging: {
    apiBase: 'https://staging.mapexp.com',
    useMock: false,
    debugMode: false
  },
  production: {
    apiBase: 'https://mapexp.com',
    useMock: false,
    debugMode: false
  }
};

export const getConfig = () => config[getEnvironment()];
```

---

## 🔗 **Related Documentation**

- **[Deployment Overview](README.md)**: General deployment information
- **[Deployment Procedures](procedures.md)**: Step-by-step deployment procedures
- **[Architecture Overview](../architecture/overview.md)**: System design patterns
- **[API Reference](../api/README.md)**: API endpoints and integration

---

**This environment configuration documentation provides comprehensive coverage of all deployment environments and configuration options for WeeWoo Map Friend.**

_Created: 2025-01-01_  
_Purpose: Environment configuration reference_  
_Maintenance: Update when environment configurations change_
