#!/usr/bin/env python3
"""
Quick Fix Script: Replace Direct Logger Imports with Mock Loggers

This script quickly fixes the immediate issue by replacing direct logger imports
with mock loggers in the 30 partially migrated modules. This is a temporary fix
to get the application working while we complete the full DI migration.

Usage: python fix-logger-imports.py [--dry-run]
"""

import os
import re
import shutil
from pathlib import Path

def create_backup(file_path):
    """Create backup of file"""
    backup_dir = Path("backup_modules")
    if not backup_dir.exists():
        backup_dir.mkdir()
    
    backup_path = backup_dir / file_path.name
    shutil.copy2(file_path, backup_path)
    return backup_path

def fix_logger_import(file_path, dry_run=False):
    """Fix logger import in a single file"""
    print(f"🔧 Fixing {file_path.name}...")
    
    # Create backup
    if not dry_run:
        create_backup(file_path)
    
    # Read file
    content = file_path.read_text(encoding='utf-8')
    original_content = content
    
    # Replace direct logger import with mock logger
    logger_import_pattern = r"import\s*{\s*logger\s*}\s*from\s*['\"]\.\/StructuredLogger\.js['\"];"
    
    mock_logger = '''// Temporarily use a mock logger to avoid DI issues during migration
const logger = {
  createChild: () => ({
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    createChild: () => ({
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    })
  })
};'''
    
    # Replace the import
    new_content = re.sub(logger_import_pattern, mock_logger, content)
    
    # Check if changes were made
    if new_content != original_content:
        if not dry_run:
            file_path.write_text(new_content, encoding='utf-8')
            print(f"✅ Fixed {file_path.name}")
        else:
            print(f"🔍 DRY RUN: Would fix {file_path.name}")
        return True
    else:
        print(f"ℹ️  No changes needed for {file_path.name}")
        return False

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Fix direct logger imports with mock loggers")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be changed without making changes")
    
    args = parser.parse_args()
    
    modules_dir = Path("js/modules")
    
    # Find files with direct logger imports
    files_to_fix = []
    for js_file in modules_dir.glob("*.js"):
        if js_file.name in ["Types.js", "DependencyContainer.js", "ApplicationBootstrap.js", "StructuredLogger.js"]:
            continue
            
        content = js_file.read_text(encoding='utf-8')
        if re.search(r"import\s*{\s*logger\s*}\s*from\s*['\"]\.\/StructuredLogger\.js['\"]", content):
            files_to_fix.append(js_file)
    
    print(f"🚀 Found {len(files_to_fix)} files with direct logger imports")
    print(f"{'🔍 DRY RUN MODE' if args.dry_run else '🔄 FIXING MODE'}")
    print("=" * 50)
    
    success_count = 0
    for file_path in files_to_fix:
        try:
            if fix_logger_import(file_path, args.dry_run):
                success_count += 1
        except Exception as e:
            print(f"❌ Error fixing {file_path.name}: {e}")
    
    print(f"\n📊 Summary:")
    print(f"  - Files processed: {len(files_to_fix)}")
    print(f"  - Successfully fixed: {success_count}")
    print(f"  - Failed: {len(files_to_fix) - success_count}")
    
    if not args.dry_run and success_count > 0:
        print(f"\n✅ Next steps:")
        print("  1. Run 'npm run build:js' to compile changes")
        print("  2. Test the application")
        print("  3. If working, consider running the full DI migration script")

if __name__ == "__main__":
    main()


