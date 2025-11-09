#!/usr/bin/env python3
"""
Test the type-only imports functionality on the real project files
"""

from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator

def test_real_type_only_imports():
    """Test type-only imports fixing on the real project files"""
    
    src_dir = Path("/Users/chris/Projects/llm-api-vault-v2/frontend-v2/src")
    
    print("=== Testing real type-only imports ===")
    print(f"Working on src directory: {src_dir}")
    
    # Initialize barrel generator
    barrel_gen = AdvancedBarrelGenerator(src_dir)
    
    # Run type-only import fixes
    fixes_applied = barrel_gen._fix_type_only_imports()
    
    print(f"Applied {fixes_applied} type-only import fixes")
    
    if fixes_applied > 0:
        print("✅ SUCCESS: Type-only imports were fixed")
        
        # Check specific files that had TS1484 errors
        problem_files = [
            "hooks/authentication/useUserSession.ts",
            "hooks/chess-theory/useOpening.ts", 
            "hooks/gameplay/useGame.ts",
            "hooks/gameplay/useHistoricGame.ts",
            "hooks/learning/useContent.ts",
            "hooks/learning/useUserContentProgress.ts",
            "hooks/puzzles/usePuzzle.ts",
            "hooks/puzzles/usePuzzleAttempt.ts",
            "hooks/puzzles/usePuzzleSource.ts",
            "hooks/user-management/useAchievement.ts",
            "hooks/user-management/useUser.ts",
            "hooks/user-management/useUserAchievement.ts",
            "hooks/user-management/useUserProfile.ts"
        ]
        
        fixed_count = 0
        for file_path in problem_files:
            full_path = src_dir / file_path
            if full_path.exists():
                content = full_path.read_text()
                if "import type {" in content:
                    fixed_count += 1
                    print(f"  ✅ Fixed: {file_path}")
                else:
                    print(f"  ⚠️  Not fixed: {file_path}")
        
        print(f"Fixed {fixed_count}/{len(problem_files)} known problem files")
    else:
        print("❌ No type-only import fixes were applied")

if __name__ == "__main__":
    test_real_type_only_imports()