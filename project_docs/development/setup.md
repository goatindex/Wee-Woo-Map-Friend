# Developer Setup Guide

## Overview

This guide provides comprehensive setup instructions for developers working on WeeWoo Map Friend. It covers local development, testing, code quality tools, and deployment workflows. The project operates on a modern ES6 module architecture with comprehensive state management and event-driven communication.

## Current System Architecture

### **Modern ES6 Architecture**

The project operates on a fully modern ES6 module architecture with comprehensive state management and event-driven communication:

#### **Core ES6 Module System**
- **ES6Bootstrap**: Central coordination of all modern modules
- **StateManager**: Modern state management with reactive updates
- **EventBus**: Event-driven communication system
- **MapManager**: Modern map initialization and management
- **LayerManager**: ES6-based layer management
- **ActiveListManager**: Modern active list handling
- **UIManager**: Modern UI coordination
- **CollapsibleManager**: Modern sidebar management

#### **Data Management Layer**
- **PolygonLoader**: Modern GeoJSON data loading and processing
- **AmbulanceLoader**: Ambulance station data management
- **PoliceLoader**: Police station data management
- **CfaFacilitiesLoader**: CFA facilities data management
- **SesFacilitiesLoader**: SES facilities data management
- **SesUnitsLoader**: SES units data management

#### **Utility & Support Layer**
- **ConfigurationManager**: Centralized configuration management
- **CoordinateConverter**: Modern coordinate conversion utilities
- **ErrorUI**: Advanced error handling and user feedback
- **TextFormatter**: Text formatting and normalization
- **FeatureEnhancer**: Feature enhancement and marker management
- **DeviceManager**: Device detection and platform optimization

#### **Development Benefits**
- **Modern Architecture**: Fully modern ES6 module system with clear separation of concerns
- **State Management**: Reactive state management with automatic UI updates
- **Event-Driven**: Modern event system for loose coupling between modules
- **Performance**: Optimized with modern JavaScript features and patterns
- **Maintainability**: Clear module boundaries and well-defined APIs
- **Testing**: Comprehensive testing framework for all ES6 modules

## Prerequisites

### Required Software

- **Python 3.8+** - For backend services and development scripts
- **Node.js 16+** - For build tools, testing, and screenshot generation
- **Modern Web Browser** - Chrome, Firefox, Safari, or Edge with developer tools
- **Git** - Version control system

### Optional Software

- **Xcode** - For iOS development and app store builds
- **Android Studio** - For Android development and app store builds
- **VS Code** - Recommended code editor with extensions

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/goatindex/mapexp.github.io.git
cd mapexp.github.io

# Install dependencies
npm install
```

### 2. Start Local Development

```bash
# Choose your preferred method:

# Option 1: Python HTTP server
python -m http.server 8000

# Option 2: Node.js serve
npx serve .

# Option 3: PHP server
php -S localhost:8000

# Option 4: Windows PowerShell script (recommended)
.\scripts\dev-up.ps1
```

### 3. Open in Browser

Navigate to `http://127.0.0.1:8000` in your browser.

## Working with the Modern ES6 Architecture

### **Understanding the Current Architecture**

The project now operates on a fully modern ES6 module architecture. Here's how to work with it:

#### **ES6 Module System**
- **State Management**: Use `StateManager` for all state needs with reactive updates
- **Event Communication**: Use `globalEventBus` for module communication
- **Map Operations**: Use `MapManager` for map-related functionality
- **UI Components**: Use `UIManager` and `CollapsibleManager` for UI work
- **Data Loading**: Use modern loaders like `PolygonLoader` for data management

#### **Module Integration**
- **Import/Export**: Use standard ES6 import/export syntax
- **Event-Driven**: Communicate between modules using the EventBus
- **State Management**: Access shared state through StateManager
- **Configuration**: Use ConfigurationManager for all configuration needs

### **Development Guidelines**

#### **For New Features**
1. **Create ES6 modules** following the established patterns
2. **Use StateManager** for state management needs
3. **Use EventBus** for module communication
4. **Follow component patterns** established in existing modules
5. **Add comprehensive tests** for new functionality

