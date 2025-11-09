#!/usr/bin/env python3
"""
Test the fix for individual file named export issue
"""
import tempfile
from pathlib import Path
import sys

# Add the parent directory to Python path to import our modules
sys.path.insert(0, str(Path(__file__).parent))

from core.advanced_barrel_generator import AdvancedBarrelGenerator


def test_individual_file_fix():
    """Test the automatic fix for individual files"""
    print("🧪 Testing automatic fix for individual file exports...")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Create a component that exports only default (the problem)
        component_file = temp_path / "MobileChessBoard.tsx"
        original_content = """
import React from 'react';

interface MobileChessBoardProps {
  title: string;
}

const MobileChessBoard: React.FC<MobileChessBoardProps> = ({ title }) => {
  return <div>{title}</div>;
};

export default MobileChessBoard;
"""
        component_file.write_text(original_content)
        
        print("🔧 BEFORE FIX:")
        print("   Component only has: export default MobileChessBoard;")
        
        # Apply the fix
        generator = AdvancedBarrelGenerator(temp_path)
        
        # Test the fix function directly
        was_fixed = generator.fix_individual_file_exports(component_file)
        
        print(f"📝 Fix applied: {was_fixed}")
        
        # Check the result
        fixed_content = component_file.read_text()
        print("\n✅ AFTER FIX:")
        print("   Component content:")
        for i, line in enumerate(fixed_content.split('\n')[-3:], 1):
            if line.strip():
                print(f"   {line}")
        
        # Verify both import patterns work now
        has_default_export = "export default MobileChessBoard;" in fixed_content
        has_named_export = "export { MobileChessBoard };" in fixed_content
        
        print(f"\n🔍 Verification:")
        print(f"   - Has default export: {has_default_export}")
        print(f"   - Has named export: {has_named_export}")
        print(f"   - Supports both import patterns: {has_default_export and has_named_export}")
        
        # Generate barrel and check result
        barrel_content = generator.generate_barrel(temp_path)
        print(f"\n📦 Generated barrel:")
        print(barrel_content)
        
        return has_default_export and has_named_export


if __name__ == "__main__":
    print("🚀 Testing automatic fix for individual file exports...")
    print("=" * 60)
    
    success = test_individual_file_fix()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ SUCCESS: Individual file fix working correctly!")
        print("   Components now support both import patterns:")
        print("   - import Component from './Component'  (default)")
        print("   - import { Component } from './Component'  (named)")
    else:
        print("❌ FAILED: Individual file fix not working")
    
    print("=" * 60)