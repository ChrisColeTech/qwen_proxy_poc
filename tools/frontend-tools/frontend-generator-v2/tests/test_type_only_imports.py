"""
Test cases for type-only import detection and fixes
"""
import pytest
import tempfile
from pathlib import Path
from generators.hooks.hooks_generator import HooksGenerator

class TestTypeOnlyImports:
    
    def test_detects_type_only_import_violations(self):
        """Test detection of verbatimModuleSyntax type-only import violations"""
        
        # Create sample hook with type-only import violations
        hook_content = '''import { useState, useCallback } from 'react';
import { User } from '../../types/user-management/users';
import userService from '../../services/user-management/usersService';

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  return { user, loading };
};'''
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            gen = HooksGenerator(temp_path)
            
            # Test type-only import detection
            violations = gen._detect_type_only_import_violations(hook_content)
            
            assert len(violations) == 1
            assert violations[0]['import_name'] == 'User'
            assert violations[0]['from_path'] == '../../types/user-management/users'
    
    def test_fixes_type_only_import_violations(self):
        """Test automatic fixing of type-only imports"""
        
        hook_content = '''import { useState, useCallback } from 'react';
import { User } from '../../types/user-management/users';
import userService from '../../services/user-management/usersService';

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  return { user };
};'''
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            gen = HooksGenerator(temp_path)
            
            # Fix type-only imports
            fixed_content = gen._fix_type_only_imports(hook_content)
            
            # Should convert to type-only import
            assert 'import type { User } from \'../../types/user-management/users\';' in fixed_content
            assert 'import { User }' not in fixed_content
    
    def test_detects_property_access_errors(self):
        """Test detection of invalid property access in generated hooks"""
        
        # Mock endpoint config that would cause .data property access issues
        endpoint_config = {
            'entity': 'User',
            'methods': ['listUsers', 'getUserById']
        }
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            gen = HooksGenerator(temp_path)
            
            # Generate hook content
            hook_content = gen._generate_config_driven_hook('User', 'users', 
                                                           endpoint_config['methods'], 
                                                           'user-management')
            
            # Test that it doesn't try to access .data on array returns
            violations = gen._detect_property_access_violations(hook_content)
            
            # Should detect if code tries to access .data on list responses
            for violation in violations:
                assert 'data' in violation['property']
    
    def test_fixes_property_access_errors(self):
        """Test automatic fixing of property access errors"""
        
        # Content with property access violations
        hook_content = '''const response = await userService.listUsers();
set Users(response.data);  // Wrong - response is already the data
return response.data;  // Wrong - should return response directly'''
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            gen = HooksGenerator(temp_path)
            
            # Fix property access violations
            fixed_content = gen._fix_property_access_violations(hook_content)
            
            # Should remove .data access for list methods
            assert 'response.data' not in fixed_content
            assert 'setUsers(response)' in fixed_content
            assert 'return response' in fixed_content


class TestBarrelExports:
    
    def test_detects_barrel_export_mismatches(self):
        """Test detection of barrel export/import mismatches"""
        
        # Mock file that exports named exports but barrel tries default import
        file_content = '''export const useAuth = () => { /* ... */ };
export const useLogin = () => { /* ... */ };'''
        
        barrel_content = '''export { default as useAuth } from './useAuth';'''
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            gen = HooksGenerator(temp_path)
            
            # Test barrel mismatch detection
            mismatches = gen._detect_barrel_export_mismatches(file_content, barrel_content)
            
            assert len(mismatches) > 0
            assert any('default' in mismatch['issue'] for mismatch in mismatches)
    
    def test_fixes_barrel_export_mismatches(self):
        """Test automatic fixing of barrel export mismatches"""
        
        file_content = '''export const useAuth = () => { /* ... */ };
export const useLogin = () => { /* ... */ };'''
        
        barrel_content = '''export { default as useAuth } from './useAuth';
export { default as useLogin } from './useLogin';'''
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            gen = HooksGenerator(temp_path)
            
            # Fix barrel exports
            fixed_barrel = gen._fix_barrel_exports(file_content, barrel_content, 'useAuth')
            
            # Should convert to named exports
            assert 'export { useAuth }' in fixed_barrel
            assert 'default as useAuth' not in fixed_barrel


if __name__ == '__main__':
    pytest.main([__file__])