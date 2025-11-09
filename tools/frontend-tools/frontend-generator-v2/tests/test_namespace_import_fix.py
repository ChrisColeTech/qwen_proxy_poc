#!/usr/bin/env python3
"""
Test case for namespace import issue detection and fixing
"""

import os
import shutil
import tempfile
from pathlib import Path
from core.advanced_barrel_generator import AdvancedBarrelGenerator

def test_namespace_import_fix():
    """Test that the barrel generator can detect and fix namespace import conflicts"""
    
    print("🧪 Testing Namespace Import Fix")
    print("=" * 50)
    
    # Create temporary test directory
    with tempfile.TemporaryDirectory() as temp_dir:
        test_root = Path(temp_dir)
        
        # Create test structure
        setup_test_structure(test_root)
        
        # Run barrel generator
        generator = AdvancedBarrelGenerator(test_root, verbose=True)
        # Generate barrel for the types directory
        generator.generate_barrel(test_root / "types")
        
        # Also run consumer import fixing
        generator._apply_automatic_fixes()
        
        # Check results
        verify_results(test_root)

def setup_test_structure(test_root: Path):
    """Set up test directory structure"""
    print("📁 Setting up test structure...")
    
    # Create types structure
    types_dir = test_root / "types"
    ui_dir = types_dir / "ui"
    ui_dir.mkdir(parents=True)
    
    # Create ui types file with AudioDemoConfiguration
    ui_types = ui_dir / "audio-demo.types.ts"
    ui_types.write_text("""// Audio demo types
export interface AudioDemoConfiguration {
  showGlobalUIExamples: boolean;
  showExclusionExamples: boolean;
}

export interface DragTestConfiguration {
  enabled: boolean;
  timeout: number;
}
""")
    
    # Create another ui types file
    ui_nav_types = ui_dir / "navigation.types.ts"
    ui_nav_types.write_text("""// Navigation types
export interface UIInteractionConfig {
  clickDelay: number;
  hoverTimeout: number;
}

export interface UIElementSelector {
  selector: string;
  timeout: number;
}
""")
    
    # Create constants directory with problematic file
    constants_dir = test_root / "constants" / "ui-tests"
    constants_dir.mkdir(parents=True)
    
    demo_config = constants_dir / "demo-configurations.constants.ts"
    demo_config.write_text("""// Demo configuration constants
import type { 
  AudioDemoConfiguration,
  DragTestConfiguration,
  UIInteractionConfig,
  UIElementSelector
} from '../../types';

export const DEFAULT_AUDIO_DEMO_CONFIG: AudioDemoConfiguration = {
  showGlobalUIExamples: true,
  showExclusionExamples: false
};

export const DEFAULT_DRAG_CONFIG: DragTestConfiguration = {
  enabled: true,
  timeout: 5000
};
""")
    
    print(f"  ✅ Created test structure in {test_root}")

def verify_results(test_root: Path):
    """Verify that the barrel generator fixed the import issues"""
    print("🔍 Verifying results...")
    
    # Check that main types barrel exists
    main_barrel = test_root / "types" / "index.ts"
    if not main_barrel.exists():
        print("  ❌ Main types barrel not created")
        return
    
    barrel_content = main_barrel.read_text()
    print(f"  📄 Types barrel content:\n{barrel_content}")
    
    # Check if ui is exported as namespace
    if "export type * as ui from './ui'" in barrel_content:
        print("  ✅ UI exported as namespace (expected)")
        
        # Check if constants file was fixed
        demo_config = test_root / "constants" / "ui-tests" / "demo-configurations.constants.ts"
        if demo_config.exists():
            config_content = demo_config.read_text()
            print(f"  📄 Constants file content:\n{config_content}")
            
            # Check if imports were fixed to use namespace
            if "ui.AudioDemoConfiguration" in config_content:
                print("  ✅ Namespace imports were fixed!")
            else:
                print("  ❌ Namespace imports were NOT fixed")
        else:
            print("  ❌ Constants file not found")
    else:
        print("  ❌ UI not exported as namespace")

if __name__ == "__main__":
    test_namespace_import_fix()