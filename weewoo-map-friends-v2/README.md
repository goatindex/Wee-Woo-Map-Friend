# 🚨 WeeWoo Map Friends V2

> Emergency Services Mapping Tool for Australia

A modern, mobile-first mapping application designed for emergency services personnel to quickly plan routes, view service boundaries, and access critical operational information in the field.

## 🎯 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Git
- Modern web browser
- Docker (for GitHub MCP server)
- GitHub Personal Access Token (for MCP operations)

### Installation
```bash
# Clone the repository
git clone https://github.com/mapexp/weewoo-map-friends-v2.git
cd weewoo-map-friends-v2

# Install dependencies
npm install

# Set up MCP servers (optional but recommended)
# See docs/project/MCP_SETUP.md for detailed instructions

# Start development server
npm run dev:github
```

### MCP Server Setup
The project includes MCP (Model Context Protocol) servers for enhanced AI development capabilities:

- **GitHub MCP**: Repository management and deployment
- **Context7 MCP**: Library documentation and trust ratings  
- **Playwright MCP**: Browser testing automation

See [MCP Setup Guide](docs/project/MCP_SETUP.md) for detailed configuration instructions.

## 📜 Available Scripts

### Development
- `npm run dev` - Start development server (default)
- `npm run dev:github` - Start GitHub.io development mode
- `npm run dev:webapp` - Start web app development mode
- `npm run dev:native` - Start native app development mode

### Building
- `npm run build` - Build for production (default)
- `npm run build:github` - Build for GitHub.io deployment
- `npm run build:webapp` - Build for web app deployment
- `npm run build:native` - Build for native app deployment
- `npm run build:all` - Build all platforms

### Preview
- `npm run preview` - Preview production build
- `npm run preview:github` - Preview GitHub.io build
- `npm run preview:webapp` - Preview web app build
- `npm run preview:native` - Preview native app build

### Testing
- `npm run test` - Run unit tests
- `npm run test:unit` - Run unit tests with Vitest
- `npm run test:unit:coverage` - Run unit tests with coverage
- `npm run test:unit:ui` - Run unit tests with UI
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:e2e:github` - Test GitHub.io deployment
- `npm run test:e2e:webapp` - Test web app deployment
- `npm run test:e2e:native` - Test native app deployment
- `npm run test:critical-path` - Test critical emergency functionality
- `npm run test:offline` - Test offline capabilities
- `npm run test:performance` - Test performance requirements

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run security:check` - Run security audit
- `npm run license:check` - Check license compatibility
- `npm run complexity:check` - Check code complexity

### Deployment
- `npm run deploy:github` - Deploy to GitHub Pages
- `npm run deploy:webapp` - Deploy web app to Vercel/Netlify
- `npm run deploy:native` - Prepare native app for app stores
- `npm run deploy:all` - Deploy all platforms

## 📱 Features

### Core Functionality
- **Interactive Maps** - Emergency service boundaries and facilities
- **Route Planning** - Navigation between locations with vehicle-level accuracy
- **Weather Integration** - Real-time weather data via Willy Weather API
- **Alert Feeds** - Emergency Management Victoria alerts
- **Export Capabilities** - PDF and image downloads for offline use

### Mobile-First Design
- Responsive interface optimized for tablets and phones
- Touch-friendly controls and gestures
- Offline-capable through export functionality
- Fast loading (< 3 seconds)

## 🏗️ Architecture

### Multi-Platform Strategy

The application supports three deployment targets with progressive enhancement:

1. **GitHub.io (Phase 1)** - Static frontend deployment (~250KB)
2. **Web App (Phase 2)** - Full web application with backend (~400KB)  
3. **Native Apps (Phase 3)** - iOS/Android mobile applications (~600KB)

### Technology Stack

| Component | Technology | Version | Bundle Size | Trust Score | Platforms |
|-----------|------------|---------|-------------|-------------|-----------|
| **Runtime** | Vanilla JavaScript ES6+ | ES2020 | 0kb | N/A | All |
| **Build Tool** | Vite | ^5.0.0 | ~2mb | 8.3 | All |
| **Compiler** | SWC | ^1.3.0 | ~1mb | 9.1 | All |
| **State Management** | Zustand | ^4.4.7 | 2.9kb | 9.6 | All |
| **Module System** | ES6 Modules | Native | 0kb | N/A | All |
| **Dependency Management** | Direct Imports | Native | 0kb | N/A | All |
| **Mapping** | Leaflet.js | ^1.9.4 | ~40kb | 8.5 | All |
| **Spatial Analysis** | Turf.js | ^6.5.0 | ~45kb | 8.0 | All |
| **HTTP Client** | Axios | ^1.6.0 | ~13kb | 9.0 | All |
| **PWA** | Vite PWA Plugin | ^0.17.0 | ~5kb | 8.0 | GitHub.io, Web App |
| **Native Framework** | Capacitor | ^5.4.0 | ~100kb | 9.0 | Native Apps |