#### **For Bug Fixes**
1. **Identify the module** where the bug exists
2. **Fix in the ES6 module** system
3. **Test module integration** and state management
4. **Update tests** to prevent regression

#### **For Performance Work**
1. **Profile ES6 modules** to identify bottlenecks
2. **Optimize module performance** using modern JavaScript features
3. **Use StateManager** for efficient state updates
4. **Monitor module interactions** and event flow

## ES6 Module Development

### **Module Structure**

The project uses a modern ES6 module architecture alongside legacy systems:

```
js/modules/
├── ES6Bootstrap.js      # Central coordination
├── AppBootstrap.js      # Core application initialization
├── StateManager.js      # State management
├── UIManager.js         # UI coordination
├── CollapsibleManager.js # Sidebar management
├── SearchManager.js     # Search functionality
├── FABManager.js        # Floating action buttons
├── MapManager.js        # Map system management
├── LayerManager.js      # Layer management
├── PolygonLoader.js     # Data loading
├── CoordinateConverter.js # Coordinate conversion
├── ErrorUI.js           # Error handling
├── TextFormatter.js     # Text formatting
├── FeatureEnhancer.js   # Feature enhancements
└── DeviceManager.js     # Device management
```

### **Working with ES6 Modules**

#### **Adding New Modules**

```javascript
// Create a new module
export class MyNewModule {
  constructor() {
    this.isReady = false;
  }

  async init() {
    // Initialize module
    this.isReady = true;
  }

  getStatus() {
    return { isReady: this.isReady };
  }
}

// Export singleton instance
export const myNewModule = new MyNewModule();
```

#### **Integrating with ES6Bootstrap**

```javascript
// In ES6Bootstrap.js
import { myNewModule } from './MyNewModule.js';

// Add to initialization sequence
async initMyNewModule() {
  try {
    console.log('🎯 ES6Bootstrap: Initializing MyNewModule...');
    await myNewModule.init();
    console.log('✅ ES6Bootstrap: MyNewModule ready');
  } catch (error) {
    console.error('🚨 ES6Bootstrap: MyNewModule initialization failed:', error);
    throw error;
  }
}
```

#### **Event-Driven Communication**

```javascript
import { globalEventBus } from './globalEventBus.js';

// Emit events
globalEventBus.emit('mymodule:ready', { module: 'MyNewModule' });

// Listen for events
globalEventBus.on('state:updated', this.handleStateChange.bind(this));
```

## Development Scripts

### Core Development Commands

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start local development servers      |
| `npm run build`     | Build for production                 |
| `npm run build:app` | Full app store build pipeline        |
| `npm run sync`      | Sync web changes to native platforms |

### Native App Development

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev:ios`      | Live reload development for iOS     |
| `npm run dev:android`  | Live reload development for Android |
| `npm run open:ios`     | Open iOS project in Xcode           |
| `npm run open:android` | Open Android project in Studio      |

### Utility Commands

| Command           | Description                            |
| ----------------- | -------------------------------------- |
| `npm run capture` | Generate screenshots for documentation |
| `npm run icons`   | Generate app icons and assets          |

## Backend Setup (Optional)

### Weather API Backend

The weather features require a backend service for API key security and data processing.

#### 1. Create Virtual Environment

```powershell
# Windows PowerShell
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

#### 2. Install Dependencies

```bash
pip install -r backend/requirements.txt
```

#### 3. Configure Environment

```bash
# Copy example environment file
Copy-Item backend\.env.example backend\.env

# Edit backend\.env with your API keys
```

#### 4. Start Backend Service

```bash
python backend/app.py
```

### Environment Variables

Create `backend/.env` with the following configuration:

```bash
# Required for WillyWeather provider
WILLYWEATHER_API_KEY=your_api_key_here

# CORS configuration
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000

# Provider settings
USE_MOCK=1                    # Set to 0 for production
WEATHER_PROVIDER=mock         # mock, open-meteo, willyweather
CACHE_TTL_SECONDS=300
REQUEST_TIMEOUT=5
```

## Code Quality & Tools

### Linting and Formatting

```bash
# Install global tools (optional)
npm install -g eslint prettier

# Run linting
eslint js/**/*.js
prettier --check js/**/*.js

# Auto-fix formatting issues
prettier --write js/**/*.js
```

