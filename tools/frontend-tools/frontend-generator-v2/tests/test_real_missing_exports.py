#!/usr/bin/env python3
"""
Test the missing exports functionality on the real project files
"""

from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator

def test_real_missing_exports():
    """Test missing exports on the real ThemeSwitcher and hook files"""
    
    src_dir = Path("/Users/chris/Projects/llm-api-vault-v2/frontend-v2/src")
    
    print("=== Testing real missing exports ===")
    print(f"Working on src directory: {src_dir}")
    
    # Initialize barrel generator
    barrel_gen = AdvancedBarrelGenerator(src_dir)
    
    # Run missing export detection
    fixes_applied = barrel_gen._detect_and_fix_missing_exports()
    
    print(f"Applied {fixes_applied} missing export fixes")
    
    # Check specific files
    theme_switcher = src_dir / "components/core/ThemeSwitcher.tsx"
    if theme_switcher.exists():
        content = theme_switcher.read_text()
        if "export { baseThemes }" in content or "export const baseThemes" in content:
            print("✅ SUCCESS: baseThemes export was added to ThemeSwitcher.tsx")
        else:
            print("❌ FAILED: baseThemes export was NOT added to ThemeSwitcher.tsx")
            print("Looking for baseThemes in content...")
            if "baseThemes" in content:
                print("Found baseThemes in file but not exported")
            else:
                print("baseThemes not found in file at all")
    else:
        print("❌ FAILED: ThemeSwitcher.tsx not found")

if __name__ == "__main__":
    test_real_missing_exports()