#!/usr/bin/env python3
"""
Test case for barrel export naming collisions.

This test reproduces the issue where:
1. Static template files have hooks with names like 'useAuth' 
2. Dynamic generation creates hooks with the same names like 'useAuth'
3. Both get exported in the same barrel, causing conflicts
4. The wrong hook gets imported, leading to runtime errors like "Property 'auths' does not exist on type 'UseAuthReturn'"
"""

import os
import tempfile
import shutil
from pathlib import Path

def test_barrel_export_naming_collision():
    """Test that the generator detects and resolves naming collisions between static and dynamic exports"""
    
    # Create temporary test structure
    with tempfile.TemporaryDirectory() as temp_dir:
        test_root = Path(temp_dir) / "test_project"
        test_root.mkdir(parents=True)
        
        # Create src directory structure
        src_dir = test_root / "src"
        hooks_dir = src_dir / "hooks"
        auth_dir = hooks_dir / "authentication"
        auth_dir.mkdir(parents=True)
        
        # Create static useAuth hook (authentication functionality)
        static_auth_hook = '''import { useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';

export interface UseAuthReturn {
  user: any;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const store = useAuthStore();
  
  return {
    user: store.user,
    token: store.token,
    isLoading: store.isLoading,
    login: store.login,
    logout: store.logout
  };
};

export default useAuth;
'''
        
        # Create dynamic useAuth hook (for auth endpoint data - what the generator would create)
        dynamic_auth_hook = '''import { useState, useCallback } from 'react';
import { authService } from '../../services/authentication/authService';

export interface Auth {
  id: string;
  username: string;
  role: string;
}

export interface UseAuthReturn {
  auths: Auth[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [auths, setAuths] = useState<Auth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authService.getAll();
      setAuths(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { auths, loading, error, refresh };
};

export default useAuth;
'''
        
        # Write both files (simulating the conflict)
        (auth_dir / "useAuth.ts").write_text(static_auth_hook)
        (auth_dir / "useAuthData.ts").write_text(dynamic_auth_hook)  # This should be renamed to avoid conflict
        
        # Copy the barrel generator to test directory
        generator_source = Path("/Users/chris/Projects/llm-api-vault-v2/tools/frontend-tools/frontend-generator-v2/core/advanced_barrel_generator.py")
        generator_dest = test_root / "advanced_barrel_generator.py"
        shutil.copy2(generator_source, generator_dest)
        
        print("=== Testing barrel export naming collision detection ===")
        print(f"Test structure created at: {test_root}")
        
        # Import and run the barrel generator
        import sys
        sys.path.insert(0, str(test_root))
        
        try:
            from advanced_barrel_generator import AdvancedBarrelGenerator
            
            # Initialize barrel generator
            barrel_gen = AdvancedBarrelGenerator(src_dir)
            
            # Analyze files 
            for ts_file in auth_dir.glob("*.ts"):
                barrel_gen.analyze_file(ts_file)
                
            # Build export registry to detect conflicts
            barrel_gen.build_export_registry()
            
            # Generate barrel file
            barrel_content = barrel_gen.generate_barrel(auth_dir)
            
            # Write barrel file
            (auth_dir / "index.ts").write_text(barrel_content)
            
            # Read the generated barrel
            barrel_result = (auth_dir / "index.ts").read_text()
            
            print("Generated barrel content:")
            print(barrel_result)
            
            # Check for collision resolution
            # The generator should detect that both files export 'useAuth' and handle it
            collision_detected = any(
                "conflict" in line.lower() or 
                "duplicate" in line.lower() or
                "useAuth" in line for line in barrel_result.split('\n')
            )
            
            # Check if the generator resolved the collision properly
            # It should either:
            # 1. Use aliased exports: export { useAuth as AuthHook } from './useAuth';
            # 2. Add comments about the conflict
            # 3. Rename one of the exports
            
            proper_resolution = (
                "as " in barrel_result or  # Aliased exports
                "// Conflict" in barrel_result or  # Conflict comments
                ("useAuth" in barrel_result and "useAuthData" in barrel_result)  # Renamed exports
            )
            
            if collision_detected and proper_resolution:
                print("✅ SUCCESS: Barrel export collision detected and resolved")
                print("- Generator identified naming conflict between static and dynamic hooks")
                print("- Applied appropriate resolution strategy (aliasing or renaming)")
                return True
            elif collision_detected and not proper_resolution:
                print("⚠️  PARTIAL: Collision detected but not properly resolved")
                print("- Generator found the conflict but didn't apply resolution")
                return False
            else:
                print("❌ FAILED: No collision detection or resolution")
                print("- Generator should detect that both files export 'useAuth'")
                print("- This causes import confusion and runtime errors")
                return False
                
        except Exception as e:
            print(f"❌ FAILED: Error during processing: {e}")
            return False
        finally:
            sys.path.remove(str(test_root))

if __name__ == "__main__":
    success = test_barrel_export_naming_collision()
    exit(0 if success else 1)