**Bundle Sizes by Platform**:
- **GitHub.io**: ~250KB (core functionality)
- **Web App**: ~400KB (enhanced features)
- **Native Apps**: ~600KB (native capabilities)

### Project Structure

```
src/
├── components/           # UI components
│   ├── Map/             # Map-related components
│   ├── Sidebar/         # Sidebar components
│   ├── Weather/         # Weather display components
│   └── Alerts/          # Alert display components
├── services/            # API services
│   ├── BaseService.js   # Base service class
│   ├── WeatherService.js # Weather API service
│   ├── AlertService.js  # Alert API service
│   └── index.js         # Service exports
├── stores/              # Zustand stores
│   ├── mapStore.js      # Map state management
│   ├── weatherStore.js  # Weather state management
│   └── index.js         # Store exports
├── managers/            # Business logic managers
│   ├── MapManager.js    # Map management logic
│   ├── LayerManager.js  # Layer management logic
│   └── RouteManager.js  # Route management logic
├── utils/               # Utility functions
│   ├── Logger.js        # Logging utility
│   ├── Config.js        # Configuration utility
│   ├── Storage.js       # Storage utility
│   └── Validators.js    # Validation utility
├── types/               # TypeScript type definitions
│   └── index.js         # Type exports
├── assets/              # Static assets
│   ├── images/          # Image assets
│   ├── data/            # GeoJSON data files
│   └── icons/           # Icon assets
└── main.js              # Application entry point

tests/
├── unit/                # Unit tests (Vitest)
├── integration/         # Integration tests
└── e2e/                 # End-to-end tests (Playwright)
```

### Key Architectural Patterns

- **Direct ES6 Module Imports**: Eliminates circular dependencies
- **Zustand State Management**: Lightweight, performant state management
- **Service Layer Pattern**: Centralized API management with error handling
- **Manager Pattern**: Business logic separation
- **PWA Architecture**: Offline capabilities for emergency use

## 🚀 Deployment

### Multi-Platform Deployment Strategy

#### **Phase 1: GitHub.io (Immediate Priority)**
- **Target**: Static frontend deployment
- **Hosting**: GitHub Pages (free)
- **Features**: Core mapping, offline capability, export functionality
- **Bundle Size**: ~250KB
- **Timeline**: Week 1-2

#### **Phase 2: Web App (Second Priority)**
- **Target**: Full web application with backend
- **Hosting**: Vercel/Netlify (cloud hosting)
- **Features**: Real-time data, weather APIs, advanced functionality
- **Bundle Size**: ~400KB
- **Timeline**: Week 3-4

#### **Phase 3: Native Apps (Future)**
- **Target**: iOS/Android mobile applications
- **Distribution**: App stores
- **Features**: Native APIs, push notifications, app store distribution
- **Bundle Size**: ~600KB
- **Timeline**: Week 5-6+

### Deployment Commands
```bash
# Deploy to GitHub.io
npm run deploy:github

# Deploy web app
npm run deploy:webapp

# Deploy native apps
npm run deploy:native

# Deploy all platforms
npm run deploy:all
```

## 📚 Documentation

### User Documentation
- [User Guide](docs/user/README.md) - How to use the application
- [API Documentation](docs/api/README.md) - API endpoints and integrations

### Project Documentation
- [Architecture Decisions](docs/project/ARCHITECTURE_DECISIONS.md) - Key architectural choices
- [Library Selection](docs/project/LIBRARY_SELECTION.md) - Technology stack and justifications
- [Testing Strategy](docs/project/TESTING_STRATEGY.md) - Testing approach and implementation
- [Build Pipeline](docs/project/BUILD_PIPELINE_STRATEGY.md) - CI/CD and deployment pipeline
- [MCP Setup](docs/project/MCP_SETUP.md) - Model Context Protocol configuration
- [Implementation Guide](docs/project/IMPLEMENTATION_GUIDE.md) - Development roadmap

### Development Resources
- [Development Guide](docs/project/DEVELOPMENT.md) - Contributing and development
- [Deployment Guide](docs/deployment/README.md) - Production deployment

## 🔧 Configuration

Environment variables:
- `WILLYWEATHER_API_KEY` - Weather API key
- `EMV_API_KEY` - Emergency Management Victoria API key
- `MAPBOX_TOKEN` - Map tiles and routing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Check the [documentation](docs/)
- Review the [troubleshooting guide](docs/user/TROUBLESHOOTING.md)

---

**Version:** 2.0.0  
**Last Updated:** December 2025
