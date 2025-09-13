#!/usr/bin/env python3
"""
Find all modules with singleton creation that extends BaseService
"""

import os
import re
import glob

def find_singleton_issues():
    """Find all modules with singleton creation issues"""
    
    # Find all JS files in modules directory
    js_files = glob.glob('js/modules/*.js')
    
    issues = []
    
    for file_path in js_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Check if extends BaseService
            if 'extends BaseService' in content:
                # Check for singleton creation patterns
                singleton_patterns = [
                    r'export\s+const\s+\w+\s*=\s*new\s+\w+\([^)]*\)',
                    r'const\s+\w+\s*=\s*new\s+\w+\([^)]*\)',
                    r'export\s*{\s*\w+\s*}\s*;'
                ]
                
                for pattern in singleton_patterns:
                    matches = re.findall(pattern, content)
                    if matches:
                        # Check if it's not already a legacy function
                        if 'Legacy function called' not in content:
                            issues.append({
                                'file': file_path,
                                'pattern': pattern,
                                'matches': matches
                            })
                            break
                            
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
    
    return issues

if __name__ == "__main__":
    issues = find_singleton_issues()
    
    print(f"Found {len(issues)} modules with singleton creation issues:")
    print("=" * 60)
    
    for issue in issues:
        print(f"\n📁 File: {issue['file']}")
        print(f"🔍 Pattern: {issue['pattern']}")
        print(f"📝 Matches: {issue['matches']}")
        print("-" * 40)


