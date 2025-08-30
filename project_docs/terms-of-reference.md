# Terms of Reference

## Overview

This document establishes standardized terminology and vocabulary for the WeeWoo Map Friend project. Consistent terminology is essential for clear communication between developers, AI assistants, and stakeholders.

## Core System Components

### **AppBootstrap** ⭐ **PRIMARY NAME**
- **Definition**: The core initialization engine responsible for orchestrating application startup
- **Usage**: Always use "AppBootstrap" when referring to the core initialization system
- **Synonyms**: ❌ "bootstrap system", ❌ "initialization system", ❌ "startup system"
- **Examples**: 
  - ✅ "AppBootstrap handles the initialization sequence"
  - ✅ "AppBootstrap.init() must be called once"
  - ❌ "The bootstrap system initializes components"

### **PolygonLoader**
- **Definition**: The data loading system responsible for fetching and processing GeoJSON polygon data
- **Usage**: Use "PolygonLoader" when referring to the data loading functionality
- **Synonyms**: ❌ "data loading system", ❌ "GeoJSON loader", ❌ "feature loader"
- **Examples**:
  - ✅ "PolygonLoader processes SES response areas"
  - ✅ "PolygonLoader handles coordinate conversion"
  - ❌ "The data loading system processes features"

### **Collapsible System**
- **Definition**: The UI component system that manages expandable/collapsible sidebar sections
- **Usage**: Use "Collapsible System" when referring to the sidebar section behavior
- **Synonyms**: ❌ "sidebar system", ❌ "expandable system", ❌ "accordion system"
- **Examples**:
  - ✅ "The Collapsible System must be initialized before data loading"
  - ✅ "setupCollapsible configures the Collapsible System"
  - ❌ "The sidebar system handles expansion"

### **ActiveListManager**
- **Definition**: The component responsible for managing the "All Active" sidebar section
- **Usage**: Use "ActiveListManager" when referring to active list functionality
- **Synonyms**: ❌ "active list system", ❌ "active items manager", ❌ "selection manager"
- **Examples**:
  - ✅ "ActiveListManager updates the active items display"
  - ✅ "ActiveListManager extends ComponentBase"
  - ❌ "The active list system manages selections"

## Documentation Structure

### **in_app_docs/** ⭐ **PRIMARY NAME**
- **Definition**: Documentation intended for end users of the application
- **Content**: User guides, feature documentation, troubleshooting for users
- **Audience**: End users, general public, application consumers
- **Synonyms**: ❌ "docs", ❌ "user_docs", ❌ "app_docs"
- **Examples**:
  - ✅ "User guides are stored in in_app_docs/"
  - ✅ "in_app_docs contains feature documentation"
  - ❌ "User guides are in docs/"

### **project_docs/**
- **Definition**: Documentation intended for developers, architects, and project stakeholders
- **Content**: Architecture, development guides, project management, technical specifications
- **Audience**: Developers, architects, project managers, contributors
- **Synonyms**: ❌ "dev_docs", ❌ "technical_docs", ❌ "architecture_docs"
- **Examples**:
  - ✅ "Architecture documentation is in project_docs/"
  - ✅ "project_docs contains development guides"
  - ❌ "Technical docs are in dev_docs/"

## Testing Framework

### **4-Stage Testing Evolution**
- **Definition**: The progressive testing strategy from mock-based to end-to-end testing
- **Stages**: 
  1. Phase 1: Mock-based tests for rapid development
  2. Phase 2: Real-code tests for quality assurance
  3. Phase 3: Integration tests for system validation
  4. Phase 4: End-to-end tests for user experience validation
- **Usage**: Always reference the complete "4-Stage Testing Evolution"
- **Synonyms**: ❌ "testing phases", ❌ "test stages", ❌ "testing approach"

### **E2E Testing**
- **Definition**: End-to-end testing using Playwright framework
- **Usage**: Use "E2E Testing" or "End-to-End Testing" (not "e2e testing")
- **Synonyms**: ❌ "e2e testing", ❌ "end to end testing", ❌ "playwright testing"
- **Examples**:
  - ✅ "E2E Testing validates the complete user journey"
  - ✅ "End-to-End Testing uses Playwright framework"
  - ❌ "e2e testing covers user workflows"

## Performance Terminology

### **Performance Baselines**
- **Definition**: Established performance measurements and targets for system components
- **Usage**: Use "Performance Baselines" when referring to performance standards
- **Synonyms**: ❌ "performance targets", ❌ "performance metrics", ❌ "performance goals"
- **Examples**:
  - ✅ "Performance Baselines establish 2-second initialization target"
  - ✅ "Performance Baselines are documented in templates/"
  - ❌ "Performance targets are set at 2 seconds"

### **Performance Regression**
- **Definition**: A degradation in performance from established baselines
- **Usage**: Use "Performance Regression" when referring to performance degradation
- **Synonyms**: ❌ "performance degradation", ❌ "performance decline", ❌ "performance drop"
- **Examples**:
  - ✅ "Performance Regression detection prevents degradation"
  - ✅ "Automated testing detects Performance Regression"
  - ❌ "Performance degradation is monitored"

## Error Handling

