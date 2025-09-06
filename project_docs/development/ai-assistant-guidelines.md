# AI Assistant Guidelines: Tool Selection & Usage

## **Tool Selection Strategy**

### **Git Operations: ALWAYS Use GitHub MCP**

**When to Use GitHub MCP:**
- ✅ Creating branches
- ✅ Creating pull requests
- ✅ Merging pull requests
- ✅ Getting file contents from repository
- ✅ Searching code across repository
- ✅ Managing issues
- ✅ Checking commit history
- ✅ Any repository management tasks

**When NOT to Use Terminal Git:**
- ❌ `git checkout`
- ❌ `git merge`
- ❌ `git pull`
- ❌ `git push`
- ❌ `git status`
- ❌ `git log`
- ❌ `git branch`

**Rationale:**
- GitHub MCP is more reliable than terminal commands
- Avoids git pager issues and terminal blocking
- Provides direct GitHub API access
- All operations are tracked in GitHub
- Better error handling and feedback

### **Testing & Validation: Use Appropriate Tools**

**When to Use Browser Testing:**
- ✅ Testing application functionality
- ✅ Validating user workflows
- ✅ Checking console errors
- ✅ UI interaction testing
- ✅ Debugging application issues

**When NOT to Use Terminal Testing:**
- ❌ `curl` commands for testing
- ❌ Manual browser testing
- ❌ Terminal-based validation

**Rationale:**
- Browser testing provides real user experience
- Captures actual application behavior
- Better debugging capabilities
- Cross-browser testing support

## **Tool Usage Patterns**

### **Git Workflow Pattern**
```javascript
// ✅ CORRECT: Use GitHub MCP
mcp_GitHub_create_branch()
mcp_GitHub_create_pull_request()
mcp_GitHub_merge_pull_request()
mcp_GitHub_get_file_contents()

// ❌ AVOID: Terminal git commands
run_terminal_cmd("git checkout main")
run_terminal_cmd("git merge feature")
```

### **Testing Workflow Pattern**
```javascript
// ✅ CORRECT: Use browser testing tools (when available)
// Browser testing for UI validation
// Console checking for debugging
// Form interaction testing

// ✅ CORRECT: Use terminal for server testing
run_terminal_cmd("Invoke-WebRequest -Uri http://localhost:8000 -UseBasicParsing")

// ❌ AVOID: Terminal curl commands
run_terminal_cmd("curl http://localhost:8000")
```

## **Exception Cases**

### **When Terminal Commands Are Acceptable**
- ✅ **Development server management**: `npm run dev`, `python -m http.server`
- ✅ **File system operations**: `ls`, `cat`, `mkdir` (when MCP tools unavailable)
- ✅ **Package management**: `npm install`, `npm test` (when MCP tools unavailable)
- ✅ **System information**: `pwd`, `whoami`, `date`

### **When to Use Web Search**
- ✅ **External API documentation**: When checking third-party APIs
- ✅ **Technology research**: When learning about new tools or patterns
- ✅ **Troubleshooting**: When looking up error messages or solutions

## **Quality Assurance Checklist**

### **Before Any Git Operation**
- [ ] Am I using GitHub MCP tools?
- [ ] Have I avoided terminal git commands?
- [ ] Is the operation tracked in GitHub?

### **Before Any Testing Operation**
- [ ] Am I using appropriate testing tools?
- [ ] Am I testing in a real browser when possible?
- [ ] Am I capturing actual user experience?

### **Before Any Terminal Command**
- [ ] Is this a development server command?
- [ ] Is this a file system operation?
- [ ] Is there an MCP alternative available?

## **Common Anti-Patterns to Avoid**

### **❌ Git Anti-Patterns**
```bash
# DON'T DO THIS
run_terminal_cmd("git checkout main")
run_terminal_cmd("git merge feature")
run_terminal_cmd("git status")
```

### **❌ Testing Anti-Patterns**
```bash
# DON'T DO THIS
run_terminal_cmd("curl http://localhost:8000")
run_terminal_cmd("wget http://localhost:8000")
```

### **❌ Mixed Tool Usage**
```javascript
// DON'T DO THIS - mixing tools inconsistently
mcp_GitHub_create_branch()  // Good
run_terminal_cmd("git status")  // Bad - should use GitHub MCP
// Use appropriate testing tools consistently
run_terminal_cmd("curl http://localhost:8000")  // Bad - use proper testing tools
```

## **Tool Availability Reference**

### **GitHub MCP Tools Available**
- `mcp_GitHub_create_branch`
- `mcp_GitHub_create_pull_request`
- `mcp_GitHub_merge_pull_request`
- `mcp_GitHub_get_file_contents`
- `mcp_GitHub_search_code`
- `mcp_GitHub_list_branches`
- `mcp_GitHub_get_commit`
- `mcp_GitHub_create_issue`
- `mcp_GitHub_list_issues`

### **Testing Tools Available**
- Browser testing tools (when properly configured)
- Console output checking
- Form interaction testing
- Screenshot capture
- JavaScript execution

### **⚠️ IMPORTANT NOTE**
- **Testing tools require proper configuration**
- **Use appropriate tools for each testing scenario**
- **Terminal commands available for basic server testing**

### **Terminal Commands (Use Sparingly)**
- `run_terminal_cmd` - Only for development server, file operations, package management

## **Implementation Guidelines**

### **For AI Assistant**
1. **Always check tool availability** before starting any operation
2. **Prefer MCP tools** over terminal commands when available
3. **Use consistent patterns** for similar operations
4. **Document tool choices** in responses when relevant
5. **Explain tool selection** when using terminal commands as exceptions

### **For Human Developer**
1. **Follow the same patterns** when working manually
2. **Use GitHub web interface** for complex git operations
3. **Use browser developer tools** for testing and debugging
4. **Prefer MCP tools** when available in AI assistant context

---

**Last Updated**: 2025-09-06  
**Purpose**: Ensure consistent and effective tool usage in AI assistant interactions  
**Scope**: All git operations, testing, and validation activities
