#!/usr/bin/env python3
"""
Test case for over-aggressive type-only import detection.

This test reproduces the issue where:
1. The generator converts regular imports to type-only imports too aggressively
2. Things like React components and functions get marked as type-only when they're used as values
3. This causes TS1361 errors: "cannot be used as a value because it was imported using 'import type'"
"""

import os
import tempfile
import shutil
from pathlib import Path

def test_over_aggressive_type_only_imports():
    """Test that the generator doesn't over-aggressively convert value imports to type-only"""
    
    # Create temporary test structure
    with tempfile.TemporaryDirectory() as temp_dir:
        test_root = Path(temp_dir) / "test_project"
        test_root.mkdir(parents=True)
        
        # Create src directory structure
        src_dir = test_root / "src"
        components_dir = src_dir / "components"
        components_dir.mkdir(parents=True)
        
        # Create a component file that uses React components/icons as values
        component_content = '''import { Dialog } from "@headlessui/react";
import { LogOut, Settings } from "lucide-react";

export default function ActionSheet({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="action-sheet">
        <button className="settings-btn">
          <Settings className="w-5 h-5" />
        </button>
        <button className="logout-btn">  
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </Dialog>
  );
}
'''
        
        # Write test file
        (components_dir / "ActionSheet.tsx").write_text(component_content)
        
        # Copy the barrel generator to test directory
        generator_source = Path("/Users/chris/Projects/llm-api-vault-v2/tools/frontend-tools/frontend-generator-v2/core/advanced_barrel_generator.py")
        generator_dest = test_root / "advanced_barrel_generator.py"
        shutil.copy2(generator_source, generator_dest)
        
        print("=== Testing over-aggressive type-only import detection ===")
        print(f"Test structure created at: {test_root}")
        
        # Import and run the barrel generator
        import sys
        sys.path.insert(0, str(test_root))
        
        try:
            from advanced_barrel_generator import AdvancedBarrelGenerator
            
            # Initialize barrel generator
            barrel_gen = AdvancedBarrelGenerator(src_dir)
            
            # Run type-only import fixing
            barrel_gen._fix_type_only_imports()
            
            # Check if the imports were incorrectly converted to type-only
            component_fixed = (components_dir / "ActionSheet.tsx").read_text()
            
            # These should NOT be converted to type-only because they're used as JSX components
            has_incorrect_type_only = (
                "import type { LogOut" in component_fixed or
                "import type { Settings" in component_fixed or
                "import type { Dialog" in component_fixed
            )
            
            if has_incorrect_type_only:
                print("❌ FAILED: Generator over-aggressively converted value imports to type-only")
                print("Fixed content:")
                print(component_fixed)
                return False
            else:
                print("✅ SUCCESS: Generator correctly preserved value imports")
                print("All React components and icons remain as regular imports")
                return True
                
        except ImportError as e:
            print(f"❌ FAILED: Could not import barrel generator: {e}")
            return False
        except AttributeError as e:
            print(f"❌ FAILED: Barrel generator missing method: {e}")
            return False
        finally:
            sys.path.remove(str(test_root))

if __name__ == "__main__":
    success = test_over_aggressive_type_only_imports()
    exit(0 if success else 1)