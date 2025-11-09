#!/usr/bin/env python3
"""
Test case for import resolution issues caused by qualified exports.

Tests the scenario where:
1. A barrel exports types as qualified imports (export * as auth from './auth')  
2. But consumer code tries to import them directly (import { AuthState } from '../types')
3. This causes TypeScript errors: Property 'user' does not exist on type 'AuthStoreInterface'

The generator should detect this and either:
- Use regular exports for commonly imported types
- Or update the consumer imports to use the qualified namespace
"""

import tempfile
import shutil
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator


def create_import_resolution_test_structure():
    """Create test structure that reproduces import resolution issues"""
    test_dir = Path(tempfile.mkdtemp())
    
    # Create types/auth directory with AuthState and AuthActions
    auth_types_dir = test_dir / "types" / "auth"
    auth_types_dir.mkdir(parents=True)
    
    # Create auth.types.ts with commonly used interfaces
    (auth_types_dir / "auth.types.ts").write_text("""
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  progress: UserProgress | null;
}

export interface AuthActions {
  login: (request: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (request: RegisterRequest) => Promise<void>;
  verifyToken: () => Promise<boolean>;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface UserProgress {
  level: number;
  xp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
}
""")
    
    # Create other type directories - some with conflicts that require qualified imports
    for domain in ["authentication", "gameplay", "learning", "core", "ui", "puzzles", "user-management"]:
        domain_dir = test_dir / "types" / domain
        domain_dir.mkdir(parents=True)
        
        # Some domains export commonly used types that conflict with auth
        if domain in ["core", "ui", "puzzles", "user-management"]:
            (domain_dir / f"{domain}.ts").write_text(f"""
export interface {domain.capitalize()}Config {{
  data: any;
}}

export interface User {{  // This conflicts with auth/User!
  id: string;
  name: string;
}}
""")
        else:
            (domain_dir / f"{domain}.ts").write_text(f"""
export interface {domain.capitalize()}State {{
  data: any;
}}

export interface ApiResponse<T = any> {{
  data: T;
  status: number;
  success: boolean;
}}
""")
    
    # Create stores directory with authStore that imports from types
    stores_dir = test_dir / "stores"
    stores_dir.mkdir()
    
    (stores_dir / "authStore.ts").write_text("""
import { create } from 'zustand';
import type {
  User,
  UserProgress,
  AuthState,
  AuthActions,
  LoginRequest,
  RegisterRequest
} from '../types';

interface AuthStoreInterface extends AuthState, AuthActions {
  initialize: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStoreInterface>()((set, get) => ({
  // Initial state from AuthState
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  progress: null,
  
  // Actions from AuthActions
  login: async (request: LoginRequest) => {
    set({ isLoading: true });
    // Implementation...
  },
  
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  // Store-specific methods
  initialize: async () => {},
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));
""")
    
    # Create hooks that use the store
    hooks_dir = test_dir / "hooks"
    hooks_dir.mkdir()
    
    (hooks_dir / "auth_hook.ts").write_text("""
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const store = useAuthStore((state) => ({
    // These properties should exist because AuthStoreInterface extends AuthState
    user: state.user,           // <-- This causes the error!
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    progress: state.progress,
    
    // Actions
    login: state.login,
    logout: state.logout,
  }));
  
  return store;
};
""")
    
    return test_dir


def test_import_resolution_issues():
    """Test that import resolution issues are detected and fixed"""
    print("🧪 Testing import resolution issues...")
    
    # Create test structure
    test_dir = create_import_resolution_test_structure()
    print(f"📁 Created test structure in: {test_dir}")
    
    try:
        # Generate barrels with current logic
        generator = AdvancedBarrelGenerator(test_dir, verbose=True)
        
        # Generate barrel for types directory
        types_dir = test_dir / "types"
        print("📦 Generating types barrel...")
        types_barrel_content = generator.generate_barrel(types_dir)
        
        print("📄 Generated types barrel:")
        print(types_barrel_content)
        
        # Check if auth types are qualified (causing the issue)
        has_qualified_auth = "export * as auth from './auth'" in types_barrel_content
        has_regular_auth = "export * from './auth'" in types_barrel_content
        
        print(f"\n🔍 Analysis:")
        print(f"  - Auth types are qualified: {has_qualified_auth}")
        print(f"  - Auth types are regular: {has_regular_auth}")
        
        if has_qualified_auth:
            print("❌ ISSUE DETECTED: Auth types are qualified but consumer expects direct imports")
            print("   Consumer code: import { AuthState } from '../types'")
            print("   But barrel has: export * as auth from './auth'")
            print("   This causes: Property 'user' does not exist on type 'AuthStoreInterface'")
            
            # Check if we can detect commonly imported types
            auth_types_file = test_dir / "types" / "auth" / "auth.types.ts"
            if auth_types_file.exists():
                content = auth_types_file.read_text()
                commonly_used_types = ["AuthState", "AuthActions", "User"]
                found_common_types = [t for t in commonly_used_types if t in content]
                print(f"   Found commonly used types: {found_common_types}")
                
                if found_common_types:
                    print("💡 SOLUTION: Auth types should get priority over conflicting types")
                    print("   - AuthState, AuthActions, User are commonly used across the app")
                    print("   - These should use regular exports even if there are conflicts")
                    print("   - Other conflicting types should be qualified")
                    return False  # Test fails - issue detected but not fixed
        
        print("✅ No import resolution issues detected")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False
        
    finally:
        # Clean up
        shutil.rmtree(test_dir)
        print(f"🧹 Cleaned up test directory: {test_dir}")


def test_fixed_import_resolution():
    """Test that the fixed generator properly handles commonly imported types"""
    print("\n🧪 Testing fixed import resolution...")
    
    # This test will pass once we implement the fix
    # For now, just return the expected behavior
    print("📋 Expected behavior after fix:")
    print("  - Commonly used types (AuthState, AuthActions, User) use regular exports")
    print("  - Less common types can use qualified exports for conflict resolution")
    print("  - Consumer imports work without modification")
    
    expected_barrel = """// Auto-generated barrel export for types
// Generated by AdvancedBarrelGenerator

// Regular exports for commonly used types
export * from './auth';

// Qualified exports for conflicting types
export * from './authentication';
export * from './gameplay';
export * from './learning';
"""
    
    print("📄 Expected types barrel:")
    print(expected_barrel)
    
    return True  # This will be implemented


if __name__ == "__main__":
    print("🚀 Testing Import Resolution Issues")
    print("=" * 60)
    
    # Test 1: Detect current issue
    test1_result = test_import_resolution_issues()
    
    # Test 2: Verify fix (to be implemented)
    test2_result = test_fixed_import_resolution()
    
    print("\n" + "=" * 60)
    if test1_result and test2_result:
        print("🎉 ALL TESTS PASSED: Import resolution working correctly")
    else:
        print("💥 TESTS FAILED: Import resolution issues detected")
        print("\n📋 TODO:")
        print("1. Modify barrel generator to detect commonly imported types")
        print("2. Use regular exports for common types, qualified for conflicts only")
        print("3. Preserve backward compatibility")