### Preflight Checks

The project includes automated preflight checks for common issues:

```bash
# Check for duplicate functions
python scripts/preflight_check_duplicates.py js

# Verify active collapsible functionality
python scripts/preflight_active_collapsible.py

# Test reset button functionality
python scripts/preflight_reset_button.py
```

### Testing

```bash
# Run automated tests (if available)
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Adding New Features

### 1. Adding New Data Categories

#### Step 1: Add GeoJSON File

Place your GeoJSON file in the project root or appropriate data directory.

#### Step 2: Update Configuration

Add category metadata to `ConfigurationManager`:

```javascript
// In ConfigurationManager.js
const newCategoryConfig = {
  type: 'polygon', // 'polygon' or 'point'
  nameProp: 'NAME_FIELD', // Property containing display name
  styleFn: newCategoryStyle, // Styling function
  defaultOn: () => false, // Default visibility
  listId: 'newCategoryList', // HTML list element ID
  toggleAllId: 'toggleAllNewCategory', // Toggle all button ID
};

configurationManager.set('categoryMeta.newcategory', newCategoryConfig);
```

#### Step 3: Add HTML Elements

Update `index.html` with the necessary UI elements:

```html
<div class="category-section" data-category="newcategory">
  <h3>New Category</h3>
  <div class="category-controls">
    <button id="toggleAllNewCategory">Toggle All</button>
    <input type="text" class="search-input" placeholder="Search..." />
  </div>
  <ul id="newCategoryList" class="feature-list"></ul>
</div>
```

#### Step 4: Create Data Loader

Create a modern ES6 loader in `js/modules/`:

```javascript
// js/modules/NewCategoryLoader.js
import { stateManager } from './StateManager.js';
import { globalEventBus } from './EventBus.js';

export class NewCategoryLoader {
  constructor() {
    this.isLoaded = false;
  }

  async loadCategory() {
    try {
      const response = await fetch('path/to/newcategory.geojson');
      const data = await response.json();

      // Process and display data
      stateManager.set('newCategoryData', data);
      
      // Emit event for UI updates
      globalEventBus.emit('newcategory:loaded', { data });
      
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load new category:', error);
      globalEventBus.emit('newcategory:error', { error });
    }
  }
}

export const newCategoryLoader = new NewCategoryLoader();
```

#### Step 5: Update State Management

Add the new category to `StateManager`:

```javascript
// In StateManager.js or during initialization
stateManager.set('layerNames.newcategory', new Map());
stateManager.set('layerEmphasis.newcategory', new Set());
stateManager.set('layerLabels.newcategory', new Set());
```

### 2. Creating New UI Components

#### Component Structure

All UI components should follow the modern ES6 module pattern:

```javascript
// js/modules/NewComponent.js
import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';

export class NewComponent {
  constructor(config) {
    this.config = config;
    this.isInitialized = false;
    this.init();
  }

  init() {
    // Component initialization
    this.setupEventListeners();
    this.render();
    this.isInitialized = true;
  }

  setupEventListeners() {
    // Event handling setup using EventBus
    globalEventBus.on('newcomponent:action', this.handleAction.bind(this));
  }

  render() {
    // Component rendering
  }

  destroy() {
    // Cleanup
    globalEventBus.off('newcomponent:action', this.handleAction.bind(this));
  }
}

export const newComponent = new NewComponent();
```

#### Registration

Register new components in `ES6Bootstrap.js`:

```javascript
// In ES6Bootstrap.js
import { newComponent } from './NewComponent.js';

