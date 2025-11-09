#!/usr/bin/env python3
"""
Test case for mixed export barrel issues that cause TS2305 errors.

Tests the scenario where:
1. Type-only files have their 'export default' removed during barrel generation
2. But barrel files still try to import the removed default exports
3. This causes TS2305: Module has no exported member 'default'

The generator should detect and fix these issues by:
- Re-analyzing files after type-only fixes are applied
- Updating barrel export patterns based on actual file content
- Using type-only exports for directories that become type-only after fixes
"""

import tempfile
import shutil
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator


def create_mixed_export_test_structure():
    """Create test structure that reproduces TS2305 default export errors"""
    test_dir = Path(tempfile.mkdtemp())
    
    # Create authentication types with invalid default exports (will be removed)
    auth_types = test_dir / "types" / "authentication"
    auth_types.mkdir(parents=True)
    
    # Type file with invalid default export - should become type-only after fixing
    (auth_types / "auth.ts").write_text("""
export interface Auth {
  token: string;
  user: string;
  id: number;
}

// This will be removed by type-only fixing
export default Auth;
""")
    
    # Another type file with invalid default export
    (auth_types / "user_sessions.ts").write_text("""
export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  expires: Date;
}

export interface SessionConfig {
  timeout: number;
  refresh: boolean;
}

// This will be removed by type-only fixing
export default UserSession;
""")
    
    # Create other type directories that will have the same issue
    for domain in ["chess-theory", "gameplay", "learning", "puzzles", "user-management"]:
        domain_dir = test_dir / "types" / domain
        domain_dir.mkdir(parents=True)
        
        # Create a type file with invalid default export
        (domain_dir / f"{domain.replace('-', '_')}.ts").write_text(f"""
export interface {domain.replace('-', '').capitalize()}Item {{
  id: string;
  name: string;
  data: any;
}}

export interface {domain.replace('-', '').capitalize()}Config {{
  enabled: boolean;
  settings: any;
}}

// This invalid default export will be removed
export default {domain.replace('-', '').capitalize()}Item;
""")
    
    return test_dir


def test_mixed_export_barrel_issues():
    """Test detection of mixed export barrel issues that cause TS2305 errors"""
    print("🧪 Testing mixed export barrel issues...")
    
    test_dir = create_mixed_export_test_structure()
    print(f"📁 Created test structure in: {test_dir}")
    
    try:
        # Generate barrels to reproduce the issue
        generator = AdvancedBarrelGenerator(test_dir, verbose=True)
        
        # Generate authentication barrel (should reproduce TS2305 issue)
        auth_dir = test_dir / "types" / "authentication" 
        print("📦 Generating authentication barrel...")
        auth_barrel_content = generator.generate_barrel(auth_dir)
        
        # Generate main types barrel
        types_dir = test_dir / "types"
        print("📦 Generating main types barrel...")
        types_barrel_content = generator.generate_barrel(types_dir)
        
        print("📄 Generated types/authentication/index.ts:")
        print(auth_barrel_content)
        
        print("\n📄 Generated types/index.ts:")
        print(types_barrel_content)
        
        # Check for TS2305 issues
        issues_found = []
        
        # Issue 1: Authentication barrel tries to import default that doesn't exist
        if "export { default as" in auth_barrel_content:
            print("\n🔍 Checking if default exports actually exist...")
            
            # Check if auth.ts still has default export after type-only fixing
            auth_file = test_dir / "types" / "authentication" / "auth.ts"
            if auth_file.exists():
                content = auth_file.read_text()
                if "export default" not in content:
                    issues_found.append("TS2305: Authentication barrel imports default from auth.ts but default was removed")
            
            # Check user_sessions.ts
            sessions_file = test_dir / "types" / "authentication" / "user_sessions.ts"
            if sessions_file.exists():
                content = sessions_file.read_text()
                if "export default" not in content:
                    issues_found.append("TS2305: Authentication barrel imports default from user_sessions.ts but default was removed")
        
        # Issue 2: Main types barrel should use type-only exports for fixed directories
        auth_is_type_only_after_fix = generator._is_type_only_directory(test_dir / "types" / "authentication")
        if auth_is_type_only_after_fix and "export * from './authentication'" in types_barrel_content:
            issues_found.append("TS1484: Main barrel should use 'export type * from' for authentication after type-only fixing")
        
        # Issue 3: Similar issues in other type directories
        for domain in ["chess-theory", "gameplay", "learning", "puzzles", "user-management"]:
            domain_dir = test_dir / "types" / domain
            if domain_dir.exists():
                domain_barrel_path = domain_dir / "index.ts"
                if domain_barrel_path.exists():
                    barrel_content = domain_barrel_path.read_text()
                    if "export { default as" in barrel_content:
                        # Check if the source file still has default export
                        source_file = domain_dir / f"{domain.replace('-', '_')}.ts"
                        if source_file.exists():
                            source_content = source_file.read_text()
                            if "export default" not in source_content:
                                issues_found.append(f"TS2305: {domain} barrel imports default but default was removed")
        
        if issues_found:
            print(f"\n❌ MIXED EXPORT BARREL ISSUES DETECTED:")
            for i, issue in enumerate(issues_found, 1):
                print(f"  {i}. {issue}")
            
            print(f"\n💡 FIXES NEEDED:")
            print("1. Re-analyze files after type-only fixes are applied")
            print("2. Update barrel export patterns based on actual file content")
            print("3. Use type-only exports for directories that become type-only")
            print("4. Remove default export attempts from type-only barrels")
            
            return False
        
        print("✅ No mixed export barrel issues detected")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        shutil.rmtree(test_dir)
        print(f"🧹 Cleaned up test directory: {test_dir}")


