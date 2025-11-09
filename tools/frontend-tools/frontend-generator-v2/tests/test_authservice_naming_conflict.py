#!/usr/bin/env python3
"""
Test case for authService naming conflict in barrel exports.
The issue is that auth.service.ts exports:
- export class AuthService (named)
- export const authService = new AuthService() (named)  
- export default AuthService (default)

The barrel should not create 'export { default as authService }' because 
there's already a named export 'authService' which should take precedence.
"""

import tempfile
import shutil
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator

def create_authservice_naming_test():
    """Create test structure that reproduces authService naming conflict"""
    test_dir = Path(tempfile.mkdtemp())
    
    # Create services directory
    services_dir = test_dir / "src" / "services"
    services_dir.mkdir(parents=True)
    
    # Create auth.service.ts with conflicting named export and default
    auth_service_content = '''// Authentication API service
export class AuthService {
  login() { return { success: true }; }
  register() { return { success: true }; }
  logout() { return { success: true }; }
}

// Create singleton instance - named export
export const authService = new AuthService();

// Export class as default - creates potential conflict
export default AuthService;
'''
    
    (services_dir / "auth.service.ts").write_text(auth_service_content)
    
    return test_dir

def test_authservice_naming_conflict():
    """Test that authService naming conflict is resolved correctly"""
    print("🧪 Testing authService naming conflict resolution...")
    
    # Create test structure
    test_dir = create_authservice_naming_test()
    services_dir = test_dir / "src" / "services"
    
    try:
        # Initialize barrel generator
        generator = AdvancedBarrelGenerator(services_dir, verbose=True)
        
        # Analyze service files
        print("📋 Analyzing service files...")
        for service_file in services_dir.glob("*.ts"):
            if service_file.name != "index.ts":
                generator.analyze_file(service_file)
                
        # Build export registry
        print("🔍 Building export registry...")
        generator.build_export_registry()
        
        # Generate services barrel
        print("📦 Generating services barrel...")
        barrel_content = generator.generate_barrel(services_dir)
        
        print("📄 Generated services barrel content:")
        print(barrel_content)
        
        # Check for naming conflict issue
        has_wildcard_export = "export * from './auth.service'" in barrel_content
        has_default_alias = "export { default as authService } from './auth.service'" in barrel_content
        
        print(f"✅ Has wildcard export: {has_wildcard_export}")
        print(f"❌ Has conflicting default alias: {has_default_alias}")
        
        # Validate results
        success = True
        
        if has_wildcard_export and has_default_alias:
            print("❌ FAIL: Barrel creates conflicting exports for authService")
            print("  - Named export 'authService' from wildcard: export * from './auth.service'")
            print("  - Default alias 'authService': export { default as authService } from './auth.service'")
            print("  - This causes TypeScript to resolve authService as the class instead of the instance")
            success = False
        elif has_wildcard_export and not has_default_alias:
            print("✅ PASS: Barrel uses wildcard export without conflicting default alias")
            print("  - Named exports (including authService instance) are accessible via wildcard")
            print("  - No conflicting default alias created")
        else:
            print("⚠️  WARNING: Unexpected export pattern")
            
        return success, test_dir
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False, test_dir

if __name__ == "__main__":
    print("🧪 Running AuthService Naming Conflict Test...\n")
    
    print("=" * 60)
    print("TEST: AuthService naming conflict resolution")
    print("=" * 60)
    success, test_dir = test_authservice_naming_conflict()
    
    print(f"\n{'='*60}")
    print("FINAL RESULTS:")
    print(f"{'='*60}")
    
    if success:
        print("✅ TEST PASSED: AuthService naming conflict resolved correctly")
    else:
        print("❌ TEST FAILED: AuthService naming conflict needs fixing")
        print("\nThe issue:")
        print("- When a file has both named export 'authService' and default export 'AuthService'")
        print("- Barrel should not create 'export { default as authService }' alias")
        print("- This creates conflict where authService resolves to class instead of instance")
        print("- Fix: Only use wildcard export when named export with same name exists")
        
    print(f"\n📁 Test files: {test_dir}")
    print("🧹 Clean up test directory when done testing")