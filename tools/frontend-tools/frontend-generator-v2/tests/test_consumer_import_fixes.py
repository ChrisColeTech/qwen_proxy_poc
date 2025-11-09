#!/usr/bin/env python3
"""
Test case for consumer import fixes in generated code.

Tests the scenarios where:
1. TS2305: Module has no exported member (consumer tries to import from type-only barrel)
2. TS1484: Consumer files need 'import type' for type-only imports
3. TS2613/TS1192: Consumer files try to import default from barrel without default export

The generator should detect and fix these issues by:
- Adding 'type' keyword to consumer imports when importing from type-only barrels
- Fixing consumer default imports to use named imports when no default exists
- Updating generated hook/service files to use proper import patterns
"""

import tempfile
import shutil
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator


def create_consumer_import_test_structure():
    """Create test structure that reproduces consumer import issues"""
    test_dir = Path(tempfile.mkdtemp())
    
    # Create type-only directory that will get 'export type * from' treatment
    types_dir = test_dir / "types" / "ui"
    types_dir.mkdir(parents=True)
    
    # Type-only files
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
""")
    
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
    
    # Create generated consumer files that will have import issues
    constants_dir = test_dir / "constants" / "ui-tests"
    constants_dir.mkdir(parents=True)
    
    # Consumer that imports types without 'type' keyword from type-only barrel (causes TS2305/TS1484)
    (constants_dir / "navigation.constants.ts").write_text("""
// This will fail because '../types' exports 'export type * from './ui''
// So UITestRoute is only available as a type import
import {
  UITestRoute,  // Should be: import type { UITestRoute }
  NavigationConfig
} from '../../types';

export const testRoutes: UITestRoute[] = [
  { path: '/test', component: () => null, label: 'Test' }
];
""")
    
    (constants_dir / "demo-configurations.constants.ts").write_text("""
// These imports will fail with TS2305 because types barrel uses 'export type *'
import {
  AudioDemoConfiguration,  // Should be: import type { AudioDemoConfiguration }
  DragTestConfiguration
} from '../../types';

export const audioConfig: AudioDemoConfiguration = {
  enabled: true,
  volume: 0.5
};
""")
    
    # Create pages with default export issues
    pages_dir = test_dir / "pages" / "splash"
    pages_dir.mkdir(parents=True)
    
    # Page with named export only (no default)
    (pages_dir / "FunctionalSplashPage.tsx").write_text("""
import React from 'react';

export const FunctionalSplashPage: React.FC = () => {
  return <div>Functional Splash</div>;
};
""")
    
    # Consumer trying to import default from page that doesn't have one
    components_dir = test_dir / "components" / "splash"
    components_dir.mkdir(parents=True)
    
    (components_dir / "FunctionalSplashPageWrapper.tsx").write_text("""
import React from 'react';
// This will fail with TS2613 because FunctionalSplashPage has no default export
import FunctionalSplashPage from '../../pages/splash/FunctionalSplashPage';

export const FunctionalSplashPageWrapper: React.FC = () => {
  return <FunctionalSplashPage />;
};
""")
    
    # Create domain-specific hooks that import types (like the real generated files)
    hooks_dir = test_dir / "hooks" / "authentication"
    hooks_dir.mkdir(parents=True)
    
    # Create authentication types directory
    auth_types_dir = test_dir / "types" / "authentication"
    auth_types_dir.mkdir(parents=True)
    
    # Create a domain types file that should get qualified exports
    (auth_types_dir / "user_sessions.ts").write_text("""
export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export default UserSession;
""")
    
    # Hook that imports the type incorrectly
    (hooks_dir / "useUserSession.ts").write_text("""
import { useState, useEffect } from 'react';
import { UserSession } from '../../types';  // Should be: import type { UserSession }

