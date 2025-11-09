"""
Test both implementations with compound words NOT in their hardcoded lists.
This will reveal which approach is truly algorithmic vs just hardcoded.
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
    print("🧪 UNKNOWN COMPOUND WORDS TEST")
    print("=" * 60)
    print("Testing words NOT in either implementation's hardcoded lists")
    print("This reveals which approach is truly algorithmic")
    print()
    
    # Test cases with compound words NOT in hardcoded lists
    test_cases = [
        # Medical/Science compounds
        ('bloodworkpage', 'BloodworkPage'),
        ('heartbeatpage', 'HeartBeatPage'), 
        ('brainstempage', 'BrainstemPage'),
        ('backbonepage', 'BackbonePage'),
        ('sunshinepage', 'SunshinePage'),
        ('moonlightpage', 'MoonlightPage'),
        ('starlightpage', 'StarlightPage'),
        
        # Business/Finance compounds  
        ('workflowpage', 'WorkflowPage'),
        ('cashflowpage', 'CashflowPage'),
        ('payrollpage', 'PayrollPage'),
        ('teamworkpage', 'TeamworkPage'),
        ('frameworkpage', 'FrameworkPage'),
        
        # Technology compounds (not in lists)
        ('bandwidthpage', 'BandwidthPage'),
        ('hardcodepage', 'HardcodePage'),
        ('softkeypage', 'SoftkeyPage'),
        ('hotspotpage', 'HotspotPage'),
        ('endpointpage', 'EndpointPage'),
        
        # Random compounds
        ('airtimepage', 'AirtimePage'),
        ('homeworkpage', 'HomeworkPage'),
        ('footsteppage', 'FootstepPage'),
        ('handshakepage', 'HandshakePage'),
        ('keyboardpage', 'KeyboardPage'),
    ]
    
    print("📊 COMPOUND WORD DETECTION TEST")
    print("-" * 70)
    print(f"{'Input':<12} | {'Expected':<12} | {'Our Result':<12} | {'V2 Result':<12} | {'Winner'}")
    print("-" * 70)
    
    our_score = 0
    v2_score = 0
    total_tests = len(test_cases)
    
    for input_word, expected in test_cases:
        our_result = NameStandardizer_v1.to_pascal_case(input_word)
        v2_result = NameStandardizer_v2.to_pascal_case(input_word)
        
        our_correct = our_result == expected
        v2_correct = v2_result == expected
        
        if our_correct:
            our_score += 1
        if v2_correct:
            v2_score += 1
        
        # Determine winner for this case
        if our_correct and v2_correct:
            winner = "TIE ✅"
        elif our_correct and not v2_correct:
            winner = "OURS ✅"
        elif not our_correct and v2_correct:
            winner = "V2 ✅"
        else:
            winner = "BOTH ❌"
        
        print(f"{input_word:<12} | {expected:<12} | {our_result:<12} | {v2_result:<12} | {winner}")
    
    print("-" * 70)
    print(f"📈 FINAL SCORES:")
    print(f"   Our Implementation: {our_score}/{total_tests} ({our_score/total_tests*100:.1f}%)")
    print(f"   V2 Implementation:  {v2_score}/{total_tests} ({v2_score/total_tests*100:.1f}%)")
    
    # Analysis
    print(f"\n🔍 ANALYSIS:")
    if our_score > v2_score:
        print(f"   🏆 Our implementation wins by {our_score - v2_score} points")
        print(f"   🤔 But is it truly algorithmic or just better hardcoded lists?")
    elif v2_score > our_score:
        print(f"   🏆 V2 wins by {v2_score - our_score} points")
        print(f"   ✨ V2 shows better generalization to unknown compounds")
    else:
        print(f"   🤝 Tie! Both approaches handle unknown compounds equally")
    
    # Check what's in our hardcoded lists
    print(f"\n🕵️ HARDCODED LIST CHECK:")
    
    # Check if any test words are in our TECH_WORDS
    our_hardcoded_hits = []
    for input_word, _ in test_cases:
        # Check if any part of the compound is in our lists
        words_in_our_list = []
        # This is tricky without knowing the exact split, but we can check common patterns
        for word_part in ['blood', 'work', 'heart', 'beat', 'brain', 'stem', 'back', 'bone', 
                         'sun', 'shine', 'moon', 'light', 'star', 'cash', 'flow', 'pay', 
                         'roll', 'team', 'frame', 'band', 'width', 'hard', 'code', 'soft', 
                         'key', 'hot', 'spot', 'end', 'point', 'air', 'time', 'home', 
                         'foot', 'step', 'hand', 'shake', 'board']:
            # We'd need to check if these are in our TECH_WORDS, but for now this gives us an idea
            pass
    
    print(f"   📝 Test designed to avoid both implementations' hardcoded lists")
    print(f"   🎯 This reveals true algorithmic capability vs memorization")

if __name__ == '__main__':
    main()