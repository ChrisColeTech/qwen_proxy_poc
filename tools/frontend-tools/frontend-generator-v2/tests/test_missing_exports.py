#!/usr/bin/env python3
"""
Test case for missing export detection and fixing.

This test reproduces the issue where:
1. A file declares a variable/function that should be exported
2. Another file tries to import that variable/function 
3. The import fails because the variable is not exported
4. The barrel generator should detect this and add the missing export
"""

import os
import tempfile
import shutil
from pathlib import Path
import subprocess

def test_missing_exports_detection():
    """Test that the barrel generator detects and fixes missing exports"""
    
    # Create temporary test structure
    with tempfile.TemporaryDirectory() as temp_dir:
        test_root = Path(temp_dir) / "test_project"
        test_root.mkdir(parents=True)
        
        # Create src directory structure
        src_dir = test_root / "src"
        components_dir = src_dir / "components" / "core"
        hooks_dir = src_dir / "hooks" / "core" 
        components_dir.mkdir(parents=True)
        hooks_dir.mkdir(parents=True)
        
        # Create ThemeSwitcher.tsx with missing export
        theme_switcher_content = '''import { Settings } from 'lucide-react'

export type BaseTheme = 'default' | 'onyx' | 'sage'

export interface BaseThemeConfig {
  id: BaseTheme
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

// This variable is declared but NOT exported - causing the error
const baseThemes: BaseThemeConfig[] = [
  {
    id: 'default',
    name: 'Default', 
    description: 'Classic theme',
    icon: Settings
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Dark theme', 
    icon: Settings
  }
]

export default function ThemeSwitcher() {
  return <div>Theme Switcher</div>
}
'''
        
        # Create hook that tries to import baseThemes
        hook_content = '''import { useState, useMemo } from "react";
import { baseThemes, type BaseThemeConfig } from "../../components/core/ThemeSwitcher";

export function useThemePagination() {
  const [visibleThemeCount, setVisibleThemeCount] = useState<number>(5);
  
  const orderedThemes = useMemo(() => {
    return baseThemes.slice(0, visibleThemeCount);
  }, [visibleThemeCount]);

  return {
    visibleThemes: orderedThemes,
    hasMoreThemes: visibleThemeCount < baseThemes.length
  };
}
'''
        
        # Write test files
        (components_dir / "ThemeSwitcher.tsx").write_text(theme_switcher_content)
        (hooks_dir / "useThemePagination.ts").write_text(hook_content)
        
        # Copy the barrel generator to test directory
        generator_source = Path("/Users/chris/Projects/llm-api-vault-v2/tools/frontend-tools/frontend-generator-v2/core/advanced_barrel_generator.py")
        generator_dest = test_root / "advanced_barrel_generator.py"
        shutil.copy2(generator_source, generator_dest)
        
        # Run TypeScript check to confirm error exists
        print("=== Testing missing export detection ===")
        print(f"Test structure created at: {test_root}")
        
        # Import and run the barrel generator
        import sys
        sys.path.insert(0, str(test_root))
        
        try:
            from advanced_barrel_generator import AdvancedBarrelGenerator
            
            # Initialize barrel generator
            barrel_gen = AdvancedBarrelGenerator(src_dir)
            
            # This should detect the missing export and fix it
            barrel_gen._detect_and_fix_missing_exports()
            
            # Check if baseThemes was added as an export
            theme_switcher_fixed = (components_dir / "ThemeSwitcher.tsx").read_text()
            
            if "export const baseThemes" in theme_switcher_fixed or "export { baseThemes }" in theme_switcher_fixed:
                print("✅ SUCCESS: Missing export was detected and fixed!")
                print("Fixed ThemeSwitcher.tsx now exports baseThemes")
                return True
            else:
                print("❌ FAILED: Missing export was not detected or fixed")
                print("Current content:")
                print(theme_switcher_fixed)
                return False
                
        except ImportError as e:
            print(f"❌ FAILED: Could not import barrel generator: {e}")
            return False
        except AttributeError as e:
            print(f"❌ FAILED: Barrel generator missing method: {e}")
            print("Need to implement _detect_and_fix_missing_exports method")
            return False
        finally:
            sys.path.remove(str(test_root))

if __name__ == "__main__":
    success = test_missing_exports_detection()
    exit(0 if success else 1)