#!/usr/bin/env python3
"""
DI Migration Issue Detection Script

This script scans the codebase to find modules with incomplete DI migration issues:
1. Modules extending BaseService but not properly injecting StructuredLogger
2. Modules using legacy function imports instead of DI
3. Modules with mock loggers instead of proper DI
4. Modules with missing @inject decorators
5. Modules with incorrect constructor patterns

Usage: python find-di-migration-issues.py
"""

import os
import re
import json
from pathlib import Path

class DIMigrationScanner:
    def __init__(self, base_path="js/modules"):
        self.base_path = Path(base_path)
        self.issues = {
            'incomplete_di_constructors': [],
            'legacy_function_imports': [],
            'mock_logger_usage': [],
            'missing_inject_decorators': [],
            'incorrect_super_calls': [],
            'legacy_singleton_exports': []
        }
    
    def scan_file(self, file_path):
        """Scan a single file for DI migration issues"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            filename = file_path.name
            relative_path = file_path.relative_to(self.base_path)
            
            # Check for various DI migration issues
            self._check_incomplete_di_constructor(content, filename, relative_path)
            self._check_legacy_function_imports(content, filename, relative_path)
            self._check_mock_logger_usage(content, filename, relative_path)
            self._check_missing_inject_decorators(content, filename, relative_path)
            self._check_incorrect_super_calls(content, filename, relative_path)
            self._check_legacy_singleton_exports(content, filename, relative_path)
            
        except Exception as e:
            print(f"Error scanning {file_path}: {e}")
    
    def _check_incomplete_di_constructor(self, content, filename, relative_path):
        """Check for modules extending BaseService but not properly injecting StructuredLogger"""
        if 'extends BaseService' in content:
            # Check if constructor has proper DI injection
            constructor_match = re.search(r'constructor\s*\([^)]*\)\s*{', content, re.DOTALL)
            if constructor_match:
                constructor_content = constructor_match.group(0)
                
                # Check for missing @inject decorators
                if '@inject(TYPES.StructuredLogger)' not in constructor_content:
                    self.issues['incomplete_di_constructors'].append({
                        'file': str(relative_path),
                        'issue': 'Missing StructuredLogger injection',
                        'line': self._get_line_number(content, constructor_match.start()),
                        'severity': 'high'
                    })
                
                # Check for missing super() call
                if 'super(' not in constructor_content:
                    self.issues['incomplete_di_constructors'].append({
                        'file': str(relative_path),
                        'issue': 'Missing super() call',
                        'line': self._get_line_number(content, constructor_match.start()),
                        'severity': 'high'
                    })
    
    def _check_legacy_function_imports(self, content, filename, relative_path):
        """Check for legacy function imports instead of DI"""
        legacy_imports = [
            r'import\s*{\s*stateManager\s*}\s*from\s*[\'"]\./StateManager\.js[\'"]',
            r'import\s*{\s*globalEventBus\s*}\s*from\s*[\'"]\./EventBus\.js[\'"]',
            r'import\s*{\s*configurationManager\s*}\s*from\s*[\'"]\./ConfigurationManager\.js[\'"]',
            r'import\s*{\s*searchManager\s*}\s*from\s*[\'"]\./SearchManager\.js[\'"]',
            r'import\s*{\s*collapsibleManager\s*}\s*from\s*[\'"]\./CollapsibleManager\.js[\'"]'
        ]
        
        for pattern in legacy_imports:
            matches = re.finditer(pattern, content)
            for match in matches:
                self.issues['legacy_function_imports'].append({
                    'file': str(relative_path),
                    'issue': f'Legacy function import: {match.group(0).strip()}',
                    'line': self._get_line_number(content, match.start()),
                    'severity': 'high'
                })
    
    def _check_mock_logger_usage(self, content, filename, relative_path):
        """Check for mock logger usage instead of proper DI"""
        mock_logger_patterns = [
            r'const\s+logger\s*=\s*{',
            r'// Temporarily use a mock logger',
            r'this\.logger\s*=\s*logger\.createChild',
            r'logger\.createChild\s*\(\s*{\s*module:'
        ]
        
        for pattern in mock_logger_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                self.issues['mock_logger_usage'].append({
                    'file': str(relative_path),
                    'issue': f'Mock logger usage: {match.group(0).strip()}',
                    'line': self._get_line_number(content, match.start()),
                    'severity': 'medium'
                })
    
    def _check_missing_inject_decorators(self, content, filename, relative_path):
        """Check for missing @inject decorators in constructors"""
        if '@injectable()' in content and 'constructor(' in content:
            # Find constructor parameters
            constructor_match = re.search(r'constructor\s*\(([^)]*)\)', content, re.DOTALL)
            if constructor_match:
                params = constructor_match.group(1).strip()
                if params and '@inject(' not in params:
                    self.issues['missing_inject_decorators'].append({
                        'file': str(relative_path),
                        'issue': 'Constructor parameters missing @inject decorators',
                        'line': self._get_line_number(content, constructor_match.start()),
                        'severity': 'high'
                    })
    
    def _check_incorrect_super_calls(self, content, filename, relative_path):
        """Check for incorrect super() calls"""
        if 'extends BaseService' in content:
            super_calls = re.finditer(r'super\s*\([^)]*\)', content)
            for match in super_calls:
                super_content = match.group(0)
                if 'structuredLogger' not in super_content and 'logger' not in super_content:
                    self.issues['incorrect_super_calls'].append({
                        'file': str(relative_path),
                        'issue': f'Incorrect super() call: {super_content}',
                        'line': self._get_line_number(content, match.start()),
                        'severity': 'high'
                    })
    
    def _check_legacy_singleton_exports(self, content, filename, relative_path):
        """Check for legacy singleton exports that should be legacy functions"""
        singleton_patterns = [
            r'export\s+const\s+\w+\s*=\s*new\s+\w+\(\)',
            r'export\s+const\s+\w+\s*=\s*new\s+\w+\([^)]*\)'
        ]
        
        for pattern in singleton_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                self.issues['legacy_singleton_exports'].append({
                    'file': str(relative_path),
                    'issue': f'Legacy singleton export: {match.group(0).strip()}',
                    'line': self._get_line_number(content, match.start()),
                    'severity': 'medium'
                })
    
    def _get_line_number(self, content, position):
        """Get line number for a given position in content"""
        return content[:position].count('\n') + 1
    
    def scan_all_files(self):
        """Scan all JavaScript files in the modules directory"""
        if not self.base_path.exists():
            print(f"Directory {self.base_path} does not exist")
            return
        
        js_files = list(self.base_path.glob("*.js"))
        print(f"Scanning {len(js_files)} JavaScript files...")
        
        for file_path in js_files:
            self.scan_file(file_path)
    
    def generate_report(self):
        """Generate a comprehensive report of all issues found"""
        total_issues = sum(len(issues) for issues in self.issues.values())
        
        print("\n" + "="*80)
        print("DI MIGRATION ISSUES REPORT")
        print("="*80)
        print(f"Total issues found: {total_issues}")
        print()
        
        for category, issues in self.issues.items():
            if issues:
                print(f"\n{category.upper().replace('_', ' ')} ({len(issues)} issues):")
                print("-" * 50)
                for issue in issues:
                    print(f"  📁 {issue['file']}:{issue['line']}")
                    print(f"     🔍 {issue['issue']}")
                    print(f"     ⚠️  Severity: {issue['severity']}")
                    print()
        
        # Generate summary by file
        print("\n" + "="*80)
        print("SUMMARY BY FILE")
        print("="*80)
        
        file_issues = {}
        for category, issues in self.issues.items():
            for issue in issues:
                file_path = issue['file']
                if file_path not in file_issues:
                    file_issues[file_path] = []
                file_issues[file_path].append(issue)
        
        for file_path, issues in sorted(file_issues.items()):
            high_severity = len([i for i in issues if i['severity'] == 'high'])
            medium_severity = len([i for i in issues if i['severity'] == 'medium'])
            print(f"📁 {file_path}: {len(issues)} issues ({high_severity} high, {medium_severity} medium)")
        
        # Generate JSON report
        self._generate_json_report()
    
    def _generate_json_report(self):
        """Generate a JSON report for programmatic use"""
        report = {
            'summary': {
                'total_issues': sum(len(issues) for issues in self.issues.values()),
                'high_severity': sum(len([i for i in issues if i['severity'] == 'high']) for issues in self.issues.values()),
                'medium_severity': sum(len([i for i in issues if i['severity'] == 'medium']) for issues in self.issues.values())
            },
            'issues_by_category': self.issues,
            'files_with_issues': {}
        }
        
        # Group issues by file
        for category, issues in self.issues.items():
            for issue in issues:
                file_path = issue['file']
                if file_path not in report['files_with_issues']:
                    report['files_with_issues'][file_path] = []
                report['files_with_issues'][file_path].append({
                    'category': category,
                    'issue': issue['issue'],
                    'line': issue['line'],
                    'severity': issue['severity']
                })
        
        with open('di-migration-issues-report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📄 JSON report saved to: di-migration-issues-report.json")

def main():
    scanner = DIMigrationScanner()
    scanner.scan_all_files()
    scanner.generate_report()

if __name__ == "__main__":
    main()


