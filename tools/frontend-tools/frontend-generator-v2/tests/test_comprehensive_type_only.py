#!/usr/bin/env python3
"""
Comprehensive test for type-only import detection that should:
1. Convert actual type-only usage to 'import type'
2. Preserve value usage as regular imports 
3. Correctly handle JSX components, functions, etc.
"""

import os
import tempfile
import shutil
from pathlib import Path

def test_comprehensive_type_only_imports():
    """Test that type-only detection works correctly for both cases"""
    
    # Create temporary test structure
    with tempfile.TemporaryDirectory() as temp_dir:
        test_root = Path(temp_dir) / "test_project"
        test_root.mkdir(parents=True)
        
        # Create src directory structure
        src_dir = test_root / "src"
        components_dir = src_dir / "components"
        hooks_dir = src_dir / "hooks"
        types_dir = src_dir / "types"
        components_dir.mkdir(parents=True)
        hooks_dir.mkdir(parents=True) 
        types_dir.mkdir(parents=True)
        
        # Create type definitions
        type_defs = '''export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserConfig {
  theme: string;
  settings: Record<string, any>;
}
'''
        
        # Create component that mixes JSX (value) and type usage
        component_with_mixed_usage = '''import { useState } from 'react';
import { Settings, LogOut, User } from 'lucide-react';
import { User, UserConfig } from '../types/user';

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<UserConfig>({
    theme: 'dark',
    settings: {}
  });
  
  return (
    <div>
      <Settings className="w-5 h-5" />
      <LogOut className="w-5 h-5" />
      <User className="w-5 h-5" />
      <h1>{user?.name}</h1>
    </div>
  );
}
'''
        
        # Create hook with type-only usage
        hook_with_type_only = '''import { useState } from 'react';
import { User, UserConfig } from '../types/user';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<UserConfig | null>(null);
  
  return { user, users, config, setUser, setUsers, setConfig };
}
'''
        
        # Write test files
        (types_dir / "user.ts").write_text(type_defs)
        (components_dir / "UserProfile.tsx").write_text(component_with_mixed_usage)
        (hooks_dir / "useUser.ts").write_text(hook_with_type_only)
        
        # Copy the barrel generator to test directory
        generator_source = Path("/Users/chris/Projects/llm-api-vault-v2/tools/frontend-tools/frontend-generator-v2/core/advanced_barrel_generator.py")
        generator_dest = test_root / "advanced_barrel_generator.py"
        shutil.copy2(generator_source, generator_dest)
        
        print("=== Testing comprehensive type-only import detection ===")
        
        # Import and run the barrel generator
        import sys
        sys.path.insert(0, str(test_root))
        
        try:
            from advanced_barrel_generator import AdvancedBarrelGenerator
            
            # Initialize barrel generator
            barrel_gen = AdvancedBarrelGenerator(src_dir)
            
            # Run type-only import fixing
            barrel_gen._fix_type_only_imports()
            
            # Check results
            component_fixed = (components_dir / "UserProfile.tsx").read_text()
            hook_fixed = (hooks_dir / "useUser.ts").read_text()
            
            print("Component file after processing:")
            print(component_fixed)
            print("\nHook file after processing:")
            print(hook_fixed)
            
            # Validate component - should handle mixed usage correctly
            component_correct = (
                # JSX components should remain regular imports
                "import { Settings, LogOut, User } from 'lucide-react';" in component_fixed and
                # UserConfig should be type-only (only used in type annotations)
                "import type { UserConfig }" in component_fixed and
                # User from types should remain regular because it's used as JSX component
                ("import { User } from '../types/user';" in component_fixed or
                 "import type { User }" not in component_fixed)  # Either regular import or no type-only conversion
            )
            
            # Validate hook - should have type-only imports for types
            hook_correct = (
                # React hooks should remain regular
                "import { useState } from 'react';" in hook_fixed and
                # Types should be type-only 
                "import type { User, UserConfig } from '../types/user';" in hook_fixed
            )
            
            if component_correct and hook_correct:
                print("✅ SUCCESS: Generator correctly handled mixed usage!")
                print("- JSX components preserved as regular imports")
                print("- Type-only annotations converted appropriately")
                print("- Value usage correctly detected and preserved")
                return True
            else:
                print("❌ FAILED: Generator didn't handle mixed usage correctly")
                if not component_correct:
                    print("- Component imports not handled correctly")
                    print(f"  Expected JSX imports preserved and UserConfig as type-only")
                    print(f"  Actual component content: {component_fixed}")
                if not hook_correct:
                    print("- Hook imports not handled correctly")
                    print(f"  Actual hook content: {hook_fixed}")
                return False
                
        except Exception as e:
            print(f"❌ FAILED: Error during processing: {e}")
            return False
        finally:
            sys.path.remove(str(test_root))

if __name__ == "__main__":
    success = test_comprehensive_type_only_imports()
    exit(0 if success else 1)