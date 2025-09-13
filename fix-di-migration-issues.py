#!/usr/bin/env python3
"""
DI Migration Fix Script

This script programmatically fixes two categories of DI migration issues:
1. Legacy Singleton Exports - Replace with error-throwing functions
2. Mock Logger Usage - Remove mock loggers and fix logger references

Usage: python fix-di-migration-issues.py
"""

import os
import re
import shutil
from pathlib import Path
from datetime import datetime

class DIMigrationFixer:
    def __init__(self, base_path="js/modules"):
        self.base_path = Path(base_path)
        self.backup_path = Path("backup_before_di_fixes")
        self.fixes_applied = {
            'legacy_singleton_exports': 0,
            'mock_logger_usage': 0,
            'files_modified': []
        }
        
    def create_backup(self):
        """Create backup of original files before making changes"""
        if self.backup_path.exists():
            shutil.rmtree(self.backup_path)
        
        shutil.copytree(self.base_path, self.backup_path)
        print(f"✅ Backup created at: {self.backup_path}")
    
    def fix_legacy_singleton_exports(self, content, file_path):
        """Fix legacy singleton exports by replacing with error-throwing functions"""
        fixes = 0
        
        # Pattern 1: export const name = new Class()
        pattern1 = r'export\s+const\s+(\w+)\s*=\s*new\s+(\w+)\s*\(\s*\)\s*;'
        def replace_singleton1(match):
            nonlocal fixes
            name = match.group(1)
            class_name = match.group(2)
            fixes += 1
            return f'export const {name} = () => {{\n  console.warn(\'{name}: Legacy function called. Use DI container to get {class_name} instance.\');\n  throw new Error(\'Legacy function not available. Use DI container to get {class_name} instance.\');\n}};'
        
        content = re.sub(pattern1, replace_singleton1, content)
        
        # Pattern 2: export const name = new Class(params)
        pattern2 = r'export\s+const\s+(\w+)\s*=\s*new\s+(\w+)\s*\([^)]*\)\s*;'
        def replace_singleton2(match):
            nonlocal fixes
            name = match.group(1)
            class_name = match.group(2)
            fixes += 1
            return f'export const {name} = () => {{\n  console.warn(\'{name}: Legacy function called. Use DI container to get {class_name} instance.\');\n  throw new Error(\'Legacy function not available. Use DI container to get {class_name} instance.\');\n}};'
        
        content = re.sub(pattern2, replace_singleton2, content)
        
        return content, fixes
    
    def fix_mock_logger_usage(self, content, file_path):
        """Fix mock logger usage by removing mock loggers and fixing references"""
        fixes = 0
        
        # Remove mock logger declarations
        mock_logger_patterns = [
            # Pattern 1: const logger = { createChild: () => ({...}) }
            r'const\s+logger\s*=\s*{\s*createChild:\s*\(\)\s*=>\s*\(\{\s*[^}]*\}\s*\)\s*\}\s*;',
            # Pattern 2: // Temporarily use a mock logger
            r'//\s*Temporarily use a mock logger\s*\n',
            # Pattern 3: Multi-line mock logger
            r'const\s+logger\s*=\s*{\s*\n\s*createChild:\s*\(\)\s*=>\s*\(\{\s*\n\s*[^}]*\n\s*\}\s*\)\s*\n\s*\}\s*;'
        ]
        
        for pattern in mock_logger_patterns:
            matches = re.findall(pattern, content, re.DOTALL)
            if matches:
                content = re.sub(pattern, '', content, flags=re.DOTALL)
                fixes += len(matches)
        
        # Fix logger references
        # Pattern: this.logger = logger.createChild({ module: 'ModuleName' })
        logger_ref_pattern = r'this\.logger\s*=\s*logger\.createChild\s*\(\s*\{\s*module:\s*[\'"](\w+)[\'"]\s*\}\s*\)\s*;'
        def replace_logger_ref(match):
            nonlocal fixes
            module_name = match.group(1)
            fixes += 1
            return f'// Logger will be set by BaseService constructor'
        
        content = re.sub(logger_ref_pattern, replace_logger_ref, content)
        
        # Remove standalone logger.createChild calls
        standalone_logger_pattern = r'logger\.createChild\s*\(\s*\{\s*module:\s*[\'"]\w+[\'"]\s*\}\s*\)\s*;'
        content = re.sub(standalone_logger_pattern, '', content)
        
        return content, fixes
    
    def fix_file(self, file_path):
        """Fix a single file for DI migration issues"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            content = original_content
            file_fixes = {
                'legacy_singleton_exports': 0,
                'mock_logger_usage': 0
            }
            
            # Fix legacy singleton exports
            content, singleton_fixes = self.fix_legacy_singleton_exports(content, file_path)
            file_fixes['legacy_singleton_exports'] = singleton_fixes
            
            # Fix mock logger usage
            content, logger_fixes = self.fix_mock_logger_usage(content, file_path)
            file_fixes['mock_logger_usage'] = logger_fixes
            
            # Only write if changes were made
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                self.fixes_applied['legacy_singleton_exports'] += file_fixes['legacy_singleton_exports']
                self.fixes_applied['mock_logger_usage'] += file_fixes['mock_logger_usage']
                self.fixes_applied['files_modified'].append({
                    'file': str(file_path.relative_to(self.base_path)),
                    'legacy_singleton_exports': file_fixes['legacy_singleton_exports'],
                    'mock_logger_usage': file_fixes['mock_logger_usage']
                })
                
                return True
            
            return False
            
        except Exception as e:
            print(f"❌ Error fixing {file_path}: {e}")
            return False
    
    def fix_all_files(self):
        """Fix all JavaScript files in the modules directory"""
        if not self.base_path.exists():
            print(f"❌ Directory {self.base_path} does not exist")
            return
        
        # Create backup first
        self.create_backup()
        
        js_files = list(self.base_path.glob("*.js"))
        print(f"🔧 Fixing {len(js_files)} JavaScript files...")
        
        files_modified = 0
        for file_path in js_files:
            if self.fix_file(file_path):
                files_modified += 1
                print(f"✅ Fixed: {file_path.name}")
        
        print(f"\n🎯 Summary:")
        print(f"   Files modified: {files_modified}")
        print(f"   Legacy singleton exports fixed: {self.fixes_applied['legacy_singleton_exports']}")
        print(f"   Mock logger usage fixed: {self.fixes_applied['mock_logger_usage']}")
        
        return files_modified > 0
    
    def generate_report(self):
        """Generate a detailed report of fixes applied"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        report = f"""
