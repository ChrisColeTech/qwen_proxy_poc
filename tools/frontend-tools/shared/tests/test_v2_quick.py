"""
Quick test script to compare the key test cases between our implementation and v2.
"""

import sys
from pathlib import Path
import importlib.util

# Import the v2 version
spec = importlib.util.spec_from_file_location(
    "name_standardizer_v2", 
    Path(__file__).parent.parent / "name_standardizer-v2.py"
)
name_standardizer_v2 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(name_standardizer_v2)

NameStandardizer_v2 = name_standardizer_v2.NameStandardizer

# Import our v1 version
sys.path.insert(0, str(Path(__file__).parent.parent))
from name_standardizer import NameStandardizer as NameStandardizer_v1

def main():
    print("🔍 UPDATED V2 vs OUR IMPLEMENTATION COMPARISON")
    print("=" * 60)
    
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
    
    print("📊 PASCAL CASE CONVERSION TEST")
    print("-" * 40)
    
    our_passed = 0
    v2_passed = 0
    
    for input_name, expected in test_cases:
        our_result = NameStandardizer_v1.to_pascal_case(input_name)
        v2_result = NameStandardizer_v2.to_pascal_case(input_name)
        
        our_status = "✅" if our_result == expected else "❌"
        v2_status = "✅" if v2_result == expected else "❌"
        
        if our_result == expected:
            our_passed += 1
        if v2_result == expected:
            v2_passed += 1
        
        print(f"{input_name:12} | Our: {our_result:12} {our_status} | V2: {v2_result:12} {v2_status}")
    
    print("-" * 60)
    print(f"📈 RESULTS: Our Implementation: {our_passed}/{len(test_cases)} ✅")
    print(f"📈 RESULTS: V2 Implementation:  {v2_passed}/{len(test_cases)} ✅")
    
    # Test hook generation
    print("\n🪝 HOOK GENERATION TEST")
    print("-" * 40)
    
    hook_tests = [
        ('testcenter', 'useTestCenterActions'),
        ('gamecenter', 'useGameCenterActions'),
        ('playarea', 'usePlayAreaActions'),
    ]
    
    our_hook_passed = 0
    v2_hook_passed = 0
    
    for input_name, expected in hook_tests:
        our_result = NameStandardizer_v1.to_hook_name(input_name)
        v2_result = NameStandardizer_v2.to_hook_name(input_name)
        
        our_status = "✅" if our_result == expected else "❌"
        v2_status = "✅" if v2_result == expected else "❌"
        
        if our_result == expected:
            our_hook_passed += 1
        if v2_result == expected:
            v2_hook_passed += 1
        
        print(f"{input_name:12} | Our: {our_result:25} {our_status} | V2: {v2_result:25} {v2_status}")
    
    print("-" * 70)
    print(f"📈 HOOK RESULTS: Our Implementation: {our_hook_passed}/{len(hook_tests)} ✅")
    print(f"📈 HOOK RESULTS: V2 Implementation:  {v2_hook_passed}/{len(hook_tests)} ✅")
    
    # Check for hardcoded values in V2
    print("\n🔍 HARDCODED VALUES CHECK")
    print("-" * 40)
    print("V2 DOMAIN_WORDS:", NameStandardizer_v2.DOMAIN_WORDS)
    print("V2 ACRONYMS:", NameStandardizer_v2.ACRONYMS)
    
    # Overall assessment
    print("\n🏆 OVERALL ASSESSMENT")
    print("=" * 40)
    
    if our_passed == len(test_cases) and our_hook_passed == len(hook_tests):
        our_grade = "🥇 PERFECT"
    elif our_passed >= len(test_cases) * 0.8:
        our_grade = "🥈 EXCELLENT" 
    else:
        our_grade = "🥉 NEEDS WORK"
    
    if v2_passed == len(test_cases) and v2_hook_passed == len(hook_tests):
        v2_grade = "🥇 PERFECT"
    elif v2_passed >= len(test_cases) * 0.8:
        v2_grade = "🥈 EXCELLENT"
    else:
        v2_grade = "🥉 NEEDS WORK"
    
    print(f"Our Implementation: {our_grade}")
    print(f"V2 Implementation:  {v2_grade}")

if __name__ == '__main__':
    main()