// Add to initialization sequence
async initNewComponent() {
  try {
    console.log('🎯 ES6Bootstrap: Initializing NewComponent...');
    await newComponent.init();
    console.log('✅ ES6Bootstrap: NewComponent ready');
  } catch (error) {
    console.error('🚨 ES6Bootstrap: NewComponent initialization failed:', error);
    throw error;
  }
}
```

## Development Workflows

### 1. Feature Development

1. **Create Feature Branch**: `git checkout -b feature/new-feature`
2. **Implement Changes**: Follow coding standards and patterns
3. **Test Locally**: Ensure functionality works in development
4. **Run Preflight Checks**: Verify no regressions
5. **Commit Changes**: Use descriptive commit messages
6. **Push and Create PR**: Submit for review

### 2. Bug Fixes

1. **Reproduce Issue**: Confirm the bug exists
2. **Create Fix Branch**: `git checkout -b fix/bug-description`
3. **Implement Fix**: Address root cause, not symptoms
4. **Test Fix**: Verify issue is resolved
5. **Add Tests**: Prevent regression
6. **Submit PR**: Include issue reference

### 3. Code Review Process

1. **Self-Review**: Review your own changes before submission
2. **Peer Review**: At least one other developer must review
3. **Address Feedback**: Respond to review comments
4. **Final Approval**: Obtain approval before merge
5. **Merge and Deploy**: Follow deployment procedures

## Troubleshooting

### Common Issues

#### Development Server Won't Start

- **Port Conflict**: Try different port (e.g., `python -m http.server 8001`)
- **Permission Issues**: Ensure you have write access to the directory
- **Python Version**: Verify Python 3.8+ is installed and in PATH

#### Backend Connection Issues

- **CORS Errors**: Check `ALLOWED_ORIGINS` in backend `.env`
- **API Key Issues**: Verify API keys are correctly set
- **Port Mismatch**: Ensure frontend and backend ports match

#### Build Failures

- **Dependency Issues**: Run `npm install` to update dependencies
- **Node Version**: Ensure Node.js 16+ is installed
- **Platform Issues**: Some commands are platform-specific

### Getting Help

1. **Check Documentation**: Review this guide and related documentation
2. **Search Issues**: Look for similar issues in GitHub issues
3. **Console Errors**: Check browser console for JavaScript errors
4. **Network Tab**: Verify API calls and data loading
5. **Create Issue**: If problem persists, create detailed issue report

## Performance Considerations

### Development Best Practices

- **Lazy Loading**: Load data progressively, not all at once
- **Efficient Rendering**: Use canvas rendering for large datasets
- **Memory Management**: Clean up event listeners and references
- **Caching**: Implement appropriate caching strategies
- **Web Workers**: Use background processing for heavy calculations

### Monitoring

- **Browser DevTools**: Use Performance and Memory tabs
- **Console Logging**: Monitor for performance warnings
- **User Experience**: Test on various devices and connection speeds

## Security Guidelines

### Development Security

- **API Keys**: Never commit API keys to version control
- **Environment Variables**: Use `.env` files for sensitive configuration
- **Input Validation**: Validate all user inputs
- **Dependency Updates**: Regularly update dependencies for security patches
- **HTTPS**: Use HTTPS in production, localhost for development

### Security Checklist

- [x] **API Keys**: Secured in backend (no frontend exposure)
- [x] **PWA Security**: Service worker implements secure caching
- [ ] **CSP Headers**: Configure Content Security Policy
- [x] **HTTPS**: Required for PWA features
- [ ] **Input Validation**: Validate all user inputs
- [x] **Dependency Security**: Loaded from trusted sources
- [x] **Environment Variables**: Sensitive config via environment

## Related Documentation

- **[Architecture Overview](../architecture/overview.md)** - System architecture and design
- **[Development Workflows](workflows.md)** - Detailed development processes
- **[API Reference](../api/README.md)** - API documentation and examples
- **[Testing Framework](../templates/testing-template.md)** - Testing procedures and tools
- **[Deployment Guide](../deployment/README.md)** - Production deployment procedures

## Quick Reference

### Essential Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development
npm run build        # Build for production
npm run test         # Run tests
```

### File Locations

- **Source Code**: `js/` directory
- **Configuration**: `js/config.js`
- **Backend**: `backend/` directory
- **Scripts**: `scripts/` directory
- **Documentation**: `in_app_docs/` and `project_docs/` directories

### Development URLs

- **Frontend**: `http://127.0.0.1:8000`
- **Backend**: `http://127.0.0.1:5000` (if running)
- **Documentation**: `http://127.0.0.1:8000/in_app_docs/`

---

_This setup guide provides the foundation for development work. For specific implementation details, refer to the architecture documentation and code examples._
