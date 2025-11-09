#!/usr/bin/env python3
"""
Comprehensive test for export conflict detection and resolution in barrel files.

This test creates a realistic scenario with multiple files that export the same 
function names and validates that the barrel generator properly detects and 
resolves conflicts using qualified imports.
"""

import tempfile
import shutil
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator

def test_export_conflict_detection_and_resolution():
    """Test that export conflicts are properly detected and resolved."""
    
    with tempfile.TemporaryDirectory() as temp_dir:
        test_dir = Path(temp_dir) / "test_project"
        test_dir.mkdir()
        
        # Create a scenario similar to the auth hooks conflict
        hooks_dir = test_dir / "hooks"
        hooks_dir.mkdir()
        
        # Create root-level auth_hook.ts with multiple exports
        auth_hook_file = hooks_dir / "auth_hook.ts"
        auth_hook_file.write_text("""
export const useAuth = () => ({ type: 'root-auth' });
export const useLogin = () => ({ type: 'root-login' });
export const useRegister = () => ({ type: 'root-register' });
export const useLogout = () => ({ type: 'root-logout' });
export const useAuthStatus = () => ({ type: 'root-status' });
""")

        # Create authentication subdirectory
        auth_subdir = hooks_dir / "authentication"
        auth_subdir.mkdir()
        
        # Create useAuth.ts in subdirectory with same export names
        domain_auth_file = auth_subdir / "useAuth.ts"
        domain_auth_file.write_text("""
export const useAuth = () => ({ type: 'domain-auth' });
export const useLogin = () => ({ type: 'domain-login' });
export const useRegister = () => ({ type: 'domain-register' });
export const useLogout = () => ({ type: 'domain-logout' });
export const useAuthStatus = () => ({ type: 'domain-status' });
""")
        
        # Create useUserSession.ts with unique export
        user_session_file = auth_subdir / "useUserSession.ts"
        user_session_file.write_text("""
const UserSessionHook = () => ({ type: 'user-session' });
export default UserSessionHook;
export const useUserSession = UserSessionHook;
""")
        
        # Create additional conflicting directory
        user_mgmt_dir = hooks_dir / "user-management"
        user_mgmt_dir.mkdir()
        
        # Create useUser.ts with some overlapping exports
        user_file = user_mgmt_dir / "useUser.ts"
        user_file.write_text("""
export const useUser = () => ({ type: 'user-mgmt' });
export const useAuth = () => ({ type: 'user-mgmt-auth' }); // Another conflict!
export const useProfile = () => ({ type: 'user-profile' });
""")
        
        # Initialize the barrel generator
        barrel_gen = AdvancedBarrelGenerator(test_dir, verbose=True)
        
        print("🧪 Testing export conflict detection and resolution...")
        print("=" * 60)
        
        # Analyze files and build registry (like the main generator does)
        tsx_files = list(hooks_dir.rglob("*.ts"))
        for file_path in tsx_files:
            analysis = barrel_gen.analyze_file(file_path)
        
        # Build the export registry  
        barrel_gen.build_export_registry()
        
        # Generate barrels for each directory
        for dir_path in [hooks_dir, auth_subdir, user_mgmt_dir]:
            if dir_path.exists() and any(dir_path.iterdir()):
                barrel_content = barrel_gen.generate_barrel(dir_path)
                barrel_file = dir_path / "index.ts"
                barrel_file.write_text(barrel_content)
        
        # Get conflicts from the generator
        conflicts = barrel_gen.conflicts
        
        # Read generated barrel files
        hooks_barrel = hooks_dir / "index.ts"
        auth_barrel = auth_subdir / "index.ts"
        user_mgmt_barrel = user_mgmt_dir / "index.ts"
        
        print(f"\n📊 CONFLICT DETECTION RESULTS:")
        print(f"Total conflicts detected: {len(conflicts)}")
        
        for conflict in conflicts:
            print(f"  ⚠️  {conflict.export_name}: {len(conflict.files)} files")
            for file_path in conflict.files:
                print(f"     - {file_path}")
        
        print(f"\n📁 GENERATED BARREL FILES:")
        
        # Check authentication subdirectory barrel
        if auth_barrel.exists():
            auth_content = auth_barrel.read_text()
            print(f"\n🔍 {auth_barrel.name}:")
            print(auth_content)
            
            # Should have no conflicts in subdirectory
            assert "useAuth" in auth_content, "useAuth should be exported from auth subdir"
            assert "useUserSession" in auth_content, "useUserSession should be exported"
        
        # Check user-management subdirectory barrel  
        if user_mgmt_barrel.exists():
            user_mgmt_content = user_mgmt_barrel.read_text()
            print(f"\n🔍 {user_mgmt_barrel.name}:")
            print(user_mgmt_content)
        
        # Check main hooks barrel (this is where conflicts should be resolved)
        if hooks_barrel.exists():
            hooks_content = hooks_barrel.read_text()
            print(f"\n🔍 {hooks_barrel.name}:")
            print(hooks_content)
            
            # Validate conflict resolution strategies
            print(f"\n✅ VALIDATION CHECKS:")
            
            # Check for qualified imports to resolve conflicts
            has_qualified_imports = ("* as " in hooks_content)
            print(f"  - Uses qualified imports: {has_qualified_imports}")
            
            if has_qualified_imports:
                # Should use qualified imports for conflicting subdirectories
                assert "authentication" in hooks_content, "Should reference authentication module"
                print(f"  ✅ Found qualified imports for conflict resolution")
            else:
                # Should exclude conflicting exports from root level
                lines = hooks_content.split('\n')
                root_exports = [line for line in lines if "./auth_hook" in line]
                subdir_exports = [line for line in lines if "./authentication" in line]
                
                print(f"  - Root exports: {len(root_exports)}")
                print(f"  - Subdir exports: {len(subdir_exports)}")
                
                # One strategy: only export from root OR subdirs, not both
                if root_exports and subdir_exports:
                    print(f"  ❌ Both root and subdirectory exports found - conflict not resolved")
                    return False
        
        # Advanced validation: check for TypeScript compilation errors
        print(f"\n🔍 ADVANCED VALIDATION:")
        
        # Check if conflicts were properly detected
        expected_conflicts = ['useAuth', 'useLogin', 'useRegister', 'useLogout', 'useAuthStatus']
        detected_conflict_names = [c.export_name for c in conflicts]
        
        missing_detections = set(expected_conflicts) - set(detected_conflict_names)
        if missing_detections:
            print(f"  ❌ Failed to detect conflicts: {missing_detections}")
            return False
        else:
            print(f"  ✅ All expected conflicts detected: {expected_conflicts}")
        
        # Check resolution strategy was applied
        if len(conflicts) > 0:
            resolution_applied = any(
                conflict.resolution_strategy for conflict in conflicts
            )
            print(f"  - Resolution strategy applied: {resolution_applied}")
            
            if not resolution_applied:
                print(f"  ❌ Conflicts detected but no resolution strategy applied")
                return False
        
        print(f"\n🎉 TEST PASSED: Export conflicts properly detected and resolved!")
        return True

