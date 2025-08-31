# E2E Testing Troubleshooting Guide

Comprehensive troubleshooting guide for End-to-End (E2E) testing issues in WeeWoo Map Friend, based on real-world debugging experience.

## Table of Contents

- [Quick Diagnosis](#quick-diagnosis)
- [Common Issues & Solutions](#common-issues--solutions)
- [Systematic Investigation Process](#systematic-investigation-process)
- [Prevention Strategies](#prevention-strategies)
- [Tool Behavior Patterns](#tool-behavior-patterns)
- [Emergency Recovery](#emergency-recovery)

## Quick Diagnosis

### **When to Use This Guide**

- ✅ E2E tests are failing consistently
- ✅ Tests pass individually but fail in suites
- ✅ Unexpected tool behavior (reversions, errors)
- ✅ Tests that worked before are now broken
- ✅ Performance issues during test execution

### **First Response Checklist**

1. **Stop all fix attempts** - Don't make rapid changes
2. **Document the pattern** - What's happening and how often?
3. **Check tool behavior** - Are development tools working correctly?
4. **Apply systematic investigation** - Use the 10-step process below

## Common Issues & Solutions

### **1. Element Visibility Issues**

#### **Problem**: `Error: expect(locator).toBeVisible() failed`

**Symptoms:**
- Elements appear to exist but tests can't see them
- Tests fail with "Received: hidden" messages
- Inconsistent behavior across test runs

**Root Causes:**
- **Dynamic Content**: Elements populated after page load
- **Collapsible Sections**: Elements start hidden by default
- **Timing Issues**: Tests run before JavaScript completes
- **CSS Issues**: Elements hidden by CSS rules

**Solutions:**
```javascript
// Wait for dynamic content
await page.waitForFunction(() => {
  const element = document.querySelector('#targetElement');
  return element && element.children.length > 0;
}, { timeout: 10000 });

// Handle collapsible sections
const header = page.locator('#sectionHeader');
await header.click();
await expect(page.locator('#sectionContent')).toBeVisible();

// Wait for full page load
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);
```

### **2. Bootstrap Initialization Errors**

#### **Problem**: `Error: Map container is already initialized`

**Symptoms:**
- Application fails to start properly
- Tests timeout waiting for map initialization
- Console shows multiple initialization attempts

**Root Cause**: `AppBootstrap.init()` called multiple times

**Solution**: Remove duplicate initialization calls
```javascript
// In js/bootstrap.js - ensure only ONE call to:
AppBootstrap.init();

// Remove any duplicate calls at the end of the file
// Check for multiple script tags or event handlers
```

**Prevention**: Add initialization guard
```javascript
if (!window.appInitialized) {
  AppBootstrap.init();
  window.appInitialized = true;
}
```

### **3. GeoJSON Data Corruption**

#### **Problem**: `Error: Invalid GeoJSON object`

**Symptoms:**
- Feature lists don't populate
- Console shows GeoJSON parsing errors
- Tests fail when trying to interact with features

**Root Cause**: Corrupted or malformed GeoJSON files

**Solution**: Add robust error handling
```javascript
// In js/loaders/polygons.js
try {
  const layer = L.geoJSON(feature, { style, pane: category });
  return layer;
} catch (error) {
  console.warn(`Invalid GeoJSON feature:`, feature, error);
  return null; // Filter out invalid features
}

// Filter out null layers
.filter(layer => layer !== null)
```

**Prevention**: Validate GeoJSON files before deployment
```bash
# Use online GeoJSON validators
# Check file integrity regularly
# Implement automated validation in CI/CD
```

### **4. Test Selector Mismatches**

#### **Problem**: Tests fail because selectors don't match HTML

**Symptoms:**
- Tests can't find expected elements
- Selectors that worked before are now broken
- Inconsistent element identification

**Root Cause**: HTML structure changed or tests use outdated selectors

**Solution**: Verify current HTML structure
```bash
# Check actual HTML structure
grep -r "id=" index.html
grep -r "class=" index.html

# Update test selectors to match current structure
# Common mappings:
# #sidebar → #layerMenu
# #ses-section → #sesList
# #active-list → #activeList
# .mobile-nav-toggle → .docs-toc-toggle
```

**Prevention**: Use stable selectors
```javascript
// Prefer data attributes over classes
await page.locator('[data-testid="sidebar"]').click();

// Use semantic selectors when possible
await page.locator('h4[id$="Header"]').click();
```

### **5. Progress Tracking System Errors**

#### **Problem**: `TypeError` in global setup/teardown or reporter

**Symptoms:**
- E2E tests fail to start or complete
- Progress tracking doesn't work
- Console shows API errors

**Root Cause**: Incorrect usage of progress tracking classes

**Solution**: Use correct API methods
```javascript
// Correct usage pattern
progressTracker.init();
progressTracker.startPhase('Phase Name');
progressTracker.testStarted('Test Name');
progressTracker.testPassed('Test Name');
progressTracker.displayFinalSummary();
```

**Prevention**: Follow the established API pattern
```javascript
// Always check method availability
if (typeof progressTracker.init === 'function') {
  progressTracker.init();
}
```

## Systematic Investigation Process

### **10-Step Process for Complex Issues**

1. **Document the Pattern**
   - What's happening? When? How often?
   - What error messages appear?
   - What was the last working state?

2. **Identify Failure Points**
   - Which tests are failing?
   - What specific errors occur?
   - Are there patterns in the failures?

3. **Check Tool Behavior**
   - Are development tools working correctly?
   - Are there unexpected reversions or errors?
   - Is the environment stable?

4. **Analyze Root Causes**
   - Look beyond symptoms to underlying problems
   - Check for configuration issues
   - Verify file integrity

5. **Verify Current State**
   - What's actually working vs. broken?
   - Check console logs and error messages
   - Verify file contents and structure

6. **Research Solutions**
   - Find proven approaches rather than guessing
   - Check documentation and examples
   - Look for similar issues in the community

7. **Implement Targeted Fixes**
   - Apply minimal, focused solutions
   - Fix one issue at a time
   - Test each fix before proceeding

8. **Test Incrementally**
   - Verify each fix works
   - Run tests to confirm improvements
   - Document what worked

9. **Document Solutions**
   - Record what worked and why
   - Update troubleshooting guides
   - Share knowledge with the team

10. **Prevent Recurrence**
    - Implement safeguards
    - Add monitoring and validation
    - Update processes and procedures

### **When to Apply This Process**

- **Tool Resistance**: Development tools behave unexpectedly
- **Repeated Failures**: Same issue occurs multiple times
- **Regression Patterns**: Fixes are undone or reverted
- **Inconsistent Behavior**: Behavior varies across attempts
- **Complex Failures**: Multiple issues appear simultaneously

## Prevention Strategies

### **1. Automated Validation**

```javascript
// Add pre-test validation
beforeAll(async () => {
  // Check for common configuration issues
  await validateTestEnvironment();
  await validateApplicationState();
});
```

### **2. Error Handling**

```javascript
// Implement graceful degradation
try {
  await performOperation();
} catch (error) {
  console.warn('Operation failed, continuing with fallback');
  await fallbackOperation();
}
```

### **3. Monitoring and Alerting**

```javascript
// Add performance monitoring
const startTime = performance.now();
await testOperation();
const duration = performance.now() - startTime;

if (duration > threshold) {
  console.warn(`Operation took ${duration}ms, exceeding threshold`);
}
```

### **4. Regular Health Checks**

```bash
# Run health checks regularly
npm run test:health

# Check for common issues
npm run validate:environment
```

## Tool Behavior Patterns

### **Development Tool Quirks**

#### **apply_model Tool**
- **Behavior**: May revert changes unexpectedly
- **Pattern**: Often reverts to previous file state
- **Workaround**: Verify changes after each edit
- **Prevention**: Use targeted edits with clear context

#### **File Reading Tools**
- **Behavior**: May show cached or outdated content
- **Pattern**: File contents don't match expected state
- **Workaround**: Re-read files when behavior seems inconsistent
- **Prevention**: Always verify file state before making changes

### **Best Practices for Tool Usage**

1. **Verify Changes**: Always check that edits were applied correctly
2. **Use Clear Context**: Provide sufficient context for edit tools
3. **Test Incrementally**: Make small changes and verify each one
4. **Document Tool Behavior**: Record quirks and workarounds

## Emergency Recovery

### **When All Else Fails**

1. **Stop All Changes**: Don't make more modifications
2. **Assess Damage**: What's broken vs. what's working?
3. **Identify Last Good State**: When did things last work correctly?
4. **Plan Recovery**: What's the minimal path to restore functionality?
5. **Execute Carefully**: Make one change at a time
6. **Verify Each Step**: Confirm improvements before proceeding

### **Recovery Commands**

```bash
# Check current git status
git status

# See recent changes
git log --oneline -10

# Revert to last working commit (if needed)
git reset --hard HEAD~1

# Check for uncommitted changes
git diff
```

### **Getting Help**

1. **Document the Issue**: What happened, when, and what you've tried
2. **Gather Evidence**: Error messages, console logs, file states
3. **Seek Assistance**: Ask for help with specific information
4. **Learn from Experience**: Document what worked for future reference

## 📚 Related Resources

For comprehensive lessons learned from our Architecture Rationalization Project, see:
- **[Architecture Rationalization Lessons](./architecture-rationalization-lessons.md)** - Complete project insights, patterns, and recommendations

## Summary

This troubleshooting guide provides a systematic approach to resolving E2E testing issues. The key principles are:

- **Stop and investigate** when patterns emerge
- **Use systematic approaches** instead of rapid fixes
- **Document everything** for future reference
- **Implement prevention** to avoid recurring issues
- **Understand tool behavior** to prevent regressions

Remember: **Systematic investigation should be the first response to repeated failures, not a last resort.**

---

*This guide is based on real-world debugging experience and should be updated as new issues are encountered and resolved.*