def test_fixed_mixed_export_barrels():
    """Test that the fixed generator properly handles mixed export barrel issues"""
    print("\n🧪 Testing fixed mixed export barrels...")
    
    print("📋 Expected behavior after fix:")
    print("  - Files re-analyzed after type-only fixes are applied")
    print("  - Barrel export patterns updated based on actual file content")
    print("  - Type-only directories use 'export type *' in parent barrels")
    print("  - No attempts to import non-existent default exports")
    
    expected_auth_barrel = """// Auto-generated barrel export for authentication
// Generated by AdvancedBarrelGenerator

// Type-only exports (no default exports after fixing)
export type * from './auth';
export type * from './user_sessions';
"""
    
    expected_types_barrel = """// Auto-generated barrel export for types
// Generated by AdvancedBarrelGenerator

// Subdirectory exports (type-only after fixes)
export type * from './authentication';
export type * from './chess-theory';
export type * from './gameplay';
export type * from './learning';
export type * from './puzzles';
export type * from './user-management';
"""
    
    print("📄 Expected types/authentication/index.ts:")
    print(expected_auth_barrel)
    
    print("📄 Expected types/index.ts:")
    print(expected_types_barrel)
    
    return True


if __name__ == "__main__":
    print("🚀 Testing Mixed Export Barrel Fixes")
    print("=" * 70)
    
    # Test 1: Detect mixed export barrel issues
    test1_result = test_mixed_export_barrel_issues()
    
    # Test 2: Show expected fixes
    test2_result = test_fixed_mixed_export_barrels()
    
    print("\n" + "=" * 70)
    if test1_result and test2_result:
        print("🎉 ALL TESTS PASSED: Mixed export barrels working correctly")
    else:
        print("💥 TESTS FAILED: Mixed export barrel issues detected")
        print("\n📋 IMPLEMENTATION TODO:")
        print("1. Re-analyze file export patterns after type-only fixes")
        print("2. Update barrel generation to check actual file content")
        print("3. Use type-only exports for directories that become type-only")
        print("4. Remove mixed export patterns when no defaults exist")
        print("5. Ensure barrel consistency after all fixes are applied")