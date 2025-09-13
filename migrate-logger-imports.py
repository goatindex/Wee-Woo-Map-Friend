#!/usr/bin/env python3
"""
DI Migration Script: Convert Direct Logger Imports to DI Injection

This script safely migrates modules from direct logger imports to DI injection pattern.
It handles the 30 partially migrated modules that have @injectable() decorators but still
use direct logger imports.

Usage: python migrate-logger-imports.py [--dry-run] [--backup]
"""

import os
import re
import shutil
import argparse
from pathlib import Path
from typing import List, Tuple, Dict

class DIMigrationScript:
    def __init__(self, modules_dir: str = "js/modules"):
        self.modules_dir = Path(modules_dir)
        self.backup_dir = Path("backup_modules")
        self.changes_made = []
        
    def find_partially_migrated_modules(self) -> List[Path]:
        """Find modules that have @injectable() but still import logger directly"""
        partially_migrated = []
        
        for js_file in self.modules_dir.glob("*.js"):
            if js_file.name in ["Types.js", "DependencyContainer.js", "ApplicationBootstrap.js"]:
                continue
                
            content = js_file.read_text(encoding='utf-8')
            
            # Check if module has @injectable() decorator
            has_injectable = "@injectable()" in content
            
            # Check if module imports logger directly
            has_direct_logger_import = re.search(r"import\s*{\s*logger\s*}\s*from\s*['\"]\.\/StructuredLogger\.js['\"]", content)
            
            if has_injectable and has_direct_logger_import:
                partially_migrated.append(js_file)
                
        return partially_migrated
    
    def analyze_module(self, file_path: Path) -> Dict:
        """Analyze a module to understand its current structure"""
        content = file_path.read_text(encoding='utf-8')
        
        analysis = {
            'file': file_path,
            'has_injectable': "@injectable()" in content,
            'has_direct_logger_import': bool(re.search(r"import\s*{\s*logger\s*}\s*from\s*['\"]\.\/StructuredLogger\.js['\"]", content)),
            'has_inversify_imports': "import { injectable, inject } from 'inversify'" in content,
            'has_types_import': "import { TYPES } from './Types.js'" in content,
            'constructor_pattern': None,
            'logger_usage_pattern': None,
            'singleton_export': None
        }
        
        # Find constructor pattern
        constructor_match = re.search(r"constructor\s*\([^)]*\)\s*{", content)
        if constructor_match:
            analysis['constructor_pattern'] = constructor_match.group(0)
        
        # Find logger usage pattern
        logger_usage = re.search(r"this\.logger\s*=\s*logger\.createChild", content)
        if logger_usage:
            analysis['logger_usage_pattern'] = logger_usage.group(0)
        
        # Find singleton export
        singleton_match = re.search(r"export\s+const\s+\w+\s*=\s*new\s+\w+\(\)", content)
        if singleton_match:
            analysis['singleton_export'] = singleton_match.group(0)
            
        return analysis
    
    def create_backup(self, file_path: Path) -> Path:
        """Create backup of file before modification"""
        if not self.backup_dir.exists():
            self.backup_dir.mkdir()
            
        backup_path = self.backup_dir / file_path.name
        shutil.copy2(file_path, backup_path)
        return backup_path
    
    def migrate_module(self, file_path: Path, dry_run: bool = False) -> bool:
        """Migrate a single module from direct logger import to DI injection"""
        print(f"\n🔄 Migrating {file_path.name}...")
        
        # Create backup
        if not dry_run:
            self.create_backup(file_path)
        
        # Read current content
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        
        # Step 1: Add missing imports if needed
        if "import { injectable, inject } from 'inversify'" not in content:
            # Find the last import statement
            import_pattern = r"(import\s+[^;]+;)\s*\n"
            imports = re.findall(import_pattern, content)
            if imports:
                last_import = imports[-1]
                new_import = "import { injectable, inject } from 'inversify';\nimport { TYPES } from './Types.js';\n"
                content = content.replace(last_import, last_import + "\n" + new_import)
            else:
                # Add at the top if no imports found
                content = "import { injectable, inject } from 'inversify';\nimport { TYPES } from './Types.js';\n\n" + content
        
        # Step 2: Remove direct logger import
        logger_import_pattern = r"import\s*{\s*logger\s*}\s*from\s*['\"]\.\/StructuredLogger\.js['\"];\s*\n"
        content = re.sub(logger_import_pattern, "", content)
        
        # Step 3: Update constructor to use DI injection
        # Find constructor and add logger parameter
        constructor_pattern = r"(constructor\s*\()([^)]*)(\)\s*{)"
        
        def update_constructor(match):
            params = match.group(2).strip()
            if params:
                # Add logger parameter
                new_params = f"{params},\n    @inject(TYPES.StructuredLogger) private logger"
            else:
                # No existing parameters
                new_params = "@inject(TYPES.StructuredLogger) private logger"
            
            return f"{match.group(1)}{new_params}{match.group(3)}"
        
        content = re.sub(constructor_pattern, update_constructor, content)
        
        # Step 4: Update logger usage pattern
        # Change this.logger = logger.createChild to this.moduleLogger = this.logger.createChild
        content = re.sub(
            r"this\.logger\s*=\s*logger\.createChild",
            "this.moduleLogger = this.logger.createChild",
            content
        )
        
        # Step 5: Replace all this.logger with this.moduleLogger
        content = re.sub(r"this\.logger\.", "this.moduleLogger.", content)
        
        # Step 6: Replace singleton export with legacy function
        singleton_pattern = r"export\s+const\s+(\w+)\s*=\s*new\s+(\w+)\(\);"
        
        def replace_singleton(match):
            var_name = match.group(1)
            class_name = match.group(2)
            return f"""// Legacy function stub - {class_name} is now instantiated via DI
export const {var_name} = () => {{
  throw new Error('Legacy function not available. Use DI container to get {class_name} instance.');
}};"""
        
        content = re.sub(singleton_pattern, replace_singleton, content)
        
        # Check if changes were made
        if content != original_content:
            if not dry_run:
                file_path.write_text(content, encoding='utf-8')
                print(f"✅ Successfully migrated {file_path.name}")
                self.changes_made.append(file_path.name)
            else:
                print(f"🔍 DRY RUN: Would migrate {file_path.name}")
            return True
        else:
            print(f"ℹ️  No changes needed for {file_path.name}")
            return False
    
    def validate_migration(self, file_path: Path) -> bool:
        """Validate that migration was successful"""
        content = file_path.read_text(encoding='utf-8')
        
        # Check that direct logger import is removed
        has_direct_import = bool(re.search(r"import\s*{\s*logger\s*}\s*from\s*['\"]\.\/StructuredLogger\.js['\"]", content))
        
        # Check that DI injection is present
        has_di_injection = "@inject(TYPES.StructuredLogger)" in content
        
        # Check that logger usage is updated
        has_old_logger_usage = "this.logger = logger.createChild" in content
        has_new_logger_usage = "this.moduleLogger = this.logger.createChild" in content
        
        return not has_direct_import and has_di_injection and not has_old_logger_usage and has_new_logger_usage
    
    def run_migration(self, dry_run: bool = False, create_backup: bool = True):
        """Run the complete migration process"""
        print("🚀 Starting DI Migration Script")
        print("=" * 50)
        
        # Find partially migrated modules
        partially_migrated = self.find_partially_migrated_modules()
        
        if not partially_migrated:
            print("✅ No partially migrated modules found!")
            return
        
        print(f"📋 Found {len(partially_migrated)} partially migrated modules:")
        for module in partially_migrated:
            print(f"  - {module.name}")
        
        print(f"\n{'🔍 DRY RUN MODE' if dry_run else '🔄 MIGRATION MODE'}")
        print("=" * 50)
        
        # Migrate each module
        success_count = 0
        for module in partially_migrated:
            try:
                if self.migrate_module(module, dry_run):
                    success_count += 1
            except Exception as e:
                print(f"❌ Error migrating {module.name}: {e}")
        
        print(f"\n📊 Migration Summary:")
        print(f"  - Modules processed: {len(partially_migrated)}")
        print(f"  - Successfully migrated: {success_count}")
        print(f"  - Failed: {len(partially_migrated) - success_count}")
        
        if not dry_run and self.changes_made:
            print(f"\n✅ Successfully migrated modules:")
            for module in self.changes_made:
                print(f"  - {module}")
            
            print(f"\n💾 Backups created in: {self.backup_dir}")
            print("🔧 Next steps:")
            print("  1. Run 'npm run build:js' to compile changes")
            print("  2. Test the application to ensure everything works")
            print("  3. If issues occur, restore from backup files")

def main():
    parser = argparse.ArgumentParser(description="Migrate modules from direct logger imports to DI injection")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be changed without making changes")
    parser.add_argument("--backup", action="store_true", help="Create backups before making changes")
    parser.add_argument("--modules-dir", default="js/modules", help="Directory containing modules to migrate")
    
    args = parser.parse_args()
    
    migrator = DIMigrationScript(args.modules_dir)
    migrator.run_migration(dry_run=args.dry_run, create_backup=args.backup)

if __name__ == "__main__":
    main()


