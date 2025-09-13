# Build Automation Guide

## Overview

This project uses a comprehensive build automation system that handles both local development and GitHub Pages deployment. The system compiles TypeScript decorators and ES6 modules into browser-compatible JavaScript using SWC while preserving the sophisticated InversifyJS dependency injection architecture.

## Build System Architecture

### **Core Components**

1. **SWC Compilation**: Transforms TypeScript decorators and ES6 modules
2. **Path Stripping**: Uses `--strip-leading-paths` to prevent nested directory issues
3. **Watch Mode**: Auto-rebuilds on file changes during development
4. **GitHub Actions**: Automated build and deployment on commits
5. **Static File Management**: Copies and optimizes assets for GitHub Pages

### **Build Process Flow**

```
Source Code (js/modules/) 
    ↓
SWC Compilation (decorators + ES6 + path stripping)
    ↓
Compiled JavaScript (dist/modules/)
    ↓
Static File Copy (HTML, CSS, GeoJSON, etc.)
    ↓
GitHub Pages Deployment
```

## Local Development

### **Quick Start**

```bash
# Install dependencies
npm install

# Start development server with auto-rebuild
npm run dev

# OR simple development (no auto-rebuild)
npm run dev:simple
```

### **Development Commands**

| Command | Description |
|---------|-------------|
| `npm run dev` | Full development with auto-rebuild and server |
| `npm run dev:simple` | Simple development server (no auto-rebuild) |
| `npm run build:js` | Compile JavaScript modules once |
| `npm run watch:js` | Watch and auto-rebuild JavaScript modules |
| `npm run serve:dev` | Start Python development server |
| `npm run serve:dist` | Serve compiled files from dist/ |

### **Development Workflow**

1. **Start Development**:
   ```bash
   npm run dev
   ```
   This starts:
   - SWC watch process (auto-rebuilds on changes)
   - Python development server on port 8000
   - Browser auto-refresh on file changes

2. **Edit Code**:
   - Modify files in `js/modules/`
   - SWC automatically compiles changes
   - Browser refreshes with new code

3. **Test Changes**:
   - Open http://localhost:8000
   - Check browser console for errors
   - Run tests: `npm run test`

## GitHub Pages Deployment

### **Automatic Deployment**

The project automatically deploys to GitHub Pages on every commit to the `main` branch using GitHub Actions:

1. **GitHub Actions Workflow** (`.github/workflows/build-and-deploy.yml`):
   - Triggers on push to `main` branch
   - Installs Node.js and dependencies
   - Compiles JavaScript modules
   - Runs tests
   - Builds static files for GitHub Pages
   - Deploys to GitHub Pages automatically

2. **Build Process**:
   ```bash
   # Automated in GitHub Actions
   npm ci
   npm run build:js
   npm run test
   node scripts/build-for-github-pages.js
   # Deploy to GitHub Pages
   ```

### **Deployment Workflow**

```bash
# 1. Make changes to source code
# Edit files in js/modules/

# 2. Test locally
npm run dev
# Open http://localhost:8000

# 3. Commit and push
git add .
git commit -m "Update application"
git push origin main

# 4. GitHub Actions automatically:
# - Builds the project
# - Runs tests
# - Deploys to GitHub Pages
# - Your site is live!
```

### **No Manual Build Required**

- **Source code** stays in `main` branch
- **Build output** is handled by GitHub Actions
- **GitHub Pages** serves the compiled site
- **Clean Git history** - no build files in repository

## Build Configuration

### **SWC Configuration** (`.swcrc`)

```json
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true
    },
    "transform": {
      "decoratorMetadata": true,
      "legacyDecorator": true
    },
    "target": "es2020"
  },
  "env": {
    "targets": "last 2 versions"
  }
}
```

### **Package.json Scripts**

```json
{
  "scripts": {
    "dev": "npm run build:js && concurrently \"npm run watch:js\" \"npm run serve:dev\"",
    "build:js": "swc js/modules --out-dir dist --strip-leading-paths --source-maps",
    "watch:js": "swc js/modules --out-dir dist --strip-leading-paths --watch --source-maps",
    "build": "npm run build:js && npm run build:web && npm run build:native"
  }
}
```

## File Structure

### **Source Files**
```
js/modules/           # Source ES6 modules with decorators
├── main.js          # Application entry point
├── DependencyContainer.js  # InversifyJS container
├── StateManager.js  # State management with @injectable
└── ...              # Other modules
```

### **Compiled Files**
```
dist/                # Compiled output
├── modules/        # Compiled JavaScript modules
│   ├── main.js     # Compiled entry point
│   ├── DependencyContainer.js  # Compiled with decorators
│   └── ...         # Other compiled modules
├── index.html      # Static HTML
├── css/            # Stylesheets
├── geojson/        # Data files
└── ...             # Other static assets
```

