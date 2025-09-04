# Rollback Procedures for Controlled Aggressive Elimination

**Date**: 2025-01-27  
**Purpose**: Comprehensive rollback procedures for each phase of the migration

## Overview

This document provides detailed rollback procedures for each phase of the Controlled Aggressive Elimination migration. Each procedure is designed to restore the system to a working state if issues arise.

## Phase-Specific Rollback Procedures

### Week 1: Preparation and Testing

#### If Issues Arise During Preparation
```bash
# Complete rollback to main branch
git checkout main
git branch -D feature/controlled-aggressive-elimination

# Restart with new branch
git checkout -b feature/controlled-aggressive-elimination-v2
```

#### If Test Suite Issues
```bash
# Restore specific test files
git checkout main -- tests/HamburgerMenu.test.js
git checkout main -- js/modules/app.test.js

# Re-run tests
npm test
```

### Week 2: Bridge System Removal

#### If Bridge System Removal Causes Issues

##### Step 1: Restore Bridge System Files
```bash
# Restore all bridge system files
git checkout main -- js/modules/LegacyIntegrationBridge.js
git checkout main -- js/modules/LegacyCompatibility.js
git checkout main -- js/modules/ES6IntegrationManager.js
git checkout main -- js/modules/LegacyBridge.js
```

##### Step 2: Restore Imports in ES6Bootstrap.js
```bash
# Restore ES6Bootstrap.js to include bridge system imports
git checkout main -- js/modules/ES6Bootstrap.js
```

##### Step 3: Restore Imports in app.js
```bash
# Restore app.js to include bridge system imports
git checkout main -- js/modules/app.js
```

##### Step 4: Verify Restoration
```bash
# Run tests to verify functionality restored
npm test

# Check for console errors
npm start
```

#### If Specific Bridge System Causes Issues

##### Restore Individual Bridge System
```bash
# Restore specific bridge system
git checkout main -- js/modules/[BridgeSystemName].js

# Restore imports in dependent files
git checkout main -- js/modules/ES6Bootstrap.js
git checkout main -- js/modules/app.js
```

### Week 3: Legacy Dependency Elimination

#### If Legacy Function Call Replacement Causes Issues

##### Step 1: Identify Problematic Changes
```bash
# Check git status for modified files
git status

# Review specific changes
git diff js/modules/[problematic-file].js
```

##### Step 2: Restore Specific Function Calls
```bash
# Restore specific legacy function calls
git checkout HEAD~1 -- js/modules/[problematic-file].js

# Or restore specific sections
git checkout HEAD~1 -- js/modules/ActiveListManager.js
```

##### Step 3: Restore Legacy Global Access
```bash
# Restore legacy global access patterns
git checkout HEAD~1 -- js/modules/StateManager.js
git checkout HEAD~1 -- js/modules/SearchManager.js
```

#### If StateManager Changes Cause Issues

##### Step 1: Restore StateManager
```bash
# Restore StateManager to previous state
git checkout HEAD~1 -- js/modules/StateManager.js
```

##### Step 2: Restore Legacy Compatibility Layer
```bash
# Restore legacy compatibility layer
git checkout main -- js/modules/StateManager.js
```

### Week 4: Validation and Cleanup

#### If Final Validation Fails

##### Step 1: Identify Issues
```bash
# Run comprehensive tests
npm test

# Check for console errors
npm start

# Review recent changes
git log --oneline -10
```

##### Step 2: Restore to Last Working State
```bash
# Find last working commit
git log --oneline

# Restore to last working state
git checkout [last-working-commit-hash]

# Create new branch from working state
git checkout -b feature/controlled-aggressive-elimination-fixed
```

## Emergency Rollback Procedures

### Complete System Rollback

#### If System Becomes Unusable
```bash
# Complete rollback to main branch
git checkout main

# Remove migration branch
git branch -D feature/controlled-aggressive-elimination

# Verify system is working
npm test
npm start
```

#### If Database/State Issues
```bash
# Clear browser storage
# (Manual step - clear localStorage, sessionStorage, IndexedDB)

# Restart development server
npm start
```

### Partial Rollback

#### If Specific Features Break
```bash
# Restore specific modules
git checkout main -- js/modules/[module-name].js

# Restore specific tests
git checkout main -- tests/[test-name].js

# Re-run tests
npm test
```

## Verification Procedures

### After Each Rollback

#### Step 1: Run Test Suite
```bash
npm test
```

#### Step 2: Check Console Output
```bash
npm start
# Check browser console for errors
```

#### Step 3: Verify Core Functionality
- [ ] Map loads correctly
- [ ] Sidebar functions work
- [ ] Data loading works
- [ ] Search functionality works
- [ ] Active list updates work

#### Step 4: Performance Check
```bash
# Check bundle size
npm run build

# Check performance metrics
npm run test:performance
```

## Prevention Measures

### Before Each Phase

#### Step 1: Create Checkpoint
```bash
# Create checkpoint before each phase
git tag "checkpoint-week-[X]-start"
```

#### Step 2: Backup Current State
```bash
# Create backup branch
git checkout -b backup-week-[X]-start
git checkout feature/controlled-aggressive-elimination
```

#### Step 3: Document Changes
```bash
# Document what will be changed
echo "Week [X] changes:" >> MIGRATION_LOG.md
echo "- [ ] Change 1" >> MIGRATION_LOG.md
echo "- [ ] Change 2" >> MIGRATION_LOG.md
```

### During Each Phase

#### Step 1: Test After Each Change
```bash
# Run tests after each significant change
npm test
```

#### Step 2: Commit Frequently
```bash
# Commit after each working change
git add .
git commit -m "Week [X]: [Description of change]"
```

#### Step 3: Monitor Console
```bash
# Monitor console for errors
npm start
# Check browser console regularly
```

## Recovery Procedures

### If Rollback Fails

#### Step 1: Check Git Status
```bash
git status
git log --oneline -5
```

#### Step 2: Force Reset if Needed
```bash
# Force reset to main branch (DESTRUCTIVE)
git reset --hard main
git clean -fd
```

#### Step 3: Restore from Remote
```bash
# If local repository is corrupted
git fetch origin
git reset --hard origin/main
```

### If Tests Fail After Rollback

#### Step 1: Check Test Dependencies
```bash
# Reinstall dependencies
npm install

# Clear test cache
npm test -- --clearCache
```

#### Step 2: Check Test Configuration
```bash
# Verify Jest configuration
cat jest.config.js

# Check package.json test script
cat package.json | grep -A 5 "scripts"
```

## Contact Information

### If Rollback Procedures Fail
1. Document the issue in detail
2. Check git history for clues
3. Consider restoring from remote repository
4. Contact development team if needed

### Emergency Contacts
- **Primary**: Development team lead
- **Secondary**: System administrator
- **Emergency**: Project manager

## Notes

- Always test rollback procedures in a safe environment first
- Document any issues encountered during rollback
- Keep rollback procedures updated as system evolves
- Consider automated rollback scripts for critical systems
