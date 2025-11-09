#!/usr/bin/env python3
"""
Test case for the chess components export mismatch scenario.
This replicates the exact issue where:
1. Component exports default: export default MobileChessBoard
2. Barrel generates: export { default as mobilechessboard } 
3. Consumer imports named: import { MobileChessBoard } from "../../components/chess"
4. Result: TypeScript error "has no exported member 'MobileChessBoard'"
"""

import tempfile
import shutil
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator

def test_chess_export_scenario():
    """Test the exact export pattern causing issues in chess components"""
    
    # Create temporary directory structure
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        chess_dir = temp_path / "components" / "chess"
        chess_dir.mkdir(parents=True)
        
        # Create MobileChessBoard.tsx with default export (like actual file)
        mobile_chess_board = chess_dir / "MobileChessBoard.tsx"
        mobile_chess_board.write_text("""
import React from "react";
import { useWrapperChessBoard } from "../../hooks/chess/useWrapperChessBoard";

interface MobileChessBoardProps {
  gridSize: number;
  pieceConfig: string;
}

const MobileChessBoard: React.FC<MobileChessBoardProps> = ({ 
  gridSize, 
  pieceConfig 
}) => {
  // Component implementation
  return <div>Chess Board</div>;
};

export default MobileChessBoard;
""")

        # Create CapturedPieces.tsx with default export
        captured_pieces = chess_dir / "CapturedPieces.tsx"
        captured_pieces.write_text("""
import React from "react";

interface CapturedPiecesProps {
  pieces: any[];
  position: string;
}

const CapturedPieces: React.FC<CapturedPiecesProps> = ({ pieces, position }) => {
  return <div>Captured Pieces</div>;
};

export default CapturedPieces;
""")

        # Create GameStatusBar.tsx in play directory  
        play_dir = temp_path / "components" / "play"
        play_dir.mkdir(parents=True)
        
        game_status_bar = play_dir / "GameStatusBar.tsx"
        game_status_bar.write_text("""
import React from "react";

interface GameStatusBarProps {
  currentPlayer: string;
  isPlayerTurn: boolean;
  isComputerThinking: boolean;
  skillLevel: number;
  isGameOver?: boolean;
}

const GameStatusBar: React.FC<GameStatusBarProps> = (props) => {
  return <div>Game Status</div>;
};

export default GameStatusBar;
""")

        # Create a consumer page that imports named exports (like PlayChessPage)
        pages_dir = temp_path / "pages" / "chess"
        pages_dir.mkdir(parents=True)
        
        play_chess_page = pages_dir / "PlayChessPage.tsx"
        play_chess_page.write_text("""
import React from "react";
import { MobileChessBoard } from "../../components/chess";
import { CapturedPieces } from "../../components/chess";
import { GameStatusBar } from "../../components/play";

export const PlayChessPage: React.FC = () => {
  return (
    <div>
      <GameStatusBar 
        currentPlayer="white"
        isPlayerTurn={true}
        isComputerThinking={false}
        skillLevel={1}
      />
      <MobileChessBoard gridSize={8} pieceConfig="standard-chess" />
      <CapturedPieces pieces={[]} position="normal" />
    </div>
  );
};
""")
        
        print("=== Testing Chess Export Scenario ===")
        print(f"Test directory: {temp_path}")
        
        # Generate barrels with current system
        barrel_generator = AdvancedBarrelGenerator(temp_path, verbose=True)
        
        print(f"Debug: Analyzing directory structure:")
        tsx_files = []
        for item in temp_path.rglob('*'):
            if item.is_dir():
                print(f"  Directory: {item}")
                for file in item.iterdir():
                    if file.is_file() and file.suffix in ['.ts', '.tsx']:
                        print(f"    File: {file}")
                        tsx_files.append(file)
            elif item.suffix in ['.ts', '.tsx']:
                print(f"  File: {item}")
                tsx_files.append(item)
        
        # Manually analyze each file before building registry
        print(f"Debug: Analyzing {len(tsx_files)} TypeScript files...")
        for file_path in tsx_files:
            print(f"  Analyzing: {file_path}")
            analysis = barrel_generator.analyze_file(file_path)
            print(f"    Exports found: {len(analysis.exports)}")
            for export in analysis.exports:
                print(f"      - {export.export_type.value}: {export.name}")
        
        barrel_generator.build_export_registry()
        
        # Generate barrel files for each directory
        print(f"Debug: Generating barrel files...")
        for directory in [chess_dir, play_dir]:
            if any(f.suffix in ['.ts', '.tsx'] for f in directory.iterdir() if f.is_file()):
                print(f"  Generating barrel for: {directory}")
                barrel_content = barrel_generator.generate_barrel(directory)
                barrel_file = directory / "index.ts"
                barrel_file.write_text(barrel_content)
                print(f"    Created: {barrel_file}")
        
        # Check generated barrel files
        chess_barrel = chess_dir / "index.ts"
        play_barrel = play_dir / "index.ts"
        
        print(f"\n=== Chess Barrel Content ===")
        if chess_barrel.exists():
            print(chess_barrel.read_text())
        else:
            print("❌ Chess barrel not generated!")
            
        print(f"\n=== Play Barrel Content ===") 
        if play_barrel.exists():
            print(play_barrel.read_text())
        else:
            print("❌ Play barrel not generated!")
            
        # Simulate TypeScript import resolution
        print(f"\n=== Import Resolution Analysis ===")
        chess_barrel_content = chess_barrel.read_text() if chess_barrel.exists() else ""
        play_barrel_content = play_barrel.read_text() if play_barrel.exists() else ""
        
        # Check if named exports are available
        issues = []
        
        if "MobileChessBoard" not in chess_barrel_content:
            issues.append("❌ MobileChessBoard not available as named export in chess barrel")
            
        if "CapturedPieces" not in chess_barrel_content:
            issues.append("❌ CapturedPieces not available as named export in chess barrel")
            
        if "GameStatusBar" not in play_barrel_content:
            issues.append("❌ GameStatusBar not available as named export in play barrel")
            
        if issues:
            print("ISSUES FOUND:")
            for issue in issues:
                print(f"  {issue}")
        else:
            print("✅ All named exports are properly available")
            
        print(f"\n=== Solution Requirements ===")
        print("For default exports to be importable as named exports, barrel should include:")
        print("  export { default as MobileChessBoard } from './MobileChessBoard';")
        print("  export { default as CapturedPieces } from './CapturedPieces';")
        print("  export { default as GameStatusBar } from './GameStatusBar';")
        
        return len(issues) == 0

if __name__ == "__main__":
    success = test_chess_export_scenario()
    exit(0 if success else 1)