# Tool Usage Examples: Correct vs Incorrect

## **Git Operations Examples**

### **✅ CORRECT: Using GitHub MCP**

```javascript
// Create a new branch
await mcp_GitHub_create_branch({
  owner: "goatindex",
  repo: "mapexp.github.io", 
  branch: "feature/map-performance-optimization"
});

// Get file contents
const fileContent = await mcp_GitHub_get_file_contents({
  owner: "goatindex",
  repo: "mapexp.github.io",
  path: "js/modules/ApplicationBootstrap.js"
});

// Search for code
const searchResults = await mcp_GitHub_search_code({
  query: "ApplicationBootstrap class",
  owner: "goatindex",
  repo: "mapexp.github.io"
});

// Create a pull request
await mcp_GitHub_create_pull_request({
  owner: "goatindex",
  repo: "mapexp.github.io",
  title: "Fix circular dependency in StateManager",
  head: "feature/fix-circular-dependency",
  base: "main",
  body: "Resolves circular dependency between StateManager and other modules"
});
```

### **❌ INCORRECT: Using Terminal Git Commands**

```bash
# DON'T DO THIS
run_terminal_cmd("git checkout main")
run_terminal_cmd("git merge feature/fix-circular-dependency")
run_terminal_cmd("git status")
run_terminal_cmd("git log --oneline -5")
```

## **Testing Examples**

### **✅ CORRECT: Using Appropriate Testing Tools**

```javascript
// Use appropriate testing tools when available
// Browser testing for UI validation
// Console checking for debugging
// Form interaction testing
// Screenshot capture
// JavaScript execution

// Example testing approach:
// 1. Navigate to page (when navigation tool available)
// 2. Take screenshots for visual validation
// 3. Execute JavaScript for functionality testing
// 4. Check console for errors
// 5. Test form interactions
```

### **❌ INCORRECT: Using Terminal Testing**

```bash
# DON'T DO THIS
run_terminal_cmd("curl http://localhost:8000")
run_terminal_cmd("wget http://localhost:8000")
run_terminal_cmd("Invoke-WebRequest -Uri http://localhost:8000")
```

## **Development Server Examples**

### **✅ CORRECT: Using Terminal for Development**

```bash
# Start development server
run_terminal_cmd("npm run dev")

# Install packages
run_terminal_cmd("npm install")

# Run tests
run_terminal_cmd("npm test")

# Check file contents
run_terminal_cmd("cat package.json")
```

### **❌ INCORRECT: Using MCP for Development Server**

```javascript
// DON'T DO THIS - MCP tools can't start servers
mcp_Playwright_browser_navigate({ url: "http://localhost:8000" }) // Server not running
```

## **Real-World Workflow Examples**

### **Example 1: Fixing a Bug**

```javascript
// 1. Get current file content (GitHub MCP)
const currentFile = await mcp_GitHub_get_file_contents({
  owner: "goatindex",
  repo: "mapexp.github.io",
  path: "js/modules/StateManager.js"
});

// 2. Create fix branch (GitHub MCP)
await mcp_GitHub_create_branch({
  owner: "goatindex", 
  repo: "mapexp.github.io",
  branch: "fix/state-manager-circular-dependency"
});

// 3. Test server response (Terminal)
const serverResponse = await run_terminal_cmd("Invoke-WebRequest -Uri http://localhost:8000 -UseBasicParsing");

// 4. Test the fix (Playwright MCP - requires page to be open)
// Note: Cannot navigate to page with current Playwright MCP implementation
// const mapLoaded = await mcp_Playwright_browser_evaluate({
//   function: "() => { return window.map !== undefined; }"
// });

// 5. Create PR (GitHub MCP)
await mcp_GitHub_create_pull_request({
  owner: "goatindex",
  repo: "mapexp.github.io", 
  title: "Fix circular dependency in StateManager",
  head: "fix/state-manager-circular-dependency",
  base: "main"
});
```

### **Example 2: Adding a New Feature**

```javascript
// 1. Create feature branch (GitHub MCP)
await mcp_GitHub_create_branch({
  owner: "goatindex",
  repo: "mapexp.github.io", 
  branch: "feature/search-improvements"
});

// 2. Test server response (Terminal)
const serverResponse = await run_terminal_cmd("Invoke-WebRequest -Uri http://localhost:8000 -UseBasicParsing");

// 3. Test current functionality (when testing tools available)
// Use appropriate testing tools for UI validation
// Check console for errors
// Test form interactions

// 4. Test new functionality (when testing tools available)
// Use browser testing tools for validation
// Test user workflows
// Verify functionality
```

## **Common Mistakes to Avoid**

### **❌ Mixing Tools Inappropriately**

```javascript
// DON'T DO THIS - mixing git operations
mcp_GitHub_create_branch()  // Good
run_terminal_cmd("git status")  // Bad - should use GitHub MCP

// DON'T DO THIS - mixing testing approaches  
// Use appropriate testing tools consistently
run_terminal_cmd("curl http://localhost:8000")  // Bad - use proper testing tools
```

### **❌ Using Wrong Tool for Task**

```javascript
// DON'T DO THIS - using terminal for git
run_terminal_cmd("git checkout main")

// DON'T DO THIS - using terminal for testing
run_terminal_cmd("curl http://localhost:8000")

// DON'T DO THIS - using wrong tools for tasks
// Use appropriate tools for each specific task
```

## **Tool Selection Decision Tree**

```
Task: Git operation?
├── YES → Use GitHub MCP
└── NO → Continue

Task: Testing/validation?
├── YES → Use appropriate testing tools
└── NO → Continue

Task: Development server?
├── YES → Use terminal commands
└── NO → Continue

Task: File operations?
├── YES → Use terminal commands (if MCP unavailable)
└── NO → Use appropriate MCP tool
```

---

**Remember**: Always check tool availability first, then use the most appropriate tool for the task. Use the right tool for each specific task!