DI Migration Fix Report
======================
Timestamp: {timestamp}
Backup Location: {self.backup_path}

Summary:
--------
Files Modified: {len(self.fixes_applied['files_modified'])}
Legacy Singleton Exports Fixed: {self.fixes_applied['legacy_singleton_exports']}
Mock Logger Usage Fixed: {self.fixes_applied['mock_logger_usage']}

Files Modified:
--------------
"""
        
        for file_info in self.fixes_applied['files_modified']:
            report += f"📁 {file_info['file']}:\n"
            report += f"   - Legacy singleton exports: {file_info['legacy_singleton_exports']}\n"
            report += f"   - Mock logger usage: {file_info['mock_logger_usage']}\n"
        
        report += f"""
Next Steps:
-----------
1. Run 'npm run build:js' to compile changes
2. Run tests to verify fixes work correctly
3. If issues arise, restore from backup: {self.backup_path}
4. Continue with remaining DI migration issues

Remaining Issues to Fix:
------------------------
- Legacy Function Imports: 24 issues (Medium Risk)
- Incorrect Super Calls: 7 issues (Medium Risk)  
- Missing Inject Decorators: 8 issues (High Risk)
- Incomplete DI Constructors: 2 issues (Very High Risk)
"""
        
        with open('di-migration-fix-report.txt', 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n📄 Detailed report saved to: di-migration-fix-report.txt")
        return report

def main():
    print("🚀 Starting DI Migration Fix Script")
    print("=" * 50)
    
    fixer = DIMigrationFixer()
    
    if fixer.fix_all_files():
        print("\n✅ DI Migration fixes completed successfully!")
        fixer.generate_report()
    else:
        print("\n⚠️  No files were modified. All files may already be fixed or no issues found.")

if __name__ == "__main__":
    main()
