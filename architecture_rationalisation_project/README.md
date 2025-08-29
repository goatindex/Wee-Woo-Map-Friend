# Architecture Rationalisation Project

## Purpose

This folder contains all files related to the architectural analysis and modernization project for the WeeWoo Map Friend application.

## Contents

### 📋 Project Documentation

- **`architecture_rationalisation_project.md`** - Main project plan and progress tracking
- **`README.md`** - This file, explaining the project folder
- **`logging-removal-guide.md`** - Comprehensive guide for removing diagnostic logging and testing code
- **`test-results-log.md`** - Systematic tracking of all test results and findings
- **`performance-baselines.md`** - Performance benchmarks and measurement procedures
- **`error-pattern-analysis.md`** - Systematic error categorization and analysis
- **`architectural-decision-matrix.md`** - Data-driven framework for architectural decisions

### 🧪 Test Files

- **`test-source-system.html`** - Standalone test environment for source system diagnostics

### 🤖 Automated Testing

- **`automated-test-runner.js`** - Enhanced Node.js test runner with breakpoints and self-critic checks
- **`automated-test-runner.ps1`** - PowerShell alternative for Windows users
- **`package.json`** - Node.js dependencies and scripts
- **`AUTOMATED-TESTING-README.md`** - Basic testing guide
- **`ENHANCED-TESTING-GUIDE.md`** - Comprehensive guide for enhanced testing with breakpoints

### 🔍 Enhanced Source Files

The following source files have been enhanced with comprehensive logging for Phase 1A diagnostics:

#### FAB Framework Components

- `js/fab/BaseFAB.js` - Enhanced with BaseFABLogger
- `js/fab/FABManager.js` - Enhanced with FABManagerLogger
- `js/fab/DocsFAB.js` - Enhanced with registration logging
- `js/fab/SidebarToggleFAB.js` - Enhanced with registration logging

#### Core Application

- `js/bootstrap.js` - Enhanced with DiagnosticLogger and comprehensive execution tracking

## Project Status

- **Current Phase**: Phase 1A - Deep System Diagnostics
- **Status**: Implementation Complete, Ready for Testing
- **Next Step**: Execute source system tests and analyze results

## Usage

### Running Tests

1. Open `test-source-system.html` in a web browser
2. Use the test controls to systematically test the source system
3. Export logs for detailed analysis

### Reviewing Progress

- Check `architecture_rationalisation_project.md` for current status
- Review investigation log for findings and insights
- Track completed tasks and next steps

## Cleanup Notes

When the project is complete:

1. **Follow the logging removal guide** (`logging-removal-guide.md`) to systematically remove all diagnostic code
2. **Review enhanced source files** and decide which logging to keep/remove
3. **Archive or delete test files** (test-source-system.html)
4. **Update main project documentation** with final findings
5. **Remove this project folder** or archive it

### Important: Security & Performance

- **All diagnostic logging must be removed** before production deployment
- **Verbose logging can expose sensitive information** and impact performance
- **Use the removal guide** to ensure clean, secure production code

## File Locations

- **Project files**: This folder (`architecture_rationalisation_project/`)
- **Enhanced source files**: Original locations in `js/` folder
- **Main application**: `index.html` and related files in root

---

_Created: 2025-01-01_  
_Purpose: Architectural analysis and modernization planning_
