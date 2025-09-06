# Tool Selection Quick Reference

## **🚀 Quick Decision Tree**

```
Need to do Git operations?
├── YES → Use GitHub MCP tools
└── NO → Continue

Need to test/validate application?
├── YES → Use appropriate testing tools
└── NO → Continue

Need to run development server?
├── YES → Use terminal commands
└── NO → Continue

Need file operations?
├── YES → Use terminal commands (if MCP unavailable)
└── NO → Use appropriate MCP tool
```

## **📋 Tool Selection Matrix**

| Task Type | Primary Tool | Alternative | Never Use |
|-----------|-------------|-------------|-----------|
| **Git Operations** | GitHub MCP | - | Terminal git |
| **Testing/Validation** | Appropriate testing tools | - | curl/wget |
| **Development Server** | Terminal | - | - |
| **File Operations** | Terminal | - | - |
| **Package Management** | Terminal | - | - |
| **Code Search** | GitHub MCP | - | grep |
| **File Contents** | GitHub MCP | - | cat |

## **⚡ Common Commands**

### **Git Operations (GitHub MCP)**
```javascript
// Create branch
mcp_GitHub_create_branch()

// Create PR
mcp_GitHub_create_pull_request()

// Merge PR
mcp_GitHub_merge_pull_request()

// Get file contents
mcp_GitHub_get_file_contents()

// Search code
mcp_GitHub_search_code()
```

### **Testing (Appropriate Tools)**
```javascript
// Use appropriate testing tools when available
// Browser testing for UI validation
// Console checking for debugging
// Form interaction testing
// Screenshot capture
// JavaScript execution
```

### **Server Testing (Terminal)**
```bash
# Test server response
Invoke-WebRequest -Uri http://localhost:8000 -UseBasicParsing

# Check server status
netstat -an | findstr :8000
```

### **Development (Terminal)**
```bash
# Start dev server
npm run dev

# Install packages
npm install

# Run tests
npm test

# File operations
ls, cat, mkdir
```

## **🚨 Anti-Patterns to Avoid**

### **❌ Don't Do This**
```bash
# Git operations via terminal
run_terminal_cmd("git checkout main")
run_terminal_cmd("git merge feature")
run_terminal_cmd("git status")

# Testing via terminal
run_terminal_cmd("curl http://localhost:8000")
run_terminal_cmd("wget http://localhost:8000")
```

### **✅ Do This Instead**
```javascript
// Git operations via GitHub MCP
mcp_GitHub_create_branch()
mcp_GitHub_merge_pull_request()

// Testing via appropriate tools
// Use browser testing tools when available
// Use terminal for server testing
```

## **🔍 Tool Availability Check**

### **Before Starting Any Task**
1. **Check if GitHub MCP tool exists** for git operations
2. **Check if appropriate testing tools exist** for testing
3. **Use terminal only as last resort** for file operations
4. **Document tool choice** in response

### **Available MCP Tools**
- **GitHub MCP**: 25+ tools for repository management
- **Testing Tools**: Various browser testing and validation tools
- **Terminal**: For development server and file operations only

---

**Remember**: MCP tools are more reliable, provide better feedback, and integrate better with the overall workflow. Use them whenever possible!
