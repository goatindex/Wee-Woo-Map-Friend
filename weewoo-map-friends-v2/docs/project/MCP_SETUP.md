# 🔧 **MCP (Model Context Protocol) Setup Guide**

## **Overview**

This document explains how to set up and use MCP servers for WeeWoo Map Friends V2 development. MCP servers provide AI assistants with access to external tools and services for enhanced development capabilities.

## **MCP Configuration**

The project includes a `mcp.json` file with the following MCP servers configured:

### **1. GitHub MCP Server**
- **Purpose**: Git operations, repository management, issue tracking
- **Command**: Docker-based GitHub MCP server
- **Environment**: Requires `GITHUB_PERSONAL_ACCESS_TOKEN`
- **Capabilities**:
  - Repository operations (create, read, update, delete)
  - Issue and pull request management
  - Branch and commit operations
  - File content retrieval and modification

### **2. Context7 MCP Server**
- **Purpose**: Library documentation and trust ratings
- **URL**: `https://mcp.context7.com/mcp`
- **Capabilities**:
  - Library documentation retrieval
  - Trust score analysis
  - Code snippet examples
  - Technology comparison data

### **3. Playwright MCP Server**
- **Purpose**: Browser automation and testing
- **Command**: `npx @playwright/mcp@latest --headless`
- **Capabilities**:
  - Browser testing automation
  - E2E test execution
  - Screenshot capture
  - Performance testing

## **Setup Instructions**

### **1. Prerequisites**

#### **Docker (for GitHub MCP)**
```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop/

# Verify installation
docker --version
```

#### **Node.js and npm**
```bash
# Install Node.js 18+ and npm 9+
# Download from: https://nodejs.org/

# Verify installation
node --version
npm --version
```

#### **GitHub Personal Access Token**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with these permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `write:packages` (Write packages to GitHub Package Registry)
3. Copy the token and update `mcp.json` if needed

### **2. MCP Server Installation**

#### **GitHub MCP Server**
```bash
# Pull the GitHub MCP server Docker image
docker pull ghcr.io/github/github-mcp-server:latest
```

#### **Playwright MCP Server**
```bash
# Install Playwright MCP server globally
npm install -g @playwright/mcp@latest

# Or install locally in project
npm install @playwright/mcp@latest --save-dev
```

### **3. Environment Configuration**

#### **GitHub Token Setup**
```bash
# Option 1: Set environment variable
export GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"

# Option 2: Update mcp.json directly
# Edit the GITHUB_PERSONAL_ACCESS_TOKEN value in mcp.json
```

#### **Context7 Setup**
- No additional setup required
- Uses public API endpoint

## **Usage Examples**

### **GitHub MCP Operations**

#### **Repository Management**
```javascript
// Create a new branch
await mcp_GitHub_create_branch({
  owner: "mapexp",
  repo: "weewoo-map-friends-v2",
  branch: "feature/new-mapping-layer",
  base: "main"
});

// Get file contents
await mcp_GitHub_get_file_contents({
  owner: "mapexp",
  repo: "weewoo-map-friends-v2",
  path: "src/components/MapComponent.js"
});
```

#### **Issue and PR Management**
```javascript
// Create an issue
await mcp_GitHub_create_issue({
  owner: "mapexp",
  repo: "weewoo-map-friends-v2",
  title: "Add weather layer integration",
  body: "Implement WillyWeather API integration for real-time weather data"
});

// Create a pull request
await mcp_GitHub_create_pull_request({
  owner: "mapexp",
  repo: "weewoo-map-friends-v2",
  title: "Feature: Multi-platform build support",
  head: "feature/multi-platform",
  base: "main"
});
```

### **Context7 MCP Operations**

#### **Library Documentation**
```javascript
// Get library documentation
await mcp_Context7_get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "routing",
  tokens: 5000
});

// Resolve library ID
await mcp_Context7_resolve-library-id({
  libraryName: "leaflet"
});
```

### **Playwright MCP Operations**

#### **Browser Testing**
```javascript
// Navigate to application
await mcp_playwright_browser_navigate({
  url: "http://localhost:3000"
});

// Take screenshot
await mcp_playwright_browser_take_screenshot({
  filename: "homepage-screenshot.png",
  fullPage: true
});

// Run E2E test
await mcp_playwright_browser_click({
  element: "Map layer toggle",
  ref: "button[data-testid='layer-toggle']"
});
```

