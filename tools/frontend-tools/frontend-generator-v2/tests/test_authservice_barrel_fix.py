#!/usr/bin/env python3
"""
Test case for authService barrel export fix.
The issue is that auth.service.ts is a mixed export file (has both default and named exports)
but it doesn't have conflicts, so it should use standard mixed export pattern, not qualified imports.
"""

import tempfile
import shutil
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator

def create_authservice_export_test():
    """Create test structure that reproduces authService export issue"""
    test_dir = Path(tempfile.mkdtemp())
    
    # Create services directory
    services_dir = test_dir / "src" / "services"
    services_dir.mkdir(parents=True)
    
    # Create auth.service.ts with mixed exports (no conflicts)
    auth_service_content = '''// Authentication API service
import type { AuthApiClient } from '../types';

export class AuthService implements AuthApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || '/api';
  }

  async login(credentials: any): Promise<any> {
    // Implementation
    return { success: true };
  }

  async register(userData: any): Promise<any> {
    // Implementation
    return { success: true };
  }

  async logout(): Promise<any> {
    // Implementation
    return { success: true };
  }

  async getCurrentUser(): Promise<any> {
    // Implementation
    return { success: true };
  }

  async verifyToken(token: string): Promise<any> {
    // Implementation
    return { success: true, data: { tokenValid: true } };
  }
}

// Create singleton instance - this is the NAMED export
export const authService = new AuthService();

// Export the service class for custom instances - this is the DEFAULT export
export default AuthService;
'''
    
    # Create a simple second service file to ensure no conflicts
    other_service_content = '''// Another service
export class OtherService {
  getData() {
    return { data: "test" };
  }
}

export const otherService = new OtherService();
export default OtherService;
'''
    
    (services_dir / "auth.service.ts").write_text(auth_service_content)
    (services_dir / "other.service.ts").write_text(other_service_content)
    
    return test_dir

def test_authservice_barrel_export():
    """Test that authService is exported correctly without qualified imports"""
    print("🧪 Testing authService barrel export pattern...")
    
    # Create test structure
    test_dir = create_authservice_export_test()
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
        
        # Check if authService uses correct export pattern
        uses_qualified_import = "export * as authService from './auth.service'" in barrel_content
        uses_mixed_export = ("export * from './auth.service'" in barrel_content and 
                            "export { default as authService } from './auth.service'" in barrel_content)
        
        print(f"✅ Uses qualified import (wrong): {uses_qualified_import}")
        print(f"✅ Uses mixed export pattern (correct): {uses_mixed_export}")
        
        # Validate results
        success = True
        
        if uses_qualified_import:
            print("❌ FAIL: authService uses qualified import instead of mixed export")
            print("  This causes 'Property does not exist' errors when importing { authService }")
            success = False
        elif uses_mixed_export:
            print("✅ PASS: authService uses correct mixed export pattern")
        else:
            print("⚠️  WARNING: authService export pattern not detected")
            
        # Check conflicts detected
        auth_conflicts = [
            conflict for conflict in generator.conflicts 
            if any('auth.service' in str(f) for f in conflict.files)
        ]
        
        print(f"🔍 AuthService conflicts detected: {len(auth_conflicts)}")
        
        if auth_conflicts:
            print("❌ FAIL: False conflicts detected for authService")
            for conflict in auth_conflicts:
                print(f"  - Conflict: {conflict.export_name} in {[f.name for f in conflict.files]}")
            success = False
        else:
            print("✅ PASS: No false conflicts detected for authService")
        
        return success, test_dir
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False, test_dir

if __name__ == "__main__":
    print("🧪 Running AuthService Barrel Export Test...\n")
    
    print("=" * 60)
    print("TEST: AuthService barrel export pattern")
    print("=" * 60)
    success, test_dir = test_authservice_barrel_export()
    
    print(f"\n{'='*60}")
    print("FINAL RESULTS:")
    print(f"{'='*60}")
    
    if success:
        print("✅ TEST PASSED: AuthService barrel export works correctly")
    else:
        print("❌ TEST FAILED: AuthService barrel export needs fixing")
        print("\nThe issue:")
        print("- authService should be exported as { authService } from barrel")
        print("- Not as namespace import: authService.login() vs authService.authService.login()")
        print("- Mixed export files without conflicts should use standard mixed pattern")
        
    print(f"\n📁 Test files: {test_dir}")
    print("🧹 Clean up test directory when done testing")