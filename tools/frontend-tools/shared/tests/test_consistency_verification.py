"""
Verification script to compare NameStandardizer output with existing implementations.

This script tests specific cases from the codebase to ensure the new NameStandardizer
produces consistent and improved results compared to existing ad-hoc implementations.
"""

import sys
from pathlib import Path

# Add shared module to path
sys.path.append(str(Path(__file__).parent.parent))
from name_standardizer import NameStandardizer


def test_existing_variable_generator_compatibility():
    """Test compatibility with variable_generator compound word awareness."""
    print("=== Variable Generator Compatibility Test ===")
    
    # Test cases from variable_generator's _to_pascal_case_compound_aware method
    test_cases = [
        ('testcenter', 'TestCenter'),
        ('gamecenter', 'GameCenter'),
        ('playarea', 'PlayArea'),
        ('gamearea', 'GameArea'),
        ('userarea', 'UserArea'),
        ('workarea', 'WorkArea'),
        ('adminarea', 'AdminArea'),
        ('dashboard', 'Dashboard'),
        ('testdash', 'TestDash'),
    ]
    
    all_passed = True
    for input_name, expected in test_cases:
        result = NameStandardizer.to_pascal_case(input_name)
        status = "✅ PASS" if result == expected else "❌ FAIL"
        if result != expected:
            all_passed = False
        print(f"  {input_name} -> {result} (expected: {expected}) {status}")
    
    print(f"\nVariable Generator Compatibility: {'✅ ALL PASSED' if all_passed else '❌ SOME FAILED'}")
    return all_passed


def test_hook_generation_consistency():
    """Test hook name generation consistency."""
    print("\n=== Hook Generation Consistency Test ===")
    
    test_cases = [
        ('testcenter', 'useTestCenterActions'),
        ('gamecenter', 'useGameCenterActions'),
        ('playarea', 'usePlayAreaActions'),
        ('test-center', 'useTestCenterActions'),
        ('game-center', 'useGameCenterActions'),
        ('play-area', 'usePlayAreaActions'),
    ]
    
    all_passed = True
    for input_name, expected in test_cases:
        result = NameStandardizer.to_hook_name(input_name)
        status = "✅ PASS" if result == expected else "❌ FAIL"
        if result != expected:
            all_passed = False
        print(f"  {input_name} -> {result} (expected: {expected}) {status}")
    
    print(f"\nHook Generation Consistency: {'✅ ALL PASSED' if all_passed else '❌ SOME FAILED'}")
    return all_passed


def test_component_naming_consistency():
    """Test component name generation consistency."""
    print("\n=== Component Naming Consistency Test ===")
    
    test_cases = [
        ('testcenter', 'TestCenterPage'),
        ('gamecenter', 'GameCenterPage'), 
        ('playarea', 'PlayAreaPage'),
        ('test-center', 'TestCenterPage'),
        ('TestCenterPage', 'TestCenterPage'),  # Avoid double suffix
        ('testcenter', 'TestCenterPageWrapper', 'PageWrapper'),
        ('playarea', 'PlayAreaPageWrapper', 'PageWrapper'),
    ]
    
    all_passed = True
    for test_case in test_cases:
        if len(test_case) == 3:
            input_name, expected, suffix = test_case
            result = NameStandardizer.to_component_name(input_name, suffix)
        else:
            input_name, expected = test_case
            suffix = 'Page'
            result = NameStandardizer.to_component_name(input_name, suffix)
            
        status = "✅ PASS" if result == expected else "❌ FAIL"
        if result != expected:
            all_passed = False
        print(f"  {input_name} + '{suffix}' -> {result} (expected: {expected}) {status}")
    
    print(f"\nComponent Naming Consistency: {'✅ ALL PASSED' if all_passed else '❌ SOME FAILED'}")
    return all_passed


def test_file_naming_consistency():
    """Test file name generation consistency."""
    print("\n=== File Naming Consistency Test ===")
    
    test_cases = [
        ('testcenter', 'TestCenter.ts', '.ts'),
        ('gamecenter', 'GameCenter.tsx', '.tsx'),
        ('playarea', 'PlayAreaPage.tsx', 'Page.tsx'),
        ('test-center', 'TestCenter.ts', '.ts'),
        ('game-center', 'GameCenter.tsx', '.tsx'),
    ]
    
    all_passed = True
    for input_name, expected, suffix in test_cases:
        result = NameStandardizer.to_file_name(input_name, suffix)
        status = "✅ PASS" if result == expected else "❌ FAIL"
        if result != expected:
            all_passed = False
        print(f"  {input_name} + '{suffix}' -> {result} (expected: {expected}) {status}")
    
    print(f"\nFile Naming Consistency: {'✅ ALL PASSED' if all_passed else '❌ SOME FAILED'}")
    return all_passed


def test_directory_naming_consistency():
    """Test directory name generation consistency."""
    print("\n=== Directory Naming Consistency Test ===")
    
    test_cases = [
        ('TestCenter', 'testcenter'),
        ('test-center', 'testcenter'),
        ('Test Center', 'testcenter'),
        ('test_center', 'testcenter'),
        ('GameCenter', 'gamecenter'),
        ('PlayArea', 'playarea'),
    ]
    
    all_passed = True
    for input_name, expected in test_cases:
        result = NameStandardizer.to_directory_name(input_name)
        status = "✅ PASS" if result == expected else "❌ FAIL"
        if result != expected:
            all_passed = False
        print(f"  {input_name} -> {result} (expected: {expected}) {status}")
    
    print(f"\nDirectory Naming Consistency: {'✅ ALL PASSED' if all_passed else '❌ SOME FAILED'}")
    return all_passed


