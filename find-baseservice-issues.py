#!/usr/bin/env python3
"""
Find all modules that extend BaseService but don't inject StructuredLogger
"""

import os
import re
import glob

def find_baseservice_issues():
    """Find all modules with BaseService inheritance issues"""
    
    # Find all JS files in modules directory
    js_files = glob.glob('js/modules/*.js')
    
    issues = []
    
    for file_path in js_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Check if extends BaseService
            if 'extends BaseService' in content:
                # Check if StructuredLogger is injected
                if '@inject(TYPES.StructuredLogger)' not in content:
                    # Check if there's a constructor
                    constructor_match = re.search(r'constructor\s*\([^)]*\)\s*{', content)
                    if constructor_match:
                        issues.append({
                            'file': file_path,
                            'line': content[:constructor_match.start()].count('\n') + 1,
                            'constructor': constructor_match.group(0).strip()
                        })
                        
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
    
    return issues

def main():
    print("🔍 Finding BaseService inheritance issues...")
    
    issues = find_baseservice_issues()
    
    if not issues:
        print("✅ No BaseService inheritance issues found!")
        return
    
    print(f"\n❌ Found {len(issues)} modules with BaseService inheritance issues:")
    print("=" * 60)
    
    for i, issue in enumerate(issues, 1):
        print(f"\n{i}. {issue['file']}")
        print(f"   Line {issue['line']}: {issue['constructor']}")
    
    print(f"\n📋 Summary:")
    print(f"   Total issues: {len(issues)}")
    print(f"   All need StructuredLogger injection in constructor")
    print(f"   All need super(structuredLogger) call")

if __name__ == "__main__":
    main()


