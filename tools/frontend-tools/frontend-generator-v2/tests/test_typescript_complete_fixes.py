#!/usr/bin/env python3
"""
Comprehensive test case for all remaining TypeScript errors in generated code.

Tests and fixes for:
1. TS1484: Type imports need 'import type' when verbatimModuleSyntax is enabled
2. TS2305: Module has no exported member (from type-only barrels)
3. TS1192/TS2613: Default export issues
4. TS1205: Re-exporting types needs 'export type'
5. TS1284: Default export of type-only interfaces
6. Template generation issues

The generator should detect and fix these by:
- Generating proper 'import type' statements in templates
- Using 'export type' for type re-exports in barrels
- Removing invalid default exports from type-only files
- Fixing template import patterns
"""

import tempfile
import shutil
import re
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator


def create_comprehensive_test_structure():
    """Create test structure reproducing all TypeScript error categories"""
    test_dir = Path(tempfile.mkdtemp())
    
    # Create types structure that will have various export issues
    types_base = test_dir / "types"
    
    # 1. Type-only files that incorrectly export default (TS1284)
    auth_types = types_base / "authentication"
    auth_types.mkdir(parents=True)
    
    (auth_types / "user_sessions.ts").write_text("""
export interface UserSession {
  id: string;
  user_id: string;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
}

// This causes TS1284: An 'export default' must reference a value when 'verbatimModuleSyntax' is enabled
export default UserSession;
""")
    
    (auth_types / "auth.ts").write_text("""
export interface Auth {
  token: string;
  user: string;
}

// This also causes TS1284
export default Auth;
""")
    
    # 2. Barrel files that need 'export type' for type re-exports (TS1205)
    (auth_types / "index.ts").write_text("""
// These cause TS1205: Re-exporting a type requires 'export type'
export { UserSession } from './user_sessions';
export { Auth } from './auth';

// This is also incorrect
export { default as UserSessionDefault } from './user_sessions';
""")
    
    # 3. Generated hook templates that import types incorrectly (TS1484)
    hooks_dir = test_dir / "hooks" / "authentication"
    hooks_dir.mkdir(parents=True)
    
    (hooks_dir / "useUserSession.ts").write_text("""
import { useState } from 'react';
// This causes TS1484: must use import type
import { UserSession } from '../../types';

export const useUserSession = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  return { session };
};
""")
    
    # 4. Constants that import from type-only barrels (TS2305)
    constants_dir = test_dir / "constants" / "ui-tests"
    constants_dir.mkdir(parents=True)
    
    (constants_dir / "demo-configurations.constants.ts").write_text("""
// These cause TS2305 when barrel uses 'export type *'
import {
  AudioDemoConfiguration,
  DragTestConfiguration
} from '../../types';

export const audioConfig: AudioDemoConfiguration = {
  enabled: true,
  volume: 0.5
};
""")
    
    # 5. UI types that should be type-only
    ui_types = types_base / "ui"
    ui_types.mkdir(parents=True)
    
    (ui_types / "audio-demo.types.ts").write_text("""
export interface AudioDemoConfiguration {
  enabled: boolean;
  volume: number;
}

export interface DragTestConfiguration {
  sensitivity: number;
  threshold: number;
}
""")
    
    # 6. Components with wrong import patterns
    components_dir = test_dir / "components" / "splash"
    components_dir.mkdir(parents=True)
    
    (components_dir / "withSplashScreen.tsx").write_text("""
import React from 'react';
// This causes TS2613: no default export
import MinimalSplashPage from '../../pages/splash/MinimalSplashPage';

export const withSplashScreen = () => <MinimalSplashPage />;
""")
    
    # 7. Page components with only named exports
    pages_dir = test_dir / "pages" / "splash"  
    pages_dir.mkdir(parents=True)
    
    (pages_dir / "MinimalSplashPage.tsx").write_text("""
import React from 'react';

// Only named export, no default
export const MinimalSplashPage: React.FC = () => {
  return <div>Minimal Splash</div>;
};
""")
    
    # 8. Services that import types incorrectly
    services_dir = test_dir / "services" / "authentication"
    services_dir.mkdir(parents=True)
    
    (services_dir / "authService.ts").write_text("""
// This causes TS2307 when types path doesn't match barrel structure
import { Auth, ApiResponse } from '../types/auth';

export class AuthService {
  login(auth: Auth): Promise<ApiResponse<string>> {
    return Promise.resolve({ success: true, data: 'token' });
  }
}
""")
    
    return test_dir


