#!/usr/bin/env python3
"""
Test case for type-only import detection and fixing.

This test reproduces the issue where:
1. A file imports types with regular import syntax
2. TypeScript with verbatimModuleSyntax enabled requires type-only imports for types
3. The generator should detect and convert these to 'import type' statements
"""

import os
import tempfile
import shutil
from pathlib import Path

def test_type_only_imports_detection():
    """Test that the barrel generator detects and fixes type-only imports"""
    
    # Create temporary test structure
    with tempfile.TemporaryDirectory() as temp_dir:
        test_root = Path(temp_dir) / "test_project"
        test_root.mkdir(parents=True)
        
        # Create src directory structure
        src_dir = test_root / "src"
        hooks_dir = src_dir / "hooks" / "authentication" 
        types_dir = src_dir / "types" / "authentication"
        hooks_dir.mkdir(parents=True)
        types_dir.mkdir(parents=True)
        
        # Create type definition file
        type_definition_content = '''export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface UserSessionCreate {
  user_id: string;
  token: string;
  expires_at: string;
}

export interface UserSessionUpdate {
  token?: string;
  expires_at?: string;
}
'''
        
        # Create hook file with incorrect regular import (should be type-only)
        hook_content = '''import { useState, useEffect, useCallback } from 'react';
import { UserSession } from '../../types/authentication/user_sessions';
import userSessionService from '../../services/authentication/userSessionService';

export const useUserSession = () => {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchUserSession = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await userSessionService.getById(id);
      setUserSession(response.data);
    } catch (error) {
      console.error('Failed to fetch user session:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    userSession,
    userSessions,
    loading,
    fetchUserSession
  };
};
'''
        
        # Write test files
        (types_dir / "user_sessions.ts").write_text(type_definition_content)
        (hooks_dir / "useUserSession.ts").write_text(hook_content)
        
        # Copy the barrel generator to test directory
        generator_source = Path("/Users/chris/Projects/llm-api-vault-v2/tools/frontend-tools/frontend-generator-v2/core/advanced_barrel_generator.py")
        generator_dest = test_root / "advanced_barrel_generator.py"
        shutil.copy2(generator_source, generator_dest)
        
        print("=== Testing type-only import detection ===")
        print(f"Test structure created at: {test_root}")
        
        # Import and run the barrel generator
        import sys
        sys.path.insert(0, str(test_root))
        
        try:
            from advanced_barrel_generator import AdvancedBarrelGenerator
            
            # Initialize barrel generator
            barrel_gen = AdvancedBarrelGenerator(src_dir)
            
            # This should detect the type-only import issue and fix it
            barrel_gen._fix_type_only_imports()
            
            # Check if the import was converted to type-only
            hook_fixed = (hooks_dir / "useUserSession.ts").read_text()
            
            if "import type { UserSession }" in hook_fixed:
                print("✅ SUCCESS: Type-only import was detected and fixed!")
                print("Fixed useUserSession.ts now uses 'import type' for UserSession")
                return True
            else:
                print("❌ FAILED: Type-only import was not detected or fixed")
                print("Current content:")
                print(hook_fixed[:500] + "..." if len(hook_fixed) > 500 else hook_fixed)
                return False
                
        except ImportError as e:
            print(f"❌ FAILED: Could not import barrel generator: {e}")
            return False
        except AttributeError as e:
            print(f"❌ FAILED: Barrel generator missing method: {e}")
            print("Need to implement _fix_type_only_imports method")
            return False
        finally:
            sys.path.remove(str(test_root))

if __name__ == "__main__":
    success = test_type_only_imports_detection()
    exit(0 if success else 1)