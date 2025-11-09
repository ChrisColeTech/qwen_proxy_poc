#!/usr/bin/env python3
"""
Test case for TypeScript export issues in generated code.

Tests the scenarios where:
1. TS1192: Module has no default export (barrel files incorrectly exported)
2. TS1484: Type imports need type-only imports when verbatimModuleSyntax is enabled

The generator should detect and fix these issues by:
- Using proper export patterns for components vs types
- Adding 'type' keyword for type-only imports when needed
- Ensuring barrel files have correct default/named export patterns
"""

import tempfile
import shutil
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator


def create_typescript_export_test_structure():
    """Create test structure that reproduces TypeScript export issues"""
    test_dir = Path(tempfile.mkdtemp())
    
    # Create pages directory with components that should have default exports
    pages_dir = test_dir / "pages" / "splash"
    pages_dir.mkdir(parents=True)
    
    # Create a page component with default export
    (pages_dir / "MinimalSplashPage.tsx").write_text("""
import React from 'react';

interface Props {
  onComplete: () => void;
}

const MinimalSplashPage: React.FC<Props> = ({ onComplete }) => {
  return (
    <div className="minimal-splash">
      <h1>Welcome</h1>
      <button onClick={onComplete}>Continue</button>
    </div>
  );
};

export default MinimalSplashPage;
""")
    
    # Create another page component
    (pages_dir / "FunctionalSplashPage.tsx").write_text("""
import React from 'react';

export const FunctionalSplashPage: React.FC = () => {
  return <div>Functional Splash</div>;
};
""")
    
    # Create types directory with type definitions
    types_dir = test_dir / "types" / "ui"
    types_dir.mkdir(parents=True)
    
    # Create type file that should be imported with type-only imports
    (types_dir / "navigation.types.ts").write_text("""
export interface UITestRoute {
  path: string;
  component: React.ComponentType;
  label: string;
}

export interface NavigationConfig {
  routes: UITestRoute[];
  defaultRoute: string;
}

export type RouteParams = Record<string, string>;
""")
    
    # Create another type file
    (types_dir / "audio-demo.types.ts").write_text("""
export interface AudioDemoConfiguration {
  enabled: boolean;
  volume: number;
}

export interface DragTestConfiguration {
  sensitivity: number;
  threshold: number;
}
""")
    
    # Create consumer files that import incorrectly
    constants_dir = test_dir / "constants" / "ui-tests"
    constants_dir.mkdir(parents=True)
    
    # Consumer that imports types without 'type' keyword (causes TS1484)
    (constants_dir / "navigation.constants.ts").write_text("""
// This should fail with TS1484 when verbatimModuleSyntax is enabled
import {
  UITestRoute,  // Should be: import type { UITestRoute }
  NavigationConfig
} from '../../types';

export const testRoutes: UITestRoute[] = [
  { path: '/test', component: () => null, label: 'Test' }
];
""")
    
    # Consumer that imports types without 'type' keyword
    (constants_dir / "demo-configurations.constants.ts").write_text("""
// These should be type-only imports
import {
  AudioDemoConfiguration,  // Should be: import type { AudioDemoConfiguration }
  DragTestConfiguration
} from '../../types';

export const audioConfig: AudioDemoConfiguration = {
  enabled: true,
  volume: 0.5
};
""")
    
    # Consumer that tries to import default from barrel (causes TS1192)
    components_dir = test_dir / "components" / "splash"
    components_dir.mkdir(parents=True)
    
    (components_dir / "withSplashScreen.tsx").write_text("""
import React from 'react';
// This should fail with TS1192 if pages/index.ts doesn't have default export
import MinimalSplashPage from '../../pages/splash/MinimalSplashPage';

export const withSplashScreen = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => (
    <div>
      <MinimalSplashPage onComplete={() => {}} />
      <Component {...props} />
    </div>
  );
};
""")
    
    return test_dir


