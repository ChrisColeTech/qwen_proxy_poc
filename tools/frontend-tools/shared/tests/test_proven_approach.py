"""
Test the proven algorithm approach against our homebrew implementations.
This shows what happens when you use established research vs homebrew hacks.
"""

import sys
from pathlib import Path
import importlib.util

# Import the proven version
spec = importlib.util.spec_from_file_location(
    "name_standardizer_proven", 
    Path(__file__).parent.parent / "name_standardizer_proven.py"
)
name_standardizer_proven = importlib.util.module_from_spec(spec)
spec.loader.exec_module(name_standardizer_proven)

NameStandardizer_Proven = name_standardizer_proven.NameStandardizer

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
    print("🧪 PROVEN ALGORITHMS vs HOMEBREW IMPLEMENTATIONS")
    print("=" * 80)
    print("Testing proven compound word segmentation algorithms")
    print("vs our homebrew attempts")
    print()
    
    # Test cases with correct expectations based on linguistic analysis
    test_cases = [
        # Artificial UI compounds (should be split)
        ('testcenter', 'TestCenter'),
        ('gamecenter', 'GameCenter'), 
        ('playarea', 'PlayArea'),
        ('adminarea', 'AdminArea'),
        ('userarea', 'UserArea'),
        ('workarea', 'WorkArea'),
        
        # Real compounds that naturally split
        ('cashflow', 'CashFlow'),
        
        # Single words that should NOT be split
        ('dashboard', 'Dashboard'),
        ('bloodwork', 'Bloodwork'),
        ('heartbeat', 'Heartbeat'), 
        ('brainstem', 'Brainstem'),
        ('backbone', 'Backbone'),
        ('sunshine', 'Sunshine'),
        ('moonlight', 'Moonlight'),
        ('workflow', 'Workflow'),
        ('framework', 'Framework'),
        ('bandwidth', 'Bandwidth'),
        ('keyboard', 'Keyboard'),
        ('endpoint', 'Endpoint'),
        ('frontpage', 'Frontpage'),
        ('homepage', 'Homepage'),
        ('website', 'Website'),
        ('database', 'Database'),
        ('software', 'Software'),
        ('hardware', 'Hardware'),
        ('network', 'Network'),
        ('internet', 'Internet'),
    ]
    
    print("📊 COMPOUND WORD SEGMENTATION COMPARISON")
    print("-" * 100)
    print(f"{'Input':<12} | {'Expected':<12} | {'Our':<12} | {'V2':<12} | {'Proven':<12} | {'Winner'}")
    print("-" * 100)
    
    our_score = 0
    v2_score = 0 
    proven_score = 0
    total_tests = len(test_cases)
    
    for input_word, expected in test_cases:
        our_result = NameStandardizer_v1.to_pascal_case(input_word)
        v2_result = NameStandardizer_v2.to_pascal_case(input_word)
        proven_result = NameStandardizer_Proven.to_pascal_case(input_word)
        
        our_correct = our_result == expected
        v2_correct = v2_result == expected
        proven_correct = proven_result == expected
        
        if our_correct:
            our_score += 1
        if v2_correct:
            v2_score += 1
        if proven_correct:
            proven_score += 1
        
        # Determine winner
        winners = []
        if our_correct:
            winners.append("OURS")
        if v2_correct:
            winners.append("V2")
        if proven_correct:
            winners.append("PROVEN")
        
        if len(winners) == 3:
            winner = "ALL ✅"
        elif len(winners) == 2:
            winner = "+".join(winners) + " ✅"
        elif len(winners) == 1:
            winner = winners[0] + " ✅"
        else:
            winner = "ALL ❌"
        
        print(f"{input_word:<12} | {expected:<12} | {our_result:<12} | {v2_result:<12} | {proven_result:<12} | {winner}")
    
    print("-" * 100)
    print(f"📈 FINAL SCORES:")
    print(f"   Our Implementation:     {our_score}/{total_tests} ({our_score/total_tests*100:.1f}%)")
    print(f"   V2 Implementation:      {v2_score}/{total_tests} ({v2_score/total_tests*100:.1f}%)")
    print(f"   Proven Algorithms:      {proven_score}/{total_tests} ({proven_score/total_tests*100:.1f}%)")
    
    print(f"\n🏆 WINNER:")
    max_score = max(our_score, v2_score, proven_score)
    if proven_score == max_score:
        print(f"   🥇 PROVEN ALGORITHMS - Research-backed approach wins!")
        print(f"   💡 This is what happens when you use established algorithms")
    elif our_score == max_score:
        print(f"   🥈 Our homebrew implementation")
    else:
        print(f"   🥈 V2 homebrew implementation")
    
    print(f"\n🔍 ANALYSIS:")
    print(f"   📚 Proven approach uses WordSegment (trillion-word corpus)")
    print(f"   🎯 Distinguishes between real words and artificial UI compounds")
    print(f"   📖 Shows the difference between linguistic analysis vs hardcoded rules")
    
    # Test hook generation
    print(f"\n🪝 HOOK GENERATION TEST:")
    hook_tests = [
        ('testcenter', 'useTestCenterActions'),
        ('gamecenter', 'useGameCenterActions'),
        ('playarea', 'usePlayAreaActions'),
        ('dashboard', 'useDashboardActions'),
    ]
    
    proven_hook_score = 0
    v2_hook_score = 0
    our_hook_score = 0
    
    for input_name, expected in hook_tests:
        our_result = NameStandardizer_v1.to_hook_name(input_name)
        v2_result = NameStandardizer_v2.to_hook_name(input_name)
        proven_result = NameStandardizer_Proven.to_hook_name(input_name)
        
        our_correct = our_result == expected
        v2_correct = v2_result == expected
        proven_correct = proven_result == expected
        
        if our_correct:
            our_hook_score += 1
        if v2_correct:
            v2_hook_score += 1
        if proven_correct:
            proven_hook_score += 1
        
        our_status = "✅" if our_correct else "❌"
        v2_status = "✅" if v2_correct else "❌"
        proven_status = "✅" if proven_correct else "❌"
        
        print(f"   {input_name:12} | Our: {our_result:25} {our_status} | V2: {v2_result:25} {v2_status} | Proven: {proven_result:25} {proven_status}")
    
    print(f"\n📈 HOOK RESULTS:")
    print(f"   Our Implementation:     {our_hook_score}/{len(hook_tests)} ✅")
    print(f"   V2 Implementation:      {v2_hook_score}/{len(hook_tests)} ✅")
    print(f"   Proven Algorithms:      {proven_hook_score}/{len(hook_tests)} ✅")

if __name__ == '__main__':
    main()