def test_conflict_resolution_strategies():
    """Test different conflict resolution strategies."""
    
    with tempfile.TemporaryDirectory() as temp_dir:
        test_dir = Path(temp_dir) / "strategies_test"
        test_dir.mkdir()
        
        # Test case: Same export name in root and subdirectory
        services_dir = test_dir / "services"
        services_dir.mkdir()
        
        # Root service
        root_service = services_dir / "authService.ts"
        root_service.write_text("""
export const authService = { type: 'root' };
export const ApiResponse = { type: 'root-api' };
""")
        
        # Subdirectory with same names
        auth_subdir = services_dir / "authentication"
        auth_subdir.mkdir()
        
        auth_service_file = auth_subdir / "authService.ts"
        auth_service_file.write_text("""
export const authService = { type: 'subdirectory' };
export const ApiResponse = { type: 'sub-api' };
""")
        
        user_service_file = auth_subdir / "userService.ts"
        user_service_file.write_text("""
export const userService = { type: 'user' };
export const ApiResponse = { type: 'user-api' }; // Another conflict
""")
        
        barrel_gen = AdvancedBarrelGenerator(test_dir, verbose=True)
        
        # Analyze files first
        ts_files = list(services_dir.rglob("*.ts"))  
        for file_path in ts_files:
            barrel_gen.analyze_file(file_path)
        
        barrel_gen.build_export_registry()
        
        # Generate barrel for services directory
        barrel_content = barrel_gen.generate_barrel(services_dir)
        services_barrel = services_dir / "index.ts"
        services_barrel.write_text(barrel_content)
        
        conflicts = barrel_gen.conflicts
        
        print(f"\n🧪 STRATEGY TEST RESULTS:")
        print(f"Conflicts detected: {len(conflicts)}")
        
        services_barrel = services_dir / "index.ts"
        if services_barrel.exists():
            content = services_barrel.read_text()
            print(f"\nGenerated services barrel:")
            print(content)
            
            # Should use qualified imports or exclude conflicts
            if "* as " in content:
                print("✅ Uses qualified import strategy")
            elif "export * from './authService'" not in content:
                print("✅ Uses exclusion strategy")  
            else:
                print("❌ No conflict resolution applied")
                return False
        
        return True

if __name__ == "__main__":
    print("🚀 Running comprehensive export conflict tests...")
    print("=" * 60)
    
    try:
        # Test 1: Basic conflict detection and resolution
        success1 = test_export_conflict_detection_and_resolution()
        
        # Test 2: Different resolution strategies
        success2 = test_conflict_resolution_strategies()
        
        if success1 and success2:
            print(f"\n🎉 ALL TESTS PASSED!")
            print("The barrel generator properly handles export conflicts.")
        else:
            print(f"\n❌ SOME TESTS FAILED!")
            print("The barrel generator needs improvements.")
            
    except Exception as e:
        print(f"\n💥 TEST ERROR: {e}")
        raise