### **Graceful Degradation**
- **Definition**: System continues functioning with reduced capabilities when errors occur
- **Usage**: Use "Graceful Degradation" when referring to error recovery strategies
- **Synonyms**: ❌ "error recovery", ❌ "fallback behavior", ❌ "error handling"
- **Examples**:
  - ✅ "Graceful Degradation ensures system stability"
  - ✅ "The system implements Graceful Degradation"
  - ❌ "Error recovery maintains functionality"

### **Error Boundaries**
- **Definition**: Components that catch and handle errors without crashing the entire system
- **Usage**: Use "Error Boundaries" when referring to error isolation
- **Synonyms**: ❌ "error isolation", ❌ "error containment", ❌ "error handling"
- **Examples**:
  - ✅ "Error Boundaries prevent cascading failures"
  - ✅ "Components implement Error Boundaries"
  - ❌ "Error isolation prevents crashes"

## Architecture Patterns

### **Component-Based Architecture**
- **Definition**: Architecture where all UI components extend ComponentBase for consistent behavior
- **Usage**: Use "Component-Based Architecture" when referring to the component system
- **Synonyms**: ❌ "component architecture", ❌ "component system", ❌ "modular architecture"
- **Examples**:
  - ✅ "Component-Based Architecture ensures consistency"
  - ✅ "The system uses Component-Based Architecture"
  - ❌ "Component architecture provides consistency"

### **Event-Driven Communication**
- **Definition**: Component communication through publish/subscribe event patterns
- **Usage**: Use "Event-Driven Communication" when referring to component interaction
- **Synonyms**: ❌ "event system", ❌ "event handling", ❌ "component communication"
- **Examples**:
  - ✅ "Event-Driven Communication enables loose coupling"
  - ✅ "Components use Event-Driven Communication"
  - ❌ "The event system enables communication"

## File and Directory Naming

### **kebab-case**
- **Definition**: File naming convention using lowercase letters and hyphens
- **Usage**: Always use kebab-case for file and directory names
- **Examples**:
  - ✅ "app-bootstrap.md", "data-loading.md", "performance-baselines.md"
  - ❌ "appBootstrap.md", "data_loading.md", "performanceBaselines.md"

### **Descriptive Names**
- **Definition**: File names that clearly indicate content and purpose
- **Usage**: Use descriptive names that explain the file's purpose
- **Examples**:
  - ✅ "e2e-troubleshooting-guide.md", "testing-completion-summary.md"
  - ❌ "guide.md", "summary.md", "troubleshooting.md"

## Code Examples

### **JavaScript Code Blocks**
- **Definition**: Code examples formatted with proper syntax highlighting
- **Usage**: Always use ```javascript for JavaScript code blocks
- **Examples**:
  ```javascript
  // Correct formatting
  window.setupCollapsible = function(headerId, listId) {
    // Implementation
  };
  ```

### **Real-World Examples**
- **Definition**: Code examples that show actual implementation patterns
- **Usage**: Prefer real-world examples over conceptual examples
- **Examples**:
  - ✅ "Actual implementation from js/ui/collapsible.js"
  - ✅ "Code from the working system"
  - ❌ "Example implementation", "Sample code"

## Cross-References

### **Documentation Links**
- **Definition**: Links between related documentation sections
- **Usage**: Always use relative paths with descriptive link text
- **Examples**:
  - ✅ "[AppBootstrap System](app-bootstrap.md) - Application initialization"
  - ✅ "[Performance Baselines](../templates/performance-baselines.md)"
  - ❌ "[here](app-bootstrap.md)", "[link](../templates/performance-baselines.md)"

### **Navigation Patterns**
- **Definition**: Consistent navigation between related documents
- **Usage**: Use "Related Documentation" sections at the end of documents
- **Examples**:
  - ✅ "## Related Documentation" section with relevant links
  - ✅ "Quick Navigation" section for easy access
  - ❌ Inline links scattered throughout content

## Maintenance and Updates

### **Regular Reviews**
- **Definition**: Scheduled review of terminology consistency
- **Frequency**: Monthly terminology review, quarterly comprehensive review
- **Process**: Check for new terms, validate existing terms, update as needed

### **Version Control**
- **Definition**: Track changes to terminology and definitions
- **Process**: Document changes in commit messages, update this document
- **Examples**:
  - ✅ "Updated AppBootstrap terminology for consistency"
  - ✅ "Added new component naming conventions"
  - ❌ "Fixed typos", "Updated docs"

## Compliance and Enforcement

### **Required Usage**
- **Definition**: Terms that must be used consistently across all documentation
- **Enforcement**: All new documentation must follow these conventions
- **Review**: Documentation reviews include terminology compliance checks

### **Prohibited Terms**
- **Definition**: Terms that should not be used due to ambiguity or inconsistency
- **Examples**: 
  - ❌ "docs" (use "in_app_docs")
  - ❌ "bootstrap system" (use "AppBootstrap")
  - ❌ "data loading system" (use "PolygonLoader")

---

**This document serves as the authoritative reference for all terminology used in WeeWoo Map Friend documentation. All contributors must follow these conventions to maintain consistency and clarity.**