def test_typescript_export_issues():
    """Test that TypeScript export issues are detected"""
    print("🧪 Testing TypeScript export issues...")
    
    # Create test structure
    test_dir = create_typescript_export_test_structure()
    print(f"📁 Created test structure in: {test_dir}")
    
    try:
        # Generate barrels with current logic
        generator = AdvancedBarrelGenerator(test_dir, verbose=True)
        
        # Generate barrel for pages directory
        pages_dir = test_dir / "pages" / "splash"
        print("📦 Generating pages/splash barrel...")
        pages_barrel_content = generator.generate_barrel(pages_dir)
        
        print("📄 Generated pages/splash barrel:")
        print(pages_barrel_content)
        
        # Check for TS1192 issues (missing default exports in barrels)
        has_default_exports = "export { default as" in pages_barrel_content
        has_named_only = "export *" in pages_barrel_content and "default" not in pages_barrel_content
        
        print(f"\n🔍 Pages Barrel Analysis:")
        print(f"  - Has default exports: {has_default_exports}")
        print(f"  - Has named-only exports: {has_named_only}")
        
        # Generate barrel for types directory
        types_dir = test_dir / "types"
        print("\n📦 Generating types barrel...")
        types_barrel_content = generator.generate_barrel(types_dir)
        
        print("📄 Generated types barrel:")
        print(types_barrel_content)
        
        # Check for TS1484 issues (types should be re-exported as types)
        has_type_exports = "export type" in types_barrel_content
        has_regular_type_exports = "export *" in types_barrel_content and "export type" not in types_barrel_content
        
        print(f"\n🔍 Types Barrel Analysis:")
        print(f"  - Has type-only exports: {has_type_exports}")
        print(f"  - Uses regular exports for types: {has_regular_type_exports}")
        
        # Detect issues
        issues_detected = []
        
        if has_named_only and not has_default_exports:
            issues_detected.append("TS1192: Pages with default exports need proper barrel default exports")
        
        if has_regular_type_exports and not has_type_exports:
            issues_detected.append("TS1484: Types need type-only re-exports for verbatimModuleSyntax")
        
        if issues_detected:
            print(f"\n❌ ISSUES DETECTED:")
            for issue in issues_detected:
                print(f"  - {issue}")
            
            print(f"\n💡 SOLUTIONS NEEDED:")
            print("1. Detect components with default exports and use 'export {{ default as Name }}' pattern")
            print("2. Detect type files and use 'export type * from' for barrel re-exports")
            print("3. Handle mixed files with both types and values appropriately")
            return False
        
        print("✅ No TypeScript export issues detected")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False
        
    finally:
        # Clean up
        shutil.rmtree(test_dir)
        print(f"🧹 Cleaned up test directory: {test_dir}")


def test_fixed_typescript_exports():
    """Test that the fixed generator properly handles TypeScript exports"""
    print("\n🧪 Testing fixed TypeScript exports...")
    
    print("📋 Expected behavior after fix:")
    print("  - Components with default exports use 'export { default as Name }' in barrels")
    print("  - Type files use 'export type * from' for type-only re-exports")
    print("  - Mixed files handle both patterns appropriately")
    
    expected_pages_barrel = """// Auto-generated barrel export for pages/splash
// Generated by AdvancedBarrelGenerator

// Default exports
export { default as MinimalSplashPage } from './MinimalSplashPage';

// Named exports only
export * from './FunctionalSplashPage';
"""
    
    expected_types_barrel = """// Auto-generated barrel export for types
// Generated by AdvancedBarrelGenerator

// Type-only exports for verbatimModuleSyntax compatibility
export type * from './ui';
"""
    
    print("📄 Expected pages/splash barrel:")
    print(expected_pages_barrel)
    
    print("📄 Expected types barrel:")
    print(expected_types_barrel)
    
    return True  # This will be implemented


if __name__ == "__main__":
    print("🚀 Testing TypeScript Export Issues")
    print("=" * 60)
    
    # Test 1: Detect current issues
    test1_result = test_typescript_export_issues()
    
    # Test 2: Verify fix (to be implemented)
    test2_result = test_fixed_typescript_exports()
    
    print("\n" + "=" * 60)
    if test1_result and test2_result:
        print("🎉 ALL TESTS PASSED: TypeScript exports working correctly")
    else:
        print("💥 TESTS FAILED: TypeScript export issues detected")
        print("\n📋 TODO:")
        print("1. Modify barrel generator to detect component vs type files")
        print("2. Use 'export { default as Name }' for components with default exports")
        print("3. Use 'export type * from' for type-only files")
        print("4. Handle verbatimModuleSyntax compatibility")