def test_complete_standardization_workflow():
    """Test complete page standardization workflow."""
    print("\n=== Complete Standardization Workflow Test ===")
    
    test_pages = ['testcenter', 'gamecenter', 'playarea', 'test-center', 'game-center']
    
    all_passed = True
    for page_name in test_pages:
        print(f"\n  Page: '{page_name}'")
        
        # Generate all standardized formats
        standards = NameStandardizer.standardize_page_names(page_name)
        
        # Validate consistency
        is_consistent = NameStandardizer.validate_consistency(standards)
        consistency_status = "✅ CONSISTENT" if is_consistent else "❌ INCONSISTENT"
        if not is_consistent:
            all_passed = False
            
        print(f"    page_id: {standards['page_id']}")
        print(f"    base_name: {standards['base_name']}")
        print(f"    component_name: {standards['component_name']}")
        print(f"    hook_name: {standards['hook_name']}")
        print(f"    directory_name: {standards['directory_name']}")
        print(f"    Consistency: {consistency_status}")
        
        # Test specific expectations for compound words
        if page_name.lower() in ['testcenter', 'test-center']:
            expected_base = 'TestCenter'
            if standards['base_name'] != expected_base:
                print(f"    ❌ Expected base_name: {expected_base}, got: {standards['base_name']}")
                all_passed = False
        elif page_name.lower() in ['gamecenter', 'game-center']:
            expected_base = 'GameCenter'
            if standards['base_name'] != expected_base:
                print(f"    ❌ Expected base_name: {expected_base}, got: {standards['base_name']}")
                all_passed = False
        elif page_name.lower() in ['playarea', 'play-area']:
            expected_base = 'PlayArea'
            if standards['base_name'] != expected_base:
                print(f"    ❌ Expected base_name: {expected_base}, got: {standards['base_name']}")
                all_passed = False
    
    print(f"\nComplete Standardization Workflow: {'✅ ALL PASSED' if all_passed else '❌ SOME FAILED'}")
    return all_passed


def test_known_problematic_cases():
    """Test cases that have caused issues in the actual codebase."""
    print("\n=== Known Problematic Cases Test ===")
    
    # Cases from the implementation plan and build errors
    problematic_cases = [
        # Hook import/export mismatches
        {
            'input': 'testcenter',
            'expected_hook_name': 'useTestCenterActions',
            'expected_hook_file': 'useTestCenterActions.ts',
            'expected_component': 'TestCenterPage',
            'expected_wrapper': 'TestCenterPageWrapper'
        },
        {
            'input': 'gamecenter', 
            'expected_hook_name': 'useGameCenterActions',
            'expected_hook_file': 'useGameCenterActions.ts',
            'expected_component': 'GameCenterPage',
            'expected_wrapper': 'GameCenterPageWrapper'
        },
        {
            'input': 'playarea',
            'expected_hook_name': 'usePlayAreaActions', 
            'expected_hook_file': 'usePlayAreaActions.ts',
            'expected_component': 'PlayAreaPage',
            'expected_wrapper': 'PlayAreaPageWrapper'
        }
    ]
    
    all_passed = True
    for case in problematic_cases:
        input_name = case['input']
        print(f"\n  Testing problematic case: '{input_name}'")
        
        # Test hook name
        hook_result = NameStandardizer.to_hook_name(input_name)
        hook_status = "✅" if hook_result == case['expected_hook_name'] else "❌"
        if hook_result != case['expected_hook_name']:
            all_passed = False
        print(f"    Hook name: {hook_result} (expected: {case['expected_hook_name']}) {hook_status}")
        
        # Test hook file name (using the hook name as base, not input name)
        hook_file_result = f"{hook_result}.ts"
        hook_file_status = "✅" if hook_file_result == case['expected_hook_file'] else "❌"
        if hook_file_result != case['expected_hook_file']:
            all_passed = False
        print(f"    Hook file: {hook_file_result} (expected: {case['expected_hook_file']}) {hook_file_status}")
        
        # Test component name
        component_result = NameStandardizer.to_component_name(input_name)
        component_status = "✅" if component_result == case['expected_component'] else "❌"
        if component_result != case['expected_component']:
            all_passed = False
        print(f"    Component: {component_result} (expected: {case['expected_component']}) {component_status}")
        
        # Test wrapper name
        wrapper_result = NameStandardizer.to_component_name(input_name, 'PageWrapper')
        wrapper_status = "✅" if wrapper_result == case['expected_wrapper'] else "❌"
        if wrapper_result != case['expected_wrapper']:
            all_passed = False
        print(f"    Wrapper: {wrapper_result} (expected: {case['expected_wrapper']}) {wrapper_status}")
    
    print(f"\nKnown Problematic Cases: {'✅ ALL PASSED' if all_passed else '❌ SOME FAILED'}")
    return all_passed


def main():
    """Run all verification tests."""
    print("🧪 NameStandardizer Consistency Verification")
    print("=" * 50)
    
    test_results = []
    
    test_results.append(test_existing_variable_generator_compatibility())
    test_results.append(test_hook_generation_consistency())
    test_results.append(test_component_naming_consistency())
    test_results.append(test_file_naming_consistency())
    test_results.append(test_directory_naming_consistency())
    test_results.append(test_complete_standardization_workflow())
    test_results.append(test_known_problematic_cases())
    
    # Summary
    passed_count = sum(test_results)
    total_count = len(test_results)
    
    print("\n" + "=" * 50)
    print(f"🏁 SUMMARY: {passed_count}/{total_count} test groups passed")
    
    if all(test_results):
        print("🎉 ALL TESTS PASSED! NameStandardizer is ready for integration.")
        return True
    else:
        print("⚠️  SOME TESTS FAILED. Review the output above for details.")
        return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)