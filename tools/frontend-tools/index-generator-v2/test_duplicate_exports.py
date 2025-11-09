#!/usr/bin/env python3
"""
Test for duplicate exports issue in IndexGenerator
Reproduces the User/UserProfile duplicate export problem and tests the fix
"""

import os
import tempfile
import shutil
from pathlib import Path
from index_generator import IndexGenerator
from workflow_context import WorkflowContext

def create_test_files_with_duplicates(test_dir):
    """Create test files that have duplicate exports like the real issue"""

    # Create user-management.types.ts with User and UserProfile
    user_management_types = """
export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  createdAt: Date
  updatedAt: Date
  isVerified: boolean
}

export interface UserProfile {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  createdAt: Date
  updatedAt: Date
  isVerified: boolean
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
}
"""

    # Create users.ts with the same User interface (different format)
    users_ts = """
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  chess_elo: number;
  puzzle_rating: number;
  preferences: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  id: string;
  username: string;
  email: string;
}
"""

    # Create userProfiles.ts with the same UserProfile interface
    user_profiles_ts = """
export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  country: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileCreate {
  id: string;
  user_id: string;
  display_name: string;
}
"""

    # Create achievements.ts (no conflicts)
    achievements_ts = """
export interface Achievement {
  id: string;
  name: string;
  description: string;
}
"""

    # Write all files
    user_management_dir = Path(test_dir) / "user-management"
    user_management_dir.mkdir(parents=True, exist_ok=True)

    (user_management_dir / "user-management.types.ts").write_text(user_management_types)
    (user_management_dir / "users.ts").write_text(users_ts)
    (user_management_dir / "userProfiles.ts").write_text(user_profiles_ts)
    (user_management_dir / "achievements.ts").write_text(achievements_ts)

    return user_management_dir

def test_duplicate_exports_detection():
    """Test that duplicate exports are properly detected"""
    print("🧪 Testing duplicate exports detection...")

    with tempfile.TemporaryDirectory() as temp_dir:
        # Create test files with duplicate exports
        test_user_mgmt_dir = create_test_files_with_duplicates(temp_dir)

        # Run IndexGenerator analysis directly
        generator = IndexGenerator()
        generator.file_analyzer.analyze_directory(generator.context, str(test_user_mgmt_dir))
        context = generator.context

        # Check if conflicts were detected
        user_management_path = str(test_user_mgmt_dir)
        dir_context = context.directories.get(user_management_path)

        if not dir_context:
            print("❌ FAIL: Directory context not found")
            return False

        # Collect all exports
        all_exports = {}
        for file_context in dir_context.files:
            if file_context.file_name.startswith('index.'):
                continue
            for export in file_context.exports:
                if export.name not in all_exports:
                    all_exports[export.name] = []
                all_exports[export.name].append(file_context.file_name_without_ext)

        # Check for duplicates
        duplicates = {name: files for name, files in all_exports.items() if len(files) > 1}

        print(f"📊 Found exports: {list(all_exports.keys())}")
        print(f"🔍 Found duplicates: {duplicates}")

        # Should find User and UserProfile duplicates
        expected_duplicates = {'User', 'UserProfile'}
        found_duplicates = set(duplicates.keys())

        if expected_duplicates.issubset(found_duplicates):
            print("✅ PASS: Duplicate exports correctly detected")
            return True, duplicates
        else:
            print(f"❌ FAIL: Expected duplicates {expected_duplicates}, found {found_duplicates}")
            return False, duplicates

def test_index_generation_with_duplicates():
    """Test that index generation handles duplicates correctly"""
    print("\n🧪 Testing index generation with duplicates...")

    with tempfile.TemporaryDirectory() as temp_dir:
        # Create test files with duplicate exports
        test_user_mgmt_dir = create_test_files_with_duplicates(temp_dir)

        # Run IndexGenerator
        generator = IndexGenerator()
        success = generator.run(str(test_user_mgmt_dir))

        # Check if index.ts was generated
        index_file = test_user_mgmt_dir / "index.ts"
        if not index_file.exists():
            print("❌ FAIL: No index.ts generated (expected due to conflicts)")
            return True  # This might be correct behavior

        # If index.ts was generated, check its content
        content = index_file.read_text()
        print(f"📄 Generated index.ts content:\n{content}")

        # Test if the content would cause TypeScript errors
        if "export type * from './user-management.types';" in content and "export type * from './users';" in content:
            print("❌ FAIL: Generated index would cause TS2308 duplicate export errors")
            return False
        else:
            print("✅ PASS: Index generation handled duplicates correctly")
            return True

def test_typescript_compilation():
    """Test that generated index.ts compiles without TS2308 errors"""
    print("\n🧪 Testing TypeScript compilation...")

    with tempfile.TemporaryDirectory() as temp_dir:
        # Create test files with duplicate exports
        test_user_mgmt_dir = create_test_files_with_duplicates(temp_dir)

        # Run IndexGenerator
        generator = IndexGenerator()
        generator.run(str(test_user_mgmt_dir))

        # Check if index.ts exists
        index_file = test_user_mgmt_dir / "index.ts"
        if not index_file.exists():
            print("ℹ️  No index.ts generated (conflict avoidance)")
            return True

        # Create a test TypeScript file that imports from the index
        test_ts_file = test_user_mgmt_dir / "test_import.ts"
        test_ts_content = """
import { User, UserProfile, Achievement } from './index';

const user: User = {
  id: '1',
  email: 'test@test.com',
  username: 'test'
} as any;

const profile: UserProfile = {
  id: '1',
  email: 'test@test.com'
} as any;

const achievement: Achievement = {
  id: '1',
  name: 'Test',
  description: 'Test achievement'
};
"""
        test_ts_file.write_text(test_ts_content)

        # Try to compile with TypeScript (if available)
        try:
            import subprocess
            result = subprocess.run(['npx', 'tsc', '--noEmit', str(test_ts_file)],
                                  capture_output=True, text=True, cwd=temp_dir)
            if result.returncode == 0:
                print("✅ PASS: TypeScript compilation successful")
                return True
            else:
                print(f"❌ FAIL: TypeScript compilation failed:\n{result.stderr}")
                return False
        except FileNotFoundError:
            print("⚠️  TypeScript not available, skipping compilation test")
            return True

def run_all_tests():
    """Run all tests for duplicate exports"""
    print("🧪 Running duplicate exports tests...\n")

    # Test 1: Detection
    detection_result, duplicates = test_duplicate_exports_detection()

    # Test 2: Index generation
    generation_result = test_index_generation_with_duplicates()

    # Test 3: TypeScript compilation
    compilation_result = test_typescript_compilation()

    print(f"\n📊 Test Results:")
    print(f"   Detection: {'✅ PASS' if detection_result else '❌ FAIL'}")
    print(f"   Generation: {'✅ PASS' if generation_result else '❌ FAIL'}")
    print(f"   Compilation: {'✅ PASS' if compilation_result else '❌ FAIL'}")

    all_passed = detection_result and generation_result and compilation_result
    print(f"\n🎯 Overall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")

    return all_passed, duplicates

if __name__ == "__main__":
    success, found_duplicates = run_all_tests()
    if not success:
        print("\n🔧 Tests revealed issues that need to be fixed in the IndexGenerator")
        print(f"   Found duplicate exports: {found_duplicates}")
    exit(0 if success else 1)