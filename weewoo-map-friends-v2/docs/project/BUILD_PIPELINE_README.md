# 🚀 **Build Pipeline README - WeeWoo Map Friends V2**

## **Quick Start**

### **Local Development**
```bash
# Install dependencies
npm install

# Start development server (backend mode)
npm run dev

# Start development server (static mode)
npm run dev:static

# Run tests
npm run test:unit
npm run test:e2e

# Build for production
npm run build:static    # GitHub Pages
npm run build:backend   # Full features
```

### **GitHub Actions**
The build pipeline automatically runs on:
- **Push to main/develop**: Full CI/CD pipeline
- **Pull requests**: Quality gates and testing
- **Manual trigger**: Available in GitHub Actions tab

## **Build Pipeline Overview**

### **Pipeline Stages**

1. **Quality Gates** (Always runs)
   - Code linting and formatting
   - Type checking
   - Security audits
   - License compliance

2. **Unit Tests** (Parallel)
   - Vitest test execution
   - Coverage reporting
   - Multi-Node.js version testing

3. **E2E Tests** (Parallel)
   - Playwright test execution
   - Multi-browser testing
   - Cross-platform compatibility

4. **Build Static** (GitHub Pages)
   - Static build generation
   - Performance budget validation
   - Bundle size analysis

5. **Build Backend** (Full Features)
   - Backend build generation
   - Security scanning
   - Feature flag validation

6. **Deploy Static** (GitHub Pages)
   - Automatic deployment
   - URL generation
   - PR comment integration

7. **Deploy Backend** (Cloud)
   - Vercel/Netlify deployment
   - Environment variable injection
   - Health check validation

8. **Performance Monitoring**
   - Lighthouse CI
   - Performance metrics
   - Bundle analysis

9. **Notifications**
   - Slack notifications
   - Build status updates
   - Error alerts

## **Environment Configuration**

### **Static Mode (GitHub Pages)**
- **File**: `env.static`
- **Features**: Map layers, basic functionality
- **Limitations**: No weather, no alerts, no real-time data
- **URL**: `https://username.github.io/weewoo-map-friends-v2/`

### **Backend Mode (Full Features)**
- **File**: `env.backend`
- **Features**: Weather, alerts, real-time data
- **Capabilities**: API integration, backend services
- **URL**: `https://weewoo-map-friends-v2.vercel.app/`

## **Testing Strategy**

### **Unit Tests (Vitest)**
```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Run with UI
npm run test:unit:ui
```

### **E2E Tests (Playwright)**
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:critical-path
npm run test:offline
npm run test:performance

# Run with UI
npm run test:e2e:ui

# Run for specific environment
npm run test:e2e:static
npm run test:e2e:backend
```

### **Test Files**
- `tests/critical-path.spec.js` - Emergency services critical functionality
- `tests/offline.spec.js` - Offline and PWA functionality
- `tests/performance.spec.js` - Performance requirements and metrics

## **Build Commands**

### **Development**
```bash
npm run dev              # Backend mode (default)
npm run dev:static       # Static mode
npm run dev:backend      # Backend mode (explicit)
```

### **Production Builds**
```bash
npm run build:static     # GitHub Pages build
npm run build:backend    # Full features build
npm run build:analyze    # Build with analysis
```

### **Preview**
```bash
npm run preview          # Preview production build
npm run preview:static   # Preview static build
npm run preview:backend  # Preview backend build
```

## **Quality Assurance**

### **Code Quality**
```bash
npm run lint             # ESLint check
npm run lint:fix         # ESLint fix
npm run format           # Prettier format
npm run format:check     # Prettier check
npm run type-check       # TypeScript check
```

### **Security**
```bash
npm run security:check   # Security audit
npm run license:check    # License compliance
```

### **Performance**
```bash
npm run build:budget-check  # Performance budget check
npm run test:performance    # Performance tests
```

## **Performance Requirements**

### **Emergency Services Standards**
- **Load time**: < 3 seconds on 3G connection
- **Bundle size**: < 500KB gzipped
- **Memory usage**: < 50MB
- **Offline capability**: 100% of core features work offline

### **Performance Budgets**
- **Bundle size**: 500KB
- **Gzip size**: 150KB
- **Load time**: 3 seconds
- **Memory usage**: 50MB

## **Deployment**

### **GitHub Pages (Static)**
- **Automatic**: On push to main branch
- **Manual**: `npm run deploy:static`
- **URL**: `https://username.github.io/weewoo-map-friends-v2/`

### **Vercel/Netlify (Backend)**
- **Automatic**: On push to main branch
- **Manual**: `npm run deploy:backend`
- **URL**: `https://weewoo-map-friends-v2.vercel.app/`

## **Monitoring and Alerting**

### **Build Metrics**
- Build time tracking
- Bundle size monitoring
- Test coverage reporting
- Performance score tracking

### **Notifications**
- Slack webhook integration
- Build failure alerts
- Success notifications
- Performance degradation warnings

## **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Check logs
npm run build:static 2>&1 | tee build.log

# Check dependencies
npm audit
npm outdated

# Clear cache
npm run clean
```

#### **Test Failures**
```bash
# Run tests with debug info
npm run test:e2e:debug

# Check test results
npm run test:e2e:report

# Run specific test
npx playwright test tests/critical-path.spec.js
```

#### **Performance Issues**
```bash
# Check bundle size
npm run build:analyze

# Check performance budget
npm run build:budget-check

# Run performance tests
npm run test:performance
```

### **Debug Mode**
```bash
# Enable debug logging
VITE_ENABLE_DEBUG=true npm run dev

# Check environment variables
npm run env:check
```

## **Development Workflow**

### **1. Feature Development**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Start development
npm run dev

# Run tests
npm run test:unit
npm run test:e2e

# Check quality
npm run lint
npm run format:check
```

### **2. Pre-commit**
```bash
# Install pre-commit hooks
npm run prepare

# Manual pre-commit checks
npm run lint:fix
npm run format
npm run test:unit
```

### **3. Pull Request**
- Quality gates run automatically
- All tests must pass
- Performance budgets must be met
- Security scans must pass

### **4. Merge to Main**
- Full CI/CD pipeline runs
- Automatic deployment to both environments
- Performance monitoring activated
- Notifications sent

## **Configuration Files**

### **Build Configuration**
- `vite.config.js` - Vite build configuration
- `package.json` - Scripts and dependencies
- `tsconfig.json` - TypeScript configuration

### **Testing Configuration**
- `playwright.config.js` - Main Playwright config
- `playwright.static.config.js` - Static environment tests
- `playwright.backend.config.js` - Backend environment tests
- `vitest.config.js` - Vitest configuration

### **Environment Configuration**
- `env.static` - Static environment variables
- `env.backend` - Backend environment variables
- `.github/workflows/ci.yml` - GitHub Actions workflow

### **Quality Configuration**
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `lighthouserc.js` - Lighthouse CI configuration

## **Best Practices**

### **Code Quality**
- Always run `npm run lint:fix` before committing
- Use `npm run format` to format code
- Write tests for new features
- Keep bundle size under budget

### **Performance**
- Monitor performance metrics regularly
- Use performance tests to catch regressions
- Optimize images and assets
- Implement lazy loading where appropriate

### **Security**
- Run security audits regularly
- Keep dependencies updated
- Use environment variables for secrets
- Implement proper CORS policies

### **Testing**
- Write unit tests for business logic
- Write E2E tests for user workflows
- Test both static and backend modes
- Include performance and offline tests

This build pipeline provides a robust, reliable foundation for the WeeWoo Map Friends V2 project, optimized for emergency services requirements while maintaining developer productivity and code quality.

