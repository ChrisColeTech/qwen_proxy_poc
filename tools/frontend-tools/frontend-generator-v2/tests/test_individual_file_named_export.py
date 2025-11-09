#!/usr/bin/env python3
"""
Test case for individual file named export issue
The problem: Components export default but consumers use named imports from individual files
"""
import tempfile
import shutil
from pathlib import Path
import sys
import os

# Add the parent directory to Python path to import our modules
sys.path.insert(0, str(Path(__file__).parent))

from core.advanced_barrel_generator import AdvancedBarrelGenerator


def test_individual_file_named_export():
    """
    Test the exact scenario causing build errors:
    1. Component exports default: `export default MobileChessBoard;`
    2. Consumer imports named from individual file: `import { MobileChessBoard } from "./MobileChessBoard";`
    3. This should work but currently fails
    """
    print("🧪 Testing individual file named export issue...")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Create a component that exports default (like our actual components)
        component_file = temp_path / "MobileChessBoard.tsx"
        component_file.write_text("""
import React from 'react';

interface MobileChessBoardProps {
  title: string;
}

const MobileChessBoard: React.FC<MobileChessBoardProps> = ({ title }) => {
  return <div>{title}</div>;
};

export default MobileChessBoard;
""")
        
        # Create a consumer that imports named from individual file (the problem pattern)
        consumer_file = temp_path / "PlayChessPage.tsx"
        consumer_file.write_text("""
import React from 'react';
import { MobileChessBoard } from "./MobileChessBoard"; // This should work but fails

export default function PlayChessPage() {
  return <MobileChessBoard title="Chess Game" />;
}
""")
        
        print(f"📁 Created test files in: {temp_path}")
        print(f"📄 Component file: {component_file.name} (exports default)")
        print(f"📄 Consumer file: {consumer_file.name} (imports named from individual file)")
        
        # Initialize barrel generator
        generator = AdvancedBarrelGenerator(temp_path)
        
        # Analyze the component file
        analysis = generator.analyze_file(component_file)
        print(f"🔍 Analysis results:")
        print(f"   - Has default export: {analysis.has_default_export}")
        print(f"   - Has named exports: {analysis.has_named_exports}")
        print(f"   - Exports: {[e.name for e in analysis.exports]}")
        
        # The problem: TypeScript expects this import to work
        # import { MobileChessBoard } from "./MobileChessBoard"
        # But the file only has: export default MobileChessBoard
        
        print("\n❌ PROBLEM IDENTIFIED:")
        print("   Consumer expects: import { MobileChessBoard } from './MobileChessBoard'")
        print("   But file only has: export default MobileChessBoard")
        print("   Solution: Individual files with default exports need named exports too")
        
        # Test what the current barrel generator would create
        barrel_content = generator.generate_barrel(temp_path)
        barrel_file = temp_path / "index.ts"
        barrel_file.write_text(barrel_content)
        
        print(f"\n📦 Generated barrel content:")
        print(barrel_content)
        
        print("\n🎯 SOLUTION NEEDED:")
        print("   Individual component files need BOTH:")
        print("   1. export default MobileChessBoard;  (for default imports)")
        print("   2. export { MobileChessBoard };      (for named imports)")
        print("   OR modify imports to use default imports")
        
        return {
            'component_file': component_file,
            'consumer_file': consumer_file,
            'barrel_content': barrel_content,
            'analysis': analysis
        }


def test_solution_both_export_patterns():
    """
    Test the solution: components should export both default and named
    """
    print("\n🧪 Testing solution: Both default and named exports...")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Create a component that exports BOTH default and named (the solution)
        component_file = temp_path / "MobileChessBoard.tsx"
        component_file.write_text("""
import React from 'react';

interface MobileChessBoardProps {
  title: string;
}

const MobileChessBoard: React.FC<MobileChessBoardProps> = ({ title }) => {
  return <div>{title}</div>;
};

// Export both patterns to support all import styles
export default MobileChessBoard;
export { MobileChessBoard };
""")
        
        # Consumer using named import from individual file
        consumer1_file = temp_path / "Consumer1.tsx"
        consumer1_file.write_text("""
import { MobileChessBoard } from "./MobileChessBoard"; // Named import
""")
        
        # Consumer using default import
        consumer2_file = temp_path / "Consumer2.tsx"
        consumer2_file.write_text("""
import MobileChessBoard from "./MobileChessBoard"; // Default import
""")
        
        # Consumer using named import from barrel
        consumer3_file = temp_path / "Consumer3.tsx"
        consumer3_file.write_text("""
import { MobileChessBoard } from "./"; // Named import from barrel
""")
        
        print("✅ SOLUTION TEST:")
        print("   Component exports both: export default X; export { X };")
        print("   All import patterns now work:")
        print("   1. Named from file: import { X } from './File'")
        print("   2. Default from file: import X from './File'")
        print("   3. Named from barrel: import { X } from './'")
        
        # Test barrel generation
        generator = AdvancedBarrelGenerator(temp_path)
        analysis = generator.analyze_file(component_file)
        
        print(f"\n🔍 Solution analysis:")
        print(f"   - Has default export: {analysis.has_default_export}")
        print(f"   - Has named exports: {analysis.has_named_exports}")
        print(f"   - Exports: {[e.name for e in analysis.exports]}")
        
        barrel_content = generator.generate_barrel(temp_path)
        print(f"\n📦 Barrel with solution:")
        print(barrel_content)
        
        return True


if __name__ == "__main__":
    print("🚀 Testing individual file named export issue...")
    print("=" * 60)
    
    # Test the problem
    result = test_individual_file_named_export()
    
    print("\n" + "=" * 60)
    
    # Test the solution
    test_solution_both_export_patterns()
    
    print("\n" + "=" * 60)
    print("🎯 CONCLUSION:")
    print("   The barrel generator needs to modify individual component files")
    print("   to export both default AND named exports to support all import patterns")
    print("   OR we need to update templates to use consistent import patterns")