## Troubleshooting

### **Common Issues**

1. **Build Fails with Decorator Error**:
   ```bash
   # Ensure SWC is properly configured
   # Check .swcrc configuration file
   cat .swcrc
   ```

2. **Watch Mode Not Working**:
   ```bash
   # Check if files are being watched
   npm run watch:js
   # Edit a file in js/modules/ and check for rebuild
   ```

3. **GitHub Pages Not Updating**:
   - Check GitHub Actions tab for build status
   - Ensure `main` branch is being pushed to
   - Verify GitHub Pages is enabled in repository settings

4. **Module Loading Errors**:
   ```bash
   # Check compiled output
   ls dist/modules/
   # Verify source maps are generated
   ls dist/modules/*.map
   ```

5. **Test Failures Due to Missing Build**:
   ```bash
   # Always build before testing
   npm run build:js
   npm run test
   
   # Or use test scripts that include build
   npm run test:e2e  # Includes build:js automatically
   ```

6. **Decorator Errors in Tests**:
   - Ensure tests run against compiled code (`dist/modules/`)
   - Check that `npm run build:js` completed successfully
   - Verify SWC configuration in `.swcrc` is correct

### **Debug Commands**

```bash
# Check SWC compilation
npx swc js/modules --out-dir dist --strip-leading-paths --source-maps

# Test compiled modules
npm run serve:dist

# Check GitHub Actions logs
# Go to GitHub repository > Actions tab
```

## Performance Optimization

### **Build Performance**

- **Source Maps**: Enabled for debugging
- **Watch Mode**: Only rebuilds changed files
- **Concurrent Processes**: Build and serve run in parallel

### **Runtime Performance**

- **ES6 Modules**: Native browser support
- **Decorators**: Compiled to efficient JavaScript (not stripped, but transformed)
- **InversifyJS**: Full functionality preserved through SWC transformation

### **Decorator Transformation Process**

**Important**: Decorators are **not stripped** during build - they are **transformed** into browser-compatible JavaScript:

#### **What Happens to Decorators**

1. **Source Code** (`js/modules/`): Contains TypeScript decorators
2. **SWC Compilation**: Transforms decorators into standard JavaScript
3. **Output** (`dist/modules/`): Contains transformed, browser-compatible code

#### **Example Transformation**

```typescript
// Source code (js/modules/ConfigService.js)
@injectable()
export class ConfigService {
  @inject('ConfigService')
  private config: any;
}
```

**SWC transforms this into:**
```javascript
// Compiled code (dist/modules/ConfigService.js)
export class ConfigService {
  constructor() {
    this.config = container.get('ConfigService');
  }
}
```

#### **Why This Is Good**

- **Browser Compatibility**: Decorators aren't natively supported in browsers yet
- **Performance**: Transformed code runs faster than runtime decorator processing
- **Bundle Size**: No need for decorator runtime libraries
- **InversifyJS Compatibility**: The transformed code works perfectly with InversifyJS

## Best Practices

### **Development**

1. **Use Watch Mode**: Always use `npm run dev` for development
2. **Check Console**: Monitor browser console for errors
3. **Test Changes**: Run tests after significant changes
4. **Commit Often**: Small, frequent commits work better with automation

### **Deployment**

1. **Test Before Push**: Always test locally before pushing
2. **Check Actions**: Monitor GitHub Actions for build status
3. **Incremental Changes**: Make small, focused changes
4. **Document Changes**: Update documentation for significant changes

## Advanced Configuration

### **Custom SWC Configuration**

To modify compilation settings, edit `.swcrc`:

```json
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true
    },
    "transform": {
      "decoratorMetadata": true,
      "legacyDecorator": true
    },
    "target": "es2020"
  },
  "env": {
    "targets": "last 2 versions"
  }
}
```

### **GitHub Actions Customization**

To modify deployment settings, edit `.github/workflows/build-and-deploy.yml`:

```yaml
name: Build and Deploy to GitHub Pages

on:
  push:
    branches: [ main, develop ]  # Add more branches as needed
```

## Related Documentation

- [Testing Framework](testing-playwright.md) - Testing with compiled modules
- [Architecture Overview](../architecture/overview.md) - System architecture
- [Development Setup](setup.md) - Development environment setup
- [GitHub Pages Deployment](../deployment/production.md) - Production deployment

---

*This build automation system ensures consistent, reliable deployment while preserving the sophisticated dependency injection architecture that makes this application maintainable and scalable.*
