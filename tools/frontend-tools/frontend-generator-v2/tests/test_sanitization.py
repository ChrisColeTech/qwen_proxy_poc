#!/usr/bin/env python3
"""
Test case for filename sanitization in barrel generator.
Files with dots, dashes, and other special characters need to be 
sanitized when used as JavaScript import identifiers.
"""

import tempfile
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator

def test_filename_sanitization():
    """Test barrel generation with problematic filenames"""
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "services"
        test_dir.mkdir(parents=True)
        
        # Create file with dots in name (like auth.service.ts)
        service_file = test_dir / "auth.service.ts"
        service_file.write_text("""
export class AuthService {
  login() { return "logged in"; }
}

export default AuthService;
""")

        # Create file with dashes
        dash_file = test_dir / "user-profile.service.ts"
        dash_file.write_text("""
export class UserProfileService {
  getProfile() { return {}; }
}

export default UserProfileService;
""")
        
        print("=== Testing Filename Sanitization ===")
        
        # Generate barrel
        barrel_generator = AdvancedBarrelGenerator(temp_path, verbose=True)
        
        # Analyze files
        tsx_files = list(test_dir.glob("*.ts"))
        for file_path in tsx_files:
            analysis = barrel_generator.analyze_file(file_path)
            
        barrel_generator.build_export_registry()
        barrel_content = barrel_generator.generate_barrel(test_dir)
        
        print(f"=== Generated Barrel Content ===")
        print(barrel_content)
        
        # Check for syntax issues
        issues = []
        
        if "auth.service_default" in barrel_content:
            issues.append("❌ Contains dot in import name: auth.service_default")
        
        if "user-profile_default" in barrel_content or "user-profile.service_default" in barrel_content:
            issues.append("❌ Contains dash in import name")
            
        # Should contain sanitized camelCase names  
        if "authService" not in barrel_content and "auth.service" in str(service_file):
            issues.append("❌ Missing sanitized import name for auth.service")
            
        if "userProfileService" not in barrel_content and "user-profile" in str(dash_file):
            issues.append("❌ Missing sanitized import name for user-profile")
        
        # Test JavaScript syntax validity (basic check)
        import_lines = [line for line in barrel_content.split('\n') if line.strip().startswith('import')]
        for line in import_lines:
            if '.' in line.split('from')[0] and 'from' in line:
                # Extract import name
                import_part = line.split('from')[0].replace('import', '').strip()
                if '.' in import_part and not import_part.startswith('"') and not import_part.startswith("'"):
                    issues.append(f"❌ Invalid import syntax: {line}")
        
        if issues:
            print(f"\n=== Issues Found ===")
            for issue in issues:
                print(f"  {issue}")
            return False
        else:
            print("✅ All filenames properly sanitized for JavaScript")
            return True

if __name__ == "__main__":
    success = test_filename_sanitization()
    exit(0 if success else 1)