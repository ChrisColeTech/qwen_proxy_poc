#!/usr/bin/env python3
"""
Test case to demonstrate and fix the "has no exported member" issue.
The problem: consumers expect BOTH import patterns to work:
1. import { ComponentName } from "./barrel"  (named import) 
2. import ComponentName from "./barrel"      (default import alias)

But current barrel only provides alias: export { default as ComponentName }
This creates an alias, not both import patterns.

Solution: Provide BOTH export patterns for default exports.
"""

import tempfile
import shutil
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator

def test_named_export_requirements():
    """Test that barrels support both import patterns for default exports"""
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "components" / "test"
        test_dir.mkdir(parents=True)
        
        # Create component with DEFAULT EXPORT
        component_file = test_dir / "TestComponent.tsx"
        component_file.write_text("""
import React from "react";

interface TestComponentProps {
  title: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ title }) => {
  return <div>{title}</div>;
};

export default TestComponent;
""")

        # Create consumer that uses NAMED IMPORT (this currently fails)
        consumer_file = test_dir / "Consumer.tsx"
        consumer_file.write_text("""
import React from "react";
import { TestComponent } from "./";  // Named import from barrel

export const Consumer: React.FC = () => {
  return <TestComponent title="Hello" />;
};
""")

        # Create consumer that uses DEFAULT IMPORT (this should work)
        consumer2_file = test_dir / "Consumer2.tsx"
        consumer2_file.write_text("""
import React from "react";
import TestComponent from "./";  // Default import from barrel

export const Consumer2: React.FC = () => {
  return <TestComponent title="Hello" />;
};
""")
        
        print("=== Testing Named Export Requirements ===")
        print(f"Test directory: {temp_path}")
        
        # Generate barrel with current system
        barrel_generator = AdvancedBarrelGenerator(temp_path, verbose=True)
        
        # Analyze files
        tsx_files = list(test_dir.glob("*.tsx"))
        for file_path in tsx_files:
            analysis = barrel_generator.analyze_file(file_path)
            print(f"Analyzed {file_path.name}: {len(analysis.exports)} exports")
            for export in analysis.exports:
                print(f"  - {export.export_type.value}: {export.name}")
        
        barrel_generator.build_export_registry()
        
        # Generate barrel
        barrel_content = barrel_generator.generate_barrel(test_dir)
        barrel_file = test_dir / "index.ts"
        barrel_file.write_text(barrel_content)
        
        print(f"\n=== Current Barrel Content ===")
        print(barrel_content)
        
        print(f"\n=== Import Pattern Analysis ===")
        
        # Check what imports are actually supported
        issues = []
        
        # Check for named export support (destructuring import)
        supports_named = ("as TestComponent" in barrel_content and 
                         ("export {" in barrel_content or "export const TestComponent" in barrel_content))
        
        # Check for default export support  
        supports_default = ("as default" in barrel_content or "export default" in barrel_content)
        
        if not supports_named:
            issues.append("❌ Named import `import { TestComponent }` will fail")
            
        if not supports_default:
            issues.append("❌ Default import `import TestComponent` will fail")
        
        print(f"\n=== Required Solution ===")
        print("For both import patterns to work, barrel should provide:")
        print("1. Named export: export { default as TestComponent } from './TestComponent';")
        print("2. Named binding: export const TestComponent = TestComponentDefault;") 
        print("   OR re-export: export { TestComponent } from './TestComponent';")
        print("   OR combined: export default TestComponentDefault; export { TestComponentDefault as TestComponent };")
        
        if issues:
            print(f"\n=== Issues Found ===")
            for issue in issues:
                print(f"  {issue}")
            return False
        else:
            print("✅ All import patterns supported")
            return True

def test_mixed_export_scenario():
    """Test component with both default and named exports"""
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "components" / "mixed"
        test_dir.mkdir(parents=True)
        
        # Component with BOTH default and named exports
        mixed_file = test_dir / "MixedComponent.tsx"
        mixed_file.write_text("""
import React from "react";

export interface MixedComponentProps {
  title: string;
}

export const MIXED_CONSTANT = "test";

const MixedComponent: React.FC<MixedComponentProps> = ({ title }) => {
  return <div>{title}</div>;
};

export default MixedComponent;
""")
        
        print(f"\n=== Testing Mixed Export Scenario ===")
        
        # Generate barrel  
        barrel_generator = AdvancedBarrelGenerator(temp_path, verbose=True)
        analysis = barrel_generator.analyze_file(mixed_file)
        barrel_generator.build_export_registry()
        
        barrel_content = barrel_generator.generate_barrel(test_dir)
        
        print(f"=== Mixed Component Analysis ===")
        print(f"Exports found: {len(analysis.exports)}")
        for export in analysis.exports:
            print(f"  - {export.export_type.value}: {export.name}")
            
        print(f"\n=== Mixed Barrel Content ===")  
        print(barrel_content)
        
        # This should include both named and default exports
        # Note: export * from './file' automatically includes all named exports
        # So MixedComponentProps and MIXED_CONSTANT should be available via export *
        expected_patterns = [
            ("MixedComponentProps", "export * from"),  # Should be exported via export *
            ("MIXED_CONSTANT", "export * from"),       # Should be exported via export *
            ("MixedComponent", "as MixedComponent")     # Should be exported as alias
        ]
        missing_exports = []
        
        for expected_export, pattern in expected_patterns:
            if pattern in barrel_content:
                # If the pattern exists, the export should be available
                continue
            else:
                # Check if the export name appears directly
                if expected_export not in barrel_content:
                    missing_exports.append(expected_export)
        
        if missing_exports:
            print(f"❌ Missing exports: {missing_exports}")
            return False
        else:
            print("✅ All exports properly handled")
            return True

if __name__ == "__main__":
    success1 = test_named_export_requirements()
    success2 = test_mixed_export_scenario()
    
    print(f"\n=== Summary ===")
    print(f"Named export test: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"Mixed export test: {'✅ PASS' if success2 else '❌ FAIL'}")
    
    if not success1:
        print(f"\n=== Solution Needed ===")
        print("The barrel generator must provide BOTH import patterns:")
        print("1. For consumers using: import { ComponentName } from './barrel'")
        print("2. For consumers using: import ComponentName from './barrel'")
        print("Current approach only supports pattern #2 via alias")
    
    exit(0 if success1 and success2 else 1)