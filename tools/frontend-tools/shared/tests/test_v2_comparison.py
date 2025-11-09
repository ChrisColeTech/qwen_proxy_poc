"""
Test script to compare name_standardizer-v2.py against the test cases.
"""

import sys
from pathlib import Path

# Add shared module to path for v2
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import the v2 version (using hyphenated filename)
import importlib.util
spec = importlib.util.spec_from_file_location(
    "name_standardizer_v2", 
    Path(__file__).parent.parent / "name_standardizer-v2.py"
)
name_standardizer_v2 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(name_standardizer_v2)

NameStandardizer = name_standardizer_v2.NameStandardizer


def test_existing_variable_generator_compatibility():
    """Test compatibility with variable_generator compound word awareness."""
    print("=== Variable Generator Compatibility Test (v2) ===")
    
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
    
    print(f"\nVariable Generator Compatibility (v2): {'✅ ALL PASSED' if all_passed else '❌ SOME FAILED'}")
    return all_passed


def test_hook_generation_consistency():
    """Test hook name generation consistency."""
    print("\n=== Hook Generation Consistency Test (v2) ===")
    
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
    
    print(f"\nHook Generation Consistency (v2): {'✅ ALL PASSED' if all_passed else '❌ SOME FAILED'}")
    return all_passed


def test_component_naming_consistency():
    """Test component name generation consistency."""
    print("\n=== Component Naming Consistency Test (v2) ===")
    
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
    
    print(f"\nComponent Naming Consistency (v2): {'✅ ALL PASSED' if all_passed else '❌ SOME FAILED'}")
    return all_passed


def test_known_problematic_cases():
    """Test cases that have caused issues in the actual codebase."""
    print("\n=== Known Problematic Cases Test (v2) ===")
    
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
    
    print(f"\nKnown Problematic Cases (v2): {'✅ ALL PASSED' if all_passed else '❌ SOME FAILED'}")
    return all_passed


def main():
    """Run all verification tests against name_standardizer-v2.py."""
    print("🧪 NameStandardizer v2 Consistency Verification")
    print("=" * 50)
    
    test_results = []
    
    test_results.append(test_existing_variable_generator_compatibility())
    test_results.append(test_hook_generation_consistency())
    test_results.append(test_component_naming_consistency())
    test_results.append(test_known_problematic_cases())
    
    # Summary
    passed_count = sum(test_results)
    total_count = len(test_results)
    
    print("\n" + "=" * 50)
    print(f"🏁 SUMMARY: {passed_count}/{total_count} test groups passed")
    
    if all(test_results):
        print("🎉 ALL TESTS PASSED! NameStandardizer v2 is working correctly.")
        return True
    else:
        print("⚠️  SOME TESTS FAILED. Review the output above for details.")
        return False


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)