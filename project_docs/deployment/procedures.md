# Deployment Procedures

Step-by-step deployment procedures for WeeWoo Map Friend, covering backend, frontend, data deployment, CI/CD, and operational procedures.

## 📋 **Table of Contents**

- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Data Deployment](#data-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Operations](#monitoring--operations)
- [Rollback Procedures](#rollback-procedures)
- [Maintenance Procedures](#maintenance-procedures)

## 🔧 **Backend Deployment**

### **Flask Application Deployment**

#### **Local Development Deployment**
```bash
# 1. Set up virtual environment
cd backend
python -m venv .venv

# 2. Activate virtual environment
# Windows
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
export USE_MOCK=1
export WILLYWEATHER_API_KEY=dev_key_here
export ALLOWED_ORIGINS=http://localhost:8000

# 5. Run development server
python app.py
```

#### **Production Server Deployment**
```bash
# 1. Clone repository to production server
git clone https://github.com/yourusername/mapexp.github.io.git
cd mapexp.github.io/backend

# 2. Set up Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Create systemd service file
sudo nano /etc/systemd/system/mapexp-backend.service

# 4. Start and enable service
sudo systemctl daemon-reload
sudo systemctl enable mapexp-backend
sudo systemctl start mapexp-backend

# 5. Check service status
sudo systemctl status mapexp-backend
```

#### **Docker Deployment**
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

```bash
# Build and run Docker container
docker build -t mapexp-backend .
docker run -d -p 5000:5000 --name mapexp-backend mapexp-backend

# With environment variables
docker run -d -p 5000:5000 \
  -e USE_MOCK=0 \
  -e WILLYWEATHER_API_KEY=prod_key \
  -e ALLOWED_ORIGINS=https://mapexp.com \
  --name mapexp-backend mapexp-backend
```

#### **Cloud Deployment (AWS Example)**
```bash
# 1. Create EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --key-name mapexp-key \
  --security-group-ids sg-12345678

# 2. Install dependencies
sudo apt update
sudo apt install python3 python3-pip nginx

# 3. Deploy application
git clone https://github.com/yourusername/mapexp.github.io.git
cd mapexp.github.io/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 4. Configure Nginx
sudo nano /etc/nginx/sites-available/mapexp
sudo ln -s /etc/nginx/sites-available/mapexp /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

## 🌐 **Frontend Deployment**

### **Static Asset Deployment**

#### **Local Development Server**
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production testing
npm run build

# 4. Preview production build
npm run preview
```

#### **Production Web Server Deployment**
```bash
# 1. Build production assets
npm run build

# 2. Deploy to web server
# Option A: Direct copy
sudo cp -r dist/* /var/www/mapexp.com/

# Option B: Git deployment
git checkout production
git pull origin production
npm run build
sudo cp -r dist/* /var/www/mapexp.com/

# 3. Set proper permissions
sudo chown -R www-data:www-data /var/www/mapexp.com
sudo chmod -R 755 /var/www/mapexp.com
```

#### **CDN Deployment (Cloudflare Example)**
```bash
# 1. Build production assets
npm run build

# 2. Upload to Cloudflare
# Use Cloudflare dashboard or API to upload dist/ folder

# 3. Configure caching rules
# Cache static assets for 1 year
# Cache HTML for 1 hour
# Cache API responses for 5 minutes
```

#### **GitHub Pages Deployment**
```bash
# 1. Configure GitHub Pages in repository settings
# Source: Deploy from a branch
# Branch: main
# Folder: / (root)

# 2. Build and commit
npm run build
git add dist/
git commit -m "Build for GitHub Pages"
git push origin main

# 3. GitHub Actions will automatically deploy
```

### **PWA Deployment Considerations**

#### **Service Worker Updates**
```javascript
// sw.js - Service Worker
const CACHE_NAME = 'mapexp-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

#### **Manifest Configuration**
```json
// manifest.json
{
  "name": "WeeWoo Map Friend",
  "short_name": "WeeWoo",
  "description": "Emergency services map for Victoria, Australia",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FF9900",
  "theme_color": "#FF9900",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 📊 **Data Deployment**

### **GeoJSON Data Deployment**

#### **Data Update Process**
```bash
# 1. Prepare new data files
# Update GeoJSON files in geojson/ directory

# 2. Validate data integrity
python scripts/validate_geojson.py

# 3. Deploy to production
# Option A: Direct file copy
sudo cp geojson/*.geojson /var/www/mapexp.com/geojson/

# Option B: Git-based deployment
git add geojson/
git commit -m "Update emergency services boundaries"
git push origin production

# 4. Clear cache if needed
# Clear CDN cache or service worker cache
```

#### **Data Versioning Strategy**
```bash
# Directory structure for versioned data
/var/www/mapexp.com/
├── geojson/
│   ├── current/          # Current data (symlink)
│   ├── v2025.01.01/     # Versioned data
│   ├── v2024.12.01/     # Previous version
│   └── backup/           # Backup directory
└── data-manifest.json    # Data version manifest
```

```json
// data-manifest.json
{
  "current_version": "v2025.01.01",
  "deployment_date": "2025-01-01T00:00:00Z",
  "data_sources": {
    "ses": {
      "version": "v2025.01.01",
      "last_updated": "2024-12-15",
      "source": "Victoria State Government"
    },
    "cfa": {
      "version": "v2025.01.01",
      "last_updated": "2024-12-20",
      "source": "Victoria State Government"
    }
  },
  "rollback_available": ["v2024.12.01"]
}
```

#### **Automated Data Deployment**
```bash
#!/bin/bash
# deploy-data.sh

set -e

DATA_VERSION=$1
if [ -z "$DATA_VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# 1. Validate data version exists
if [ ! -d "geojson/$DATA_VERSION" ]; then
    echo "Data version $DATA_VERSION not found"
    exit 1
fi

# 2. Create backup of current data
if [ -L "geojson/current" ]; then
    CURRENT_VERSION=$(readlink geojson/current | xargs basename)
    echo "Backing up current version: $CURRENT_VERSION"
    cp -r "geojson/$CURRENT_VERSION" "geojson/backup/$CURRENT_VERSION.$(date +%Y%m%d_%H%M%S)"
fi

# 3. Deploy new data
echo "Deploying data version: $DATA_VERSION"
rm -f geojson/current
ln -s "$DATA_VERSION" geojson/current

# 4. Update manifest
python scripts/update-manifest.py "$DATA_VERSION"

# 5. Clear cache
echo "Clearing cache..."
curl -X POST https://api.cloudflare.com/client/v4/zones/zone_id/purge_cache \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything": true}'

echo "Data deployment completed successfully"
```

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Workflow**

#### **Automated Testing & Deployment**
```yaml
# .github/workflows/deploy.yml
name: Deploy WeeWoo Map Friend

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install Python dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Run backend tests
      run: |
        cd backend
        python -m pytest tests/
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install Node.js dependencies
      run: npm ci
    
    - name: Run frontend tests
      run: npm test
    
    - name: Build frontend
      run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to staging
      run: |
        # Deploy to staging server
        echo "Deploying to staging..."
    
  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        # Deploy to production server
        echo "Deploying to production..."
```

#### **Automated Testing Pipeline**
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Run tests with coverage
      run: |
        cd backend
        python -m pytest tests/ --cov=. --cov-report=xml
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Build application
      run: npm run build
```

### **Deployment Automation Scripts**

#### **Backend Deployment Script**
```bash
#!/bin/bash
# deploy-backend.sh

set -e

ENVIRONMENT=$1
VERSION=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$VERSION" ]; then
    echo "Usage: $0 <environment> <version>"
    exit 1
fi

echo "Deploying backend version $VERSION to $ENVIRONMENT"

# 1. Pull latest code
git pull origin $ENVIRONMENT

# 2. Install dependencies
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Set environment variables
source ../.env.$ENVIRONMENT

# 4. Restart service
sudo systemctl restart mapexp-backend

# 5. Verify deployment
sleep 5
curl -f http://localhost:5000/health || exit 1

echo "Backend deployment completed successfully"
```

#### **Frontend Deployment Script**
```bash
#!/bin/bash
# deploy-frontend.sh

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <environment>"
    exit 1
fi

echo "Deploying frontend to $ENVIRONMENT"

# 1. Build application
npm run build

# 2. Deploy to web server
case $ENVIRONMENT in
  "staging")
    DEPLOY_PATH="/var/www/staging.mapexp.com"
    ;;
  "production")
    DEPLOY_PATH="/var/www/mapexp.com"
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

# 3. Deploy files
sudo rm -rf $DEPLOY_PATH/*
sudo cp -r dist/* $DEPLOY_PATH/

# 4. Set permissions
sudo chown -R www-data:www-data $DEPLOY_PATH
sudo chmod -R 755 $DEPLOY_PATH

# 5. Clear cache
if [ "$ENVIRONMENT" = "production" ]; then
    echo "Clearing production cache..."
    # Clear CDN cache
fi

echo "Frontend deployment completed successfully"
```

---

## 📊 **Monitoring & Operations**

### **Health Monitoring**

#### **Health Check Endpoints**
```bash
# Basic health check
curl -f https://mapexp.com/health

# Detailed health check
curl -f https://mapexp.com/health/detailed

# API health check
curl -f "https://mapexp.com/api/weather?lat=-37.8136&lon=144.9631&days=1"
```

#### **Monitoring Dashboard**
```javascript
// monitoring-dashboard.js
class MonitoringDashboard {
  constructor() {
    this.endpoints = [
      'https://mapexp.com/health',
      'https://mapexp.com/api/weather?lat=-37.8136&lon=144.9631&days=1'
    ];
    this.checkInterval = 30000; // 30 seconds
    this.startMonitoring();
  }
  
  async checkHealth(endpoint) {
    try {
      const start = Date.now();
      const response = await fetch(endpoint);
      const responseTime = Date.now() - start;
      
      return {
        endpoint,
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        endpoint,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async startMonitoring() {
    setInterval(async () => {
      const results = await Promise.all(
        this.endpoints.map(endpoint => this.checkHealth(endpoint))
      );
      
      this.updateDashboard(results);
    }, this.checkInterval);
  }
  
  updateDashboard(results) {
    // Update monitoring dashboard UI
    console.log('Health check results:', results);
  }
}
```

### **Performance Monitoring**

#### **Performance Metrics Collection**
```javascript
// performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: [],
      apiResponseTime: [],
      mapRenderingTime: [],
      errorRates: []
    };
    
    this.startMonitoring();
  }
  
  startMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.recordMetric('pageLoadTime', loadTime);
    });
    
    // Monitor API performance
    this.interceptAPI();
    
    // Monitor map rendering
    this.monitorMapRendering();
  }
  
  interceptAPI() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = Date.now();
      
      try {
        const response = await originalFetch(...args);
        const responseTime = Date.now() - start;
        
        if (args[0].includes('/api/')) {
          this.recordMetric('apiResponseTime', responseTime);
        }
        
        return response;
      } catch (error) {
        this.recordError(error);
        throw error;
      }
    };
  }
  
  recordMetric(type, value) {
    this.metrics[type].push({
      value,
      timestamp: Date.now()
    });
    
    // Keep only last 100 metrics
    if (this.metrics[type].length > 100) {
      this.metrics[type] = this.metrics[type].slice(-100);
    }
  }
  
  getMetrics() {
    return Object.keys(this.metrics).reduce((acc, key) => {
      const values = this.metrics[key].map(m => m.value);
      acc[key] = {
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
      return acc;
    }, {});
  }
}
```

---

## ⚠️ **Rollback Procedures**

### **Application Rollback**

#### **Backend Rollback**
```bash
#!/bin/bash
# rollback-backend.sh

set -e

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

echo "Rolling back backend to version $VERSION"

# 1. Checkout specific version
git checkout $VERSION

# 2. Install dependencies
cd backend
source .venv/bin/activate
pip install -r requirements.txt

# 3. Restart service
sudo systemctl restart mapexp-backend

# 4. Verify rollback
sleep 5
curl -f http://localhost:5000/health || exit 1

echo "Backend rollback completed successfully"
```

#### **Frontend Rollback**
```bash
#!/bin/bash
# rollback-frontend.sh

set -e

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

echo "Rolling back frontend to version $VERSION"

# 1. Checkout specific version
git checkout $VERSION

# 2. Build application
npm run build

# 3. Deploy rollback version
sudo rm -rf /var/www/mapexp.com/*
sudo cp -r dist/* /var/www/mapexp.com/

# 4. Set permissions
sudo chown -R www-data:www-data /var/www/mapexp.com
sudo chmod -R 755 /var/www/mapexp.com

echo "Frontend rollback completed successfully"
```

### **Data Rollback**

#### **GeoJSON Data Rollback**
```bash
#!/bin/bash
# rollback-data.sh

set -e

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

echo "Rolling back data to version $VERSION"

# 1. Verify version exists
if [ ! -d "geojson/$VERSION" ]; then
    echo "Data version $VERSION not found"
    exit 1
fi

# 2. Rollback data
rm -f geojson/current
ln -s "$VERSION" geojson/current

# 3. Update manifest
python scripts/update-manifest.py "$VERSION"

# 4. Clear cache
echo "Clearing cache..."
# Clear CDN and service worker cache

echo "Data rollback completed successfully"
```

---

## 🔧 **Maintenance Procedures**

### **Regular Maintenance Tasks**

#### **Daily Maintenance**
```bash
#!/bin/bash
# daily-maintenance.sh

echo "Starting daily maintenance..."

# 1. Check system health
curl -f https://mapexp.com/health || echo "Health check failed"

# 2. Check disk space
df -h | grep -E '^/dev/'

# 3. Check service status
sudo systemctl status mapexp-backend

# 4. Check log files for errors
sudo journalctl -u mapexp-backend --since "24 hours ago" | grep ERROR

echo "Daily maintenance completed"
```

#### **Weekly Maintenance**
```bash
#!/bin/bash
# weekly-maintenance.sh

echo "Starting weekly maintenance..."

# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Clean up old log files
sudo journalctl --vacuum-time=7d

# 3. Check SSL certificate expiration
openssl x509 -in /etc/letsencrypt/live/mapexp.com/cert.pem -noout -dates

# 4. Backup configuration files
tar -czf /backup/config-$(date +%Y%m%d).tar.gz /etc/nginx /etc/systemd/system/mapexp-backend.service

echo "Weekly maintenance completed"
```

#### **Monthly Maintenance**
```bash
#!/bin/bash
# monthly-maintenance.sh

echo "Starting monthly maintenance..."

# 1. Review and rotate logs
sudo logrotate /etc/logrotate.conf

# 2. Check for security updates
sudo apt list --upgradable

# 3. Review performance metrics
# Analyze performance data from monitoring

# 4. Update emergency services data
# Check for new GeoJSON data updates

echo "Monthly maintenance completed"
```

### **Emergency Procedures**

#### **Service Recovery**
```bash
#!/bin/bash
# emergency-recovery.sh

echo "Starting emergency recovery procedures..."

# 1. Check service status
if ! sudo systemctl is-active --quiet mapexp-backend; then
    echo "Backend service is down, attempting restart..."
    sudo systemctl restart mapexp-backend
    
    # Wait for service to start
    sleep 10
    
    # Verify service is running
    if sudo systemctl is-active --quiet mapexp-backend; then
        echo "Service recovered successfully"
    else
        echo "Service recovery failed, escalating..."
        # Send alert to operations team
    fi
fi

# 2. Check web server
if ! curl -f https://mapexp.com/health; then
    echo "Web server health check failed, checking Nginx..."
    sudo systemctl status nginx
    
    # Restart Nginx if needed
    sudo systemctl restart nginx
fi

echo "Emergency recovery procedures completed"
```

---

## 🔗 **Related Documentation**

- **[Deployment Overview](README.md)**: General deployment information
- **[Environment Configuration](environments.md)**: Environment-specific configurations
- **[Architecture Overview](../architecture/overview.md)**: System design patterns
- **[Performance Baselines](../performance/baselines.md)**: Performance metrics

---

**This deployment procedures documentation provides comprehensive coverage of all deployment processes, automation, monitoring, and operational procedures for WeeWoo Map Friend.**

_Created: 2025-01-01_  
_Purpose: Deployment procedures and operations guide_  
_Maintenance: Update when deployment procedures change_