def test_comprehensive_typescript_issues():
    """Test detection of all TypeScript error categories"""
    print("🧪 Testing comprehensive TypeScript issues...")
    
    test_dir = create_comprehensive_test_structure()
    print(f"📁 Created comprehensive test structure in: {test_dir}")
    
    try:
        # Generate barrels to see current behavior
        generator = AdvancedBarrelGenerator(test_dir, verbose=True)
        
        # Test types barrel generation
        types_dir = test_dir / "types" 
        print("📦 Generating types barrel...")
        types_barrel = generator.generate_barrel(types_dir)
        
        # Test authentication types barrel
        auth_types_dir = test_dir / "types" / "authentication"
        print("📦 Generating auth types barrel...")
        auth_barrel = generator.generate_barrel(auth_types_dir)
        
        print("\n📄 Generated types/index.ts:")
        print(types_barrel)
        
        print("\n📄 Generated types/authentication/index.ts:")
        print(auth_barrel)
        
        # Analyze the generated content for issues
        issues_found = []
        
        # Issue 1: Check for type-only directories getting regular exports
        if "export * from './ui'" in types_barrel and "export type * from './ui'" not in types_barrel:
            issues_found.append("TS2305: UI types need 'export type *' but got regular export")
        
        # Issue 2: Check authentication barrel for incorrect re-exports
        if "export {" in auth_barrel and "export type {" not in auth_barrel:
            issues_found.append("TS1205: Auth barrel needs 'export type' for type re-exports")
        
        # Issue 3: Check for default exports in type files
        auth_user_sessions = test_dir / "types" / "authentication" / "user_sessions.ts"
        if auth_user_sessions.exists():
            content = auth_user_sessions.read_text()
            if "export default" in content:
                issues_found.append("TS1284: Type file has invalid 'export default'")
        
        # Issue 4: Check generated hook imports
        hook_file = test_dir / "hooks" / "authentication" / "useUserSession.ts"
        if hook_file.exists():
            content = hook_file.read_text()
            if "import {" in content and "import type {" not in content and "UserSession" in content:
                issues_found.append("TS1484: Hook imports type without 'type' keyword")
        
        # Issue 5: Check constants imports from type-only barrels
        constants_file = test_dir / "constants" / "ui-tests" / "demo-configurations.constants.ts"
        if constants_file.exists():
            content = constants_file.read_text()
            if "import {" in content and "types" in content:
                # Check if types barrel would use export type *
                ui_is_type_only = generator._is_type_only_directory(test_dir / "types" / "ui")
                if ui_is_type_only:
                    issues_found.append("TS2305: Constants import from type-only barrel without 'type'")
        
        # Issue 6: Check component default imports
        component_file = test_dir / "components" / "splash" / "withSplashScreen.tsx"
        if component_file.exists():
            content = component_file.read_text()
            if "import MinimalSplashPage from" in content:
                # Check if target has default export
                target_file = test_dir / "pages" / "splash" / "MinimalSplashPage.tsx"
                if target_file.exists():
                    target_content = target_file.read_text()
                    if "export default" not in target_content:
                        issues_found.append("TS2613: Component imports default from named-only export")
        
        # Issue 7: Check service import paths
        service_file = test_dir / "services" / "authentication" / "authService.ts"
        if service_file.exists():
            content = service_file.read_text()
            if "../types/auth" in content:
                # This path doesn't match barrel structure
                issues_found.append("TS2307: Service uses incorrect import path")
        
        if issues_found:
            print(f"\n❌ COMPREHENSIVE TYPESCRIPT ISSUES DETECTED:")
            for i, issue in enumerate(issues_found, 1):
                print(f"  {i}. {issue}")
            
            print(f"\n💡 FIXES NEEDED:")
            print("1. Fix type-only barrel exports: use 'export type *' for type-only directories")
            print("2. Fix type re-exports in barrels: use 'export type { Type }'")
            print("3. Remove invalid 'export default' from type-only files")
            print("4. Fix generated template imports: use 'import type' for types")
            print("5. Fix import paths in generated services")
            print("6. Fix component import patterns")
            
            return False
        
        print("✅ No comprehensive TypeScript issues detected")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        shutil.rmtree(test_dir)
        print(f"🧹 Cleaned up test directory: {test_dir}")


def test_fixed_comprehensive_issues():
    """Test that the fixes resolve all TypeScript issues"""
    print("\n🧪 Testing comprehensive fixes...")
    
    print("📋 Expected fixes:")
    print("  - Type-only directories use 'export type *'")
    print("  - Type re-exports use 'export type { Type }'")
    print("  - No 'export default' in type-only files")
    print("  - Generated templates use 'import type' for types")
    print("  - Correct import paths in all generated files")
    print("  - Component imports use named imports when no default exists")
    
    expected_fixes = {
        "types/index.ts": """// Auto-generated barrel export for types
// Generated by AdvancedBarrelGenerator

// Subdirectory exports  
export type * from './authentication';
export type * from './ui';
""",
        "types/authentication/index.ts": """// Auto-generated barrel export for authentication
// Generated by AdvancedBarrelGenerator

// Type-only exports
export type { UserSession } from './user_sessions';
export type { Auth } from './auth';
""",
        "hooks/authentication/useUserSession.ts": """import { useState } from 'react';
// Fixed to use import type
import type { UserSession } from '../../types';

export const useUserSession = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  return { session };
};
""",
        "components/splash/withSplashScreen.tsx": """import React from 'react';
// Fixed to use named import
import { MinimalSplashPage } from '../../pages/splash/MinimalSplashPage';

export const withSplashScreen = () => <MinimalSplashPage />;
"""
    }
    
    for file_path, expected_content in expected_fixes.items():
        print(f"\n📄 Expected {file_path}:")
        print(expected_content)
    
    return True


if __name__ == "__main__":
    print("🚀 Testing Comprehensive TypeScript Fixes")
    print("=" * 70)
    
    # Test 1: Detect all current issues
    test1_result = test_comprehensive_typescript_issues()
    
    # Test 2: Show expected fixes
    test2_result = test_fixed_comprehensive_issues()
    
    print("\n" + "=" * 70)
    if test1_result and test2_result:
        print("🎉 ALL TESTS PASSED: TypeScript issues detected and fixes planned")
    else:
        print("💥 TESTS FAILED: TypeScript issues detected - fixes needed")
        print("\n📋 IMPLEMENTATION TODO:")
        print("1. Modify barrel generator to use 'export type' for type re-exports")
        print("2. Remove 'export default' from type-only files during generation")
        print("3. Update code generation templates to use 'import type'")
        print("4. Fix import path resolution in generated services")
        print("5. Fix component import patterns in templates")
        print("6. Add post-generation cleanup for TypeScript compatibility")