## **Development Workflow Integration**

### **1. Local Development**
```bash
# Start development server
npm run dev:github

# In another terminal, start MCP servers
# GitHub MCP will start automatically when needed
# Playwright MCP can be started manually for testing
```

### **2. Testing Workflow**
```bash
# Run unit tests
npm run test:unit

# Run E2E tests with Playwright MCP
npm run test:e2e:github

# Run performance tests
npm run test:performance
```

### **3. Build and Deployment**
```bash
# Build for GitHub.io
npm run build:github

# Deploy to GitHub Pages
npm run deploy:github

# GitHub MCP can be used to manage deployments
```

## **MCP Server Capabilities by Phase**

### **Phase 1: GitHub.io Development**
- **GitHub MCP**: Repository management, issue tracking, deployment
- **Context7 MCP**: Library documentation for core libraries
- **Playwright MCP**: E2E testing for static functionality

### **Phase 2: Web App Development**
- **GitHub MCP**: Backend repository management, API integration
- **Context7 MCP**: Backend library documentation
- **Playwright MCP**: Full-stack E2E testing

### **Phase 3: Native App Development**
- **GitHub MCP**: Mobile app repository management
- **Context7 MCP**: Native app library documentation
- **Playwright MCP**: Mobile app testing (limited)

## **Troubleshooting**

### **Common Issues**

#### **GitHub MCP Authentication**
```bash
# Check if token is valid
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
  https://api.github.com/user

# Update token in mcp.json if needed
```

#### **Docker Issues**
```bash
# Check Docker status
docker ps

# Restart Docker if needed
sudo systemctl restart docker
```

#### **Playwright MCP Issues**
```bash
# Install Playwright browsers
npx playwright install

# Check Playwright MCP status
npx @playwright/mcp@latest --help
```

### **Debug Mode**

#### **Enable MCP Debug Logging**
```bash
# Set debug environment variable
export MCP_DEBUG=true

# Run with verbose logging
npm run dev:github --verbose
```

#### **Test MCP Connections**
```bash
# Test GitHub MCP
docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server

# Test Playwright MCP
npx @playwright/mcp@latest --headless --help
```

## **Security Considerations**

### **GitHub Token Security**
- Store token securely (environment variables preferred)
- Use minimal required permissions
- Rotate token regularly
- Never commit token to repository

### **Docker Security**
- Keep Docker images updated
- Use official images when possible
- Limit container permissions

### **Network Security**
- Use HTTPS for all MCP communications
- Validate MCP server responses
- Monitor for suspicious activity

## **Performance Optimization**

### **GitHub MCP**
- Use pagination for large data sets
- Cache frequently accessed data
- Batch operations when possible

### **Context7 MCP**
- Limit token usage for documentation
- Cache library information locally
- Use specific topics to reduce response size

### **Playwright MCP**
- Use headless mode for CI/CD
- Optimize test execution time
- Use parallel test execution

## **Integration with CI/CD**

### **GitHub Actions Integration**
```yaml
# .github/workflows/ci.yml
- name: Test with Playwright MCP
  run: |
    npm run test:e2e:github
    npx @playwright/mcp@latest --headless --test
```

### **Local Development Integration**
```bash
# Add to package.json scripts
"test:mcp": "npx @playwright/mcp@latest --headless --test",
"deploy:mcp": "docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server"
```

## **Best Practices**

### **1. MCP Server Management**
- Keep MCP servers updated
- Monitor server health
- Use appropriate timeouts
- Handle connection failures gracefully

### **2. Development Workflow**
- Use MCP servers for repetitive tasks
- Automate common operations
- Integrate with existing tools
- Document MCP usage patterns

### **3. Testing Strategy**
- Use Playwright MCP for E2E testing
- Test MCP server integrations
- Validate MCP responses
- Monitor MCP performance

## **Conclusion**

The MCP setup provides powerful tools for WeeWoo Map Friends V2 development:

- **GitHub MCP**: Streamlines repository management and deployment
- **Context7 MCP**: Provides comprehensive library documentation
- **Playwright MCP**: Enables robust testing automation

This configuration supports all three development phases (GitHub.io, Web App, Native Apps) and integrates seamlessly with the existing build pipeline and development workflow.

**Next Steps**:
1. Verify MCP server installations
2. Test MCP connections
3. Integrate MCP operations into development workflow
4. Document MCP usage patterns for team members