export const useUserSession = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);

  return { session, loading };
};
""")
    
    return test_dir


def test_consumer_import_issues():
    """Test that consumer import issues are detected"""
    print("🧪 Testing consumer import issues...")
    
    # Create test structure
    test_dir = create_consumer_import_test_structure()
    print(f"📁 Created test structure in: {test_dir}")
    
    try:
        # Generate barrels with current logic
        generator = AdvancedBarrelGenerator(test_dir, verbose=True)
        
        # Generate types barrel
        types_dir = test_dir / "types"
        print("📦 Generating types barrel...")
        types_barrel_content = generator.generate_barrel(types_dir)
        
        print("📄 Generated types barrel:")
        print(types_barrel_content)
        
        # Check if UI types get type-only exports
        has_type_only_ui = "export type * from './ui';" in types_barrel_content
        has_regular_ui = "export * from './ui';" in types_barrel_content
        
        print(f"\n🔍 Types Barrel Analysis:")
        print(f"  - UI has type-only exports: {has_type_only_ui}")
        print(f"  - UI has regular exports: {has_regular_ui}")
        
        # Generate pages barrel  
        pages_dir = test_dir / "pages" / "splash"
        print("\n📦 Generating pages/splash barrel...")
        pages_barrel_content = generator.generate_barrel(pages_dir)
        
        print("📄 Generated pages/splash barrel:")
        print(pages_barrel_content)
        
        # Check for default export issues
        has_functional_default = "export { default as FunctionalSplashPage }" in pages_barrel_content
        has_functional_named = "export * from './FunctionalSplashPage';" in pages_barrel_content
        
        print(f"\n🔍 Pages Barrel Analysis:")
        print(f"  - FunctionalSplashPage has default export: {has_functional_default}")
        print(f"  - FunctionalSplashPage has named export: {has_functional_named}")
        
        # Detect issues that would cause TypeScript errors
        issues_detected = []
        
        # Issue 1: Type-only barrel exports but consumers use regular imports
        if has_type_only_ui:
            print("\n🔍 Checking consumer files that import from type-only barrel...")
            constants_nav_file = test_dir / "constants" / "ui-tests" / "navigation.constants.ts"
            if constants_nav_file.exists():
                content = constants_nav_file.read_text()
                if "import {" in content and "from '../../types'" in content and "import type {" not in content:
                    issues_detected.append("TS2305/TS1484: Consumer imports types without 'type' keyword from type-only barrel")
        
        # Issue 2: Consumer tries to import default from component with no default
        if has_functional_named and not has_functional_default:
            print("🔍 Checking consumer files that import default from named-only component...")
            wrapper_file = test_dir / "components" / "splash" / "FunctionalSplashPageWrapper.tsx"
            if wrapper_file.exists():
                content = wrapper_file.read_text()
                if "import FunctionalSplashPage from" in content:
                    issues_detected.append("TS2613: Consumer imports default from component with only named exports")
        
        # Issue 3: Generated hooks import types incorrectly
        hooks_file = test_dir / "hooks" / "authentication" / "useUserSession.ts"
        if hooks_file.exists():
            content = hooks_file.read_text()
            if "import { UserSession }" in content and "import type { UserSession }" not in content:
                issues_detected.append("TS1484: Generated hook imports type without 'type' keyword")
        
        if issues_detected:
            print(f"\n❌ CONSUMER IMPORT ISSUES DETECTED:")
            for issue in issues_detected:
                print(f"  - {issue}")
            
            print(f"\n💡 SOLUTIONS NEEDED:")
            print("1. Detect consumer files that import from type-only barrels and add 'type' keyword")
            print("2. Detect consumer files that import default from named-only components and fix imports")
            print("3. Update generated hooks/services to use 'import type' for type-only imports")
            print("4. Provide import fix suggestions or auto-fix consumer imports")
            return False
        
        print("✅ No consumer import issues detected")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False
        
    finally:
        # Clean up
        shutil.rmtree(test_dir)
        print(f"🧹 Cleaned up test directory: {test_dir}")


def test_fixed_consumer_imports():
    """Test that the fixed generator properly handles consumer import fixes"""
    print("\n🧪 Testing fixed consumer imports...")
    
    print("📋 Expected behavior after fix:")
    print("  - Generated consumer files use 'import type' for type-only imports")
    print("  - Generated consumer files use correct import patterns for components")
    print("  - Type-only barrel consumers are automatically fixed")
    print("  - Default import consumers are fixed to use named imports")
    
    expected_navigation_constants = """// Fixed consumer import
import type {
  UITestRoute,  // Now uses 'import type'
  NavigationConfig
} from '../../types';

export const testRoutes: UITestRoute[] = [
  { path: '/test', component: () => null, label: 'Test' }
];
"""
    
    expected_wrapper = """import React from 'react';
// Fixed to use named import instead of default
import { FunctionalSplashPage } from '../../pages/splash/FunctionalSplashPage';

export const FunctionalSplashPageWrapper: React.FC = () => {
  return <FunctionalSplashPage />;
};
"""
    
    expected_hook = """import { useState, useEffect } from 'react';
import type { UserSession } from '../../types';  // Now uses 'import type'

export const useUserSession = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);

  return { session, loading };
};
"""
    
    print("📄 Expected fixed navigation.constants.ts:")
    print(expected_navigation_constants)
    
    print("📄 Expected fixed FunctionalSplashPageWrapper.tsx:")
    print(expected_wrapper)
    
    print("📄 Expected fixed useUserSession.ts:")
    print(expected_hook)
    
    return True  # This will be implemented


if __name__ == "__main__":
    print("🚀 Testing Consumer Import Issues")
    print("=" * 60)
    
    # Test 1: Detect current consumer import issues
    test1_result = test_consumer_import_issues()
    
    # Test 2: Verify fix (to be implemented)
    test2_result = test_fixed_consumer_imports()
    
    print("\n" + "=" * 60)
    if test1_result and test2_result:
        print("🎉 ALL TESTS PASSED: Consumer imports working correctly")
    else:
        print("💥 TESTS FAILED: Consumer import issues detected")
        print("\n📋 TODO:")
        print("1. Add consumer import analysis to barrel generator")
        print("2. Detect files that import from type-only barrels and add 'type' keyword")
        print("3. Detect default imports from named-only components and fix them")
        print("4. Update code generation templates to use proper import patterns")
        print("5. Implement auto-fix functionality for consumer import issues")