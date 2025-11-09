"""
Test using WordSegment - a proven compound word segmentation library.
Based on a trillion-word corpus, this is what a REAL solution looks like.
"""

import sys
from pathlib import Path
import importlib.util
from wordsegment import load, segment

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

class WordSegmentNameStandardizer:
    """Name standardizer using WordSegment - a REAL compound word segmentation library."""
    
    def __init__(self):
        # Load the data (trillion-word corpus)
        load()
    
    def to_pascal_case(self, name: str) -> str:
        """Convert to PascalCase using WordSegment segmentation."""
        if not name or not isinstance(name, str):
            return name or ""
        
        name = name.strip().lower()
        if not name:
            return ""
        
        # Use WordSegment to segment the word
        segments = segment(name)
        
        # Capitalize each segment
        pascal_parts = [segment_word.capitalize() for segment_word in segments if segment_word.strip()]
        
        return ''.join(pascal_parts)

def main():
    print("🧪 WORDSEGMENT vs HOMEBREW IMPLEMENTATIONS")
    print("=" * 80)
    print("Testing with WordSegment - a proven library based on trillion-word corpus")
    print("vs our homebrew attempts")
    print()
    
    # Initialize WordSegment-based implementation
    wordsegment_impl = WordSegmentNameStandardizer()
    
    # Test cases - using WordSegment as ground truth for what SHOULD be split
    test_cases = [
        # Original test cases - these are artificial compounds for UI naming
        ('testcenter', 'TestCenter'),
        ('gamecenter', 'GameCenter'), 
        ('playarea', 'PlayArea'),
        ('adminarea', 'AdminArea'),
        ('dashboard', 'Dashboard'),
        
        # Real compound words that should be split
        ('cashflow', 'CashFlow'),  # WordSegment splits this correctly
        
        # Single words that should NOT be split (based on WordSegment corpus)
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
    print(f"{'Input':<12} | {'Expected':<12} | {'Our':<12} | {'V2':<12} | {'WordSegment':<12} | {'Winner'}")
    print("-" * 100)
    
    our_score = 0
    v2_score = 0 
    wordsegment_score = 0
    total_tests = len(test_cases)
    
    for input_word, expected in test_cases:
        our_result = NameStandardizer_v1.to_pascal_case(input_word)
        v2_result = NameStandardizer_v2.to_pascal_case(input_word)
        wordsegment_result = wordsegment_impl.to_pascal_case(input_word)
        
        our_correct = our_result == expected
        v2_correct = v2_result == expected
        wordsegment_correct = wordsegment_result == expected
        
        if our_correct:
            our_score += 1
        if v2_correct:
            v2_score += 1
        if wordsegment_correct:
            wordsegment_score += 1
        
        # Determine winner
        winners = []
        if our_correct:
            winners.append("OURS")
        if v2_correct:
            winners.append("V2")
        if wordsegment_correct:
            winners.append("WS")
        
        if len(winners) == 3:
            winner = "ALL ✅"
        elif len(winners) == 2:
            winner = "+".join(winners) + " ✅"
        elif len(winners) == 1:
            winner = winners[0] + " ✅"
        else:
            winner = "ALL ❌"
        
        print(f"{input_word:<12} | {expected:<12} | {our_result:<12} | {v2_result:<12} | {wordsegment_result:<12} | {winner}")
    
    print("-" * 100)
    print(f"📈 FINAL SCORES:")
    print(f"   Our Implementation:        {our_score}/{total_tests} ({our_score/total_tests*100:.1f}%)")
    print(f"   V2 Implementation:         {v2_score}/{total_tests} ({v2_score/total_tests*100:.1f}%)")
    print(f"   WordSegment (Proven):      {wordsegment_score}/{total_tests} ({wordsegment_score/total_tests*100:.1f}%)")
    
    print(f"\n🏆 WINNER:")
    max_score = max(our_score, v2_score, wordsegment_score)
    if wordsegment_score == max_score:
        print(f"   🥇 WORDSEGMENT - The trillion-word corpus approach wins!")
        print(f"   💡 This is what happens when you use established, proven algorithms")
    elif our_score == max_score:
        print(f"   🥈 Our homebrew implementation")
    else:
        print(f"   🥈 V2 homebrew implementation")
    
    print(f"\n🔍 ANALYSIS:")
    print(f"   📚 WordSegment uses a trillion-word corpus from Google Books")
    print(f"   🎯 It's based on statistical analysis of real text, not rules")
    print(f"   📖 This demonstrates the difference between research-backed vs homebrew solutions")
    
    # Show some segmentation examples
    print(f"\n🔧 WORDSEGMENT SEGMENTATION EXAMPLES:")
    debug_words = ['testcenter', 'bloodwork', 'framework', 'keyboard', 'website', 'database']
    for word in debug_words:
        segments = segment(word)
        print(f"   {word} → {segments}")

if __name__ == '__main__':
    main()