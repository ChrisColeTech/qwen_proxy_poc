#!/usr/bin/env python3
"""
Frontend Generator V2 - CLI
Generates frontend components from backend config
"""

import argparse
import sys
import json
from pathlib import Path
from core.frontend_generator import FrontendGenerator

def main():
    parser = argparse.ArgumentParser(description='Frontend Generator V2')
    parser.add_argument('--output', type=str, default='../../../frontend-v2', help='Output directory')
    parser.add_argument('--config', type=str, help='Backend config file (default: /config/backend_config.json)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    try:
        if args.config:
            config_path = Path(args.config)
        else:
            # Default to /config/backend_config.json relative to project root
            script_dir = Path(__file__).parent
            project_root = script_dir.parent.parent.parent
            config_path = "/Users/chris/Projects/llm-api-vault-v2/config/backend_config.json"
        
        output_path = Path(args.output)
        
        print(f"🚀 Frontend Generator V2")
        print(f"📖 Config: {config_path}")
        print(f"📁 Output: {output_path}")
        
        if args.verbose:
            print("🔍 Verbose mode enabled")
        
        # Initialize generator
        generator = FrontendGenerator(output_path, config_path, verbose=args.verbose)
        
        # Generate all components
        generator.generate()
        
        print("✅ Generation completed successfully!")
        
    except Exception as e:
        print(f"❌ Generation failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()