#!/usr/bin/env python3
"""
Index Generator - Main orchestrator for TypeScript index file generation
Coordinates the workflow pipeline to analyze files and generate barrel exports
"""

import os
import sys
import argparse
from pathlib import Path

from workflow_context import WorkflowContext
from file_analyzer import FileAnalyzer
from export_generator import ExportGenerator
from validator import Validator


class IndexGenerator:
    """
    Main orchestrator for the index generation workflow.
    Coordinates all modules to analyze files and generate index files.
    """
    
    def __init__(self):
        self.context = WorkflowContext()
        self.file_analyzer = FileAnalyzer()
        self.export_generator = ExportGenerator()
        self.validator = Validator()
    
    def run(self, root_path: str) -> bool:
        """
        Run the complete index generation workflow.
        Returns True if successful, False if errors occurred.
        """
        print(f"🚀 Starting index generation for: {root_path}")
        
        # Stage 1: Pre-flight validation
        print("📋 Stage 1: Validating directory structure...")
        if not self.validator.validate_directory_structure(self.context, root_path):
            return False
        
        # Stage 2: Directory discovery and file analysis
        print("🔍 Stage 2: Analyzing files and discovering exports...")
        self._discover_and_analyze_directories(root_path)
        
        # Stage 3: Circular dependency check
        print("🔄 Stage 3: Checking for potential issues...")
        self.validator.check_circular_dependencies(self.context)
        
        # Stage 4: Content generation
        print("📝 Stage 4: Generating index file content...")
        generated_files = self._generate_index_files(root_path)
        
        # Stage 5: Post-generation validation
        print("✅ Stage 5: Final validation...")
        success = self.validator.validate_post_generation(self.context)
        
        # Stage 6: Summary
        print("📊 Stage 6: Generation summary...")
        self._print_generation_summary(generated_files)
        
        return success and len(self.context.errors) == 0
    
    def _discover_and_analyze_directories(self, root_path: str):
        """Recursively discover directories and analyze files"""
        for root, dirs, files in os.walk(root_path):
            # Skip node_modules and hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
            
            # Analyze current directory
            self.file_analyzer.analyze_directory(self.context, root)
    
    def _generate_index_files(self, root_path: str) -> list:
        """Generate index files for all directories that need them"""
        generated_files = []
        
        # Sort directories to process leaf directories first
        directories = sorted(
            self.context.directories.items(),
            key=lambda x: x[0].count(os.sep),
            reverse=True
        )
        
        for dir_path, dir_context in directories:
            if self.export_generator.should_generate_index(self.context, dir_path):
                content = self.export_generator.generate_index_content(self.context, dir_path)
                
                if content and self.validator.validate_generated_content(self.context, dir_path, content):
                    if self.export_generator.write_index_file(dir_path, content):
                        generated_files.append(dir_path)
                        print(f"  ✓ Generated: {dir_path}/index.ts")
                    else:
                        self.context.add_error(f"Failed to write index file", dir_path)
        
        return generated_files
    
    def _print_generation_summary(self, generated_files: list):
        """Print a summary of the generation process"""
        self.context.print_summary()
        
        if generated_files:
            print(f"\n✅ Successfully generated {len(generated_files)} index files:")
            for file_path in generated_files:
                print(f"  - {file_path}/index.ts")
        else:
            print("\n⚠️  No index files were generated.")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Generate TypeScript index files with barrel exports',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python index_generator.py src/
  python index_generator.py frontend-v2/src/types/
  python index_generator.py .
        """
    )
    
    parser.add_argument(
        'directory',
        help='Root directory to process for index generation'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be generated without writing files'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    
    args = parser.parse_args()
    
    # Resolve and validate directory path
    root_path = Path(args.directory).resolve()
    if not root_path.exists():
        print(f"❌ Error: Directory does not exist: {root_path}")
        return 1
    
    if not root_path.is_dir():
        print(f"❌ Error: Path is not a directory: {root_path}")
        return 1
    
    # Run the generator
    generator = IndexGenerator()
    success = generator.run(str(root_path))
    
    if success:
        print("\n🎉 Index generation completed successfully!")
        return 0
    else:
        print("\n💥 Index generation failed with errors!")
        return 1


if __name__ == "__main__":
    sys.exit(main())