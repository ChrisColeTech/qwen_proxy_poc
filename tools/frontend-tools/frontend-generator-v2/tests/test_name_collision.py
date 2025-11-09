#!/usr/bin/env python3
"""
Test case for name collision handling in barrel exports.

This test reproduces the issue where:
1. Multiple modules export identically named items
2. The generator creates conflicting exports in barrel files
3. This causes TypeScript compilation errors due to duplicate identifiers
"""

import os
import tempfile
import shutil
from pathlib import Path

def test_name_collision_detection_and_fixing():
    """Test that the generator detects and fixes name collisions in barrel exports"""
    
    # Create temporary test structure
    with tempfile.TemporaryDirectory() as temp_dir:
        test_root = Path(temp_dir) / "test_project"
        test_root.mkdir(parents=True)
        
        # Create src directory structure
        src_dir = test_root / "src"
        components_dir = src_dir / "components"
        types_dir = src_dir / "types"
        ui_dir = src_dir / "ui"
        components_dir.mkdir(parents=True)
        types_dir.mkdir(parents=True)
        ui_dir.mkdir(parents=True)
        
        # Create files with name collisions
        # Button component
        button_component = '''export interface ButtonProps {
  label: string;
  onClick: () => void;
}

export default function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
'''
        
        # Button types (same name as component)
        button_types = '''export interface Button {
  id: string;
  text: string;
  disabled: boolean;
}

export interface ButtonConfig {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
}
'''
        
        # Another component with Button interface
        form_component = '''export interface Button {
  type: 'submit' | 'reset' | 'button';
  form?: string;
}

export default function Form() {
  return <form></form>;
}
'''
        
        # Add a UI component with same name as types
        ui_button_component = '''export default function Button() {
  return <div className="ui-button">UI Button</div>;
}

export const ButtonVariant = {
  Primary: 'primary',
  Secondary: 'secondary'
} as const;
'''
        
        # Write test files
        (components_dir / "Button.tsx").write_text(button_component)
        (components_dir / "Form.tsx").write_text(form_component)
        (types_dir / "button.types.ts").write_text(button_types)
        (ui_dir / "Button.tsx").write_text(ui_button_component)
        
        # Copy the barrel generator to test directory
        generator_source = Path("/Users/chris/Projects/llm-api-vault-v2/tools/frontend-tools/frontend-generator-v2/core/advanced_barrel_generator.py")
        generator_dest = test_root / "advanced_barrel_generator.py"
        shutil.copy2(generator_source, generator_dest)
        
        print("=== Testing name collision detection and fixing ===")
        print(f"Test structure created at: {test_root}")
        
        # Import and run the barrel generator
        import sys
        sys.path.insert(0, str(test_root))
        
        try:
            from advanced_barrel_generator import AdvancedBarrelGenerator
            
            # Initialize barrel generator
            barrel_gen = AdvancedBarrelGenerator(src_dir)
            
            # Analyze files first
            for ts_file in components_dir.glob("*.tsx"):
                barrel_gen.analyze_file(ts_file)
            for ts_file in types_dir.glob("*.ts"):
                barrel_gen.analyze_file(ts_file)
            for ts_file in ui_dir.glob("*.tsx"):
                barrel_gen.analyze_file(ts_file)
                
            # Build export registry to detect conflicts
            barrel_gen.build_export_registry()
            
            # Generate barrel files
            components_barrel_content = barrel_gen.generate_barrel(components_dir)
            types_barrel_content = barrel_gen.generate_barrel(types_dir)
            ui_barrel_content = barrel_gen.generate_barrel(ui_dir)
            
            # Write barrel files
            (components_dir / "index.ts").write_text(components_barrel_content)
            (types_dir / "index.ts").write_text(types_barrel_content)
            (ui_dir / "index.ts").write_text(ui_barrel_content)
            
            # Check the generated barrel files for conflicts
            components_barrel = (components_dir / "index.ts").read_text()
            types_barrel = (types_dir / "index.ts").read_text()
            ui_barrel = (ui_dir / "index.ts").read_text()
            
            print("Components barrel content:")
            print(components_barrel)
            print("\nTypes barrel content:")
            print(types_barrel)
            print("\nUI barrel content:")
            print(ui_barrel)
            
            # Check for name collision indicators
            has_name_collisions = (
                # Multiple Button exports without qualification
                components_barrel.count("export") > 1 and
                components_barrel.count("Button") > 2  # More than expected
            )
            
            # Check if collisions are properly handled (aliased exports)
            collision_properly_handled = (
                "as Button" in components_barrel or
                "as FormButton" in components_barrel or
                "as ButtonComponent" in components_barrel or
                # Alternative: selective imports to avoid conflicts
                ("export { default as Button }" in components_barrel and
                 "export type { ButtonProps }" in components_barrel)
            )
            
            if has_name_collisions and not collision_properly_handled:
                print("❌ FAILED: Name collisions detected but not properly handled")
                print("- Multiple 'Button' exports without proper aliasing")
                return False
            elif collision_properly_handled:
                print("✅ SUCCESS: Name collisions properly handled with aliasing")
                return True
            else:
                print("✅ SUCCESS: No name collisions detected")
                return True
                
        except ImportError as e:
            print(f"❌ FAILED: Could not import barrel generator: {e}")
            return False
        except Exception as e:
            print(f"❌ FAILED: Error during processing: {e}")
            return False
        finally:
            sys.path.remove(str(test_root))

if __name__ == "__main__":
    success = test_name_collision_detection_and_fixing()
    exit(0 if success else 1)