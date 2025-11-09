"""
Example showing how to integrate the unified logger into existing tools.

This demonstrates how to replace existing print statements with the unified logger
in a way that maintains the same user experience while adding proper log management.
"""

from pathlib import Path
from unified_logger import create_logger, LogMode

# Example of how the mobile-pages-v2 tool would be modified
class ExamplePageGenerator:
    """Example showing logger integration in a page generator tool."""
    
    def __init__(self, mode="minimal", log_file=None):
        # Initialize the logger for this tool
        self.logger = create_logger(
            tool_name="page_generator",
            mode=mode,
            log_file=log_file
        )
    
    def create_parent_page(self, name: str):
        """Example method showing before/after logging conversion."""
        
        # OLD WAY (direct print statements):
        # print(f"🚀 Creating parent page: {name}")
        
        # NEW WAY (using unified logger):
        self.logger.operation(f"Creating parent page: {name}")
        
        try:
            # Simulate some work
            self._validate_project_structure()
            self._generate_templates()
            self._update_navigation()
            
            # OLD WAY:
            # print(f"✅ Parent page creation completed")
            
            # NEW WAY:
            self.logger.success("Parent page creation completed")
            
        except Exception as e:
            # OLD WAY:
            # print(f"❌ Error creating parent page: {e}")
            
            # NEW WAY:
            self.logger.error(f"Error creating parent page: {e}")
            raise
    
    def _validate_project_structure(self):
        """Internal method showing different log levels."""
        
        # OLD WAY:
        # print("🔍 Analyzing project structure...")
        
        # NEW WAY:
        self.logger.info("Analyzing project structure")
        
        # Verbose details that previously weren't logged:
        self.logger.verbose("Scanning src/components directory")
        self.logger.verbose("Checking for existing hook files")
        self.logger.debug("Found 12 existing components")
    
    def _generate_templates(self):
        """Show file operation logging."""
        files_created = [
            "src/pages/example/ExamplePage.tsx",
            "src/hooks/example/useExampleActions.ts",
            "src/constants/actions/pages/example.ts"
        ]
        
        for file_path in files_created:
            # OLD WAY:
            # print(f"  ✅ Created: {file_path}")
            
            # NEW WAY:
            self.logger.verbose(f"Created: {file_path}")
        
        # Summary at info level
        self.logger.info(f"Generated {len(files_created)} template files")
    
    def _update_navigation(self):
        """Show different message types."""
        self.logger.verbose("Updating navigation configuration")
        self.logger.verbose("Regenerating App.tsx routing")
        self.logger.info("Navigation files updated successfully")


# Example CLI integration
def main():
    """Example CLI showing how to handle different verbosity levels."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Example Page Generator")
    parser.add_argument("--verbose", "-v", action="store_true", 
                       help="Enable verbose output")
    parser.add_argument("--silent", "-s", action="store_true",
                       help="Enable silent mode (errors and warnings only)")
    parser.add_argument("--log-file", type=str,
                       help="Log to file (optional)")
    parser.add_argument("name", help="Page name to create")
    
    args = parser.parse_args()
    
    # Determine log mode from CLI args
    if args.verbose:
        mode = "verbose"
    elif args.silent:
        mode = "silent"
    else:
        mode = "minimal"
    
    # Create generator with appropriate logging
    log_file = Path(args.log_file) if args.log_file else None
    generator = ExamplePageGenerator(mode=mode, log_file=log_file)
    
    # Run the operation
    generator.create_parent_page(args.name)


# Migration helper for existing code
def convert_print_statements():
    """
    Example showing systematic conversion of existing print statements.
    This would be used as a guide for updating existing tools.
    """
    
    conversions = {
        # Success messages (with ✅ emoji)
        'print(f"✅ {message}")': 'logger.success(message)',
        'print("✅ Operation completed")': 'logger.success("Operation completed")',
        
        # Operation start (with 🚀 emoji) 
        'print(f"🚀 {message}")': 'logger.operation(message)',
        'print("🚀 Starting operation")': 'logger.operation("Starting operation")',
        
        # Error messages (with ❌ emoji)
        'print(f"❌ {message}")': 'logger.error(message)',
        'print("❌ Operation failed")': 'logger.error("Operation failed")',
        
        # Debug/analysis (with 🔍 emoji)
        'print(f"🔍 DEBUG: {message}")': 'logger.debug(message)',
        'print("🔍 Analyzing...")': 'logger.info("Analyzing...")',
        
        # General info messages
        'print(f"  ✅ Created: {file}")': 'logger.verbose(f"Created: {file}")',
        'print("Processing...")': 'logger.info("Processing...")',
        
        # Warning messages
        'print(f"⚠️ {message}")': 'logger.warning(message)',
    }
    
    print("Conversion guide for existing print statements:")
    print("=" * 50)
    for old, new in conversions.items():
        print(f"OLD: {old}")
        print(f"NEW: {new}")
        print()


if __name__ == "__main__":
    # Show conversion examples
    convert_print_statements()
    print("\n" + "=" * 50)
    print("Running example:")
    print("=" * 50)
    
    # Run example with different modes
    example_generator = ExamplePageGenerator(mode="verbose")
    example_generator.create_parent_page("ExamplePage")