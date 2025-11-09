"""
Validator - Pre and post generation validation
Ensures directory structure is valid and generated content is correct
"""

import os
from pathlib import Path
from workflow_context import WorkflowContext


class Validator:
    """
    Validates directory structure and generated content.
    Performs pre-generation checks and post-generation verification.
    """
    
    def __init__(self):
        pass
    
    def validate_directory_structure(self, context: WorkflowContext, root_path: str) -> bool:
        """
        Validate that the directory structure is suitable for index generation.
        This is run before the main workflow begins.
        """
        if not os.path.exists(root_path):
            context.add_error(f"Root directory does not exist: {root_path}")
            return False
        
        if not os.path.isdir(root_path):
            context.add_error(f"Path is not a directory: {root_path}")
            return False
        
        # Check if directory is readable
        try:
            os.listdir(root_path)
        except PermissionError:
            context.add_error(f"Permission denied reading directory: {root_path}")
            return False
        except Exception as e:
            context.add_error(f"Error accessing directory: {e}", root_path)
            return False
        
        return True
    
    def validate_generated_content(self, context: WorkflowContext, dir_path: str, content: str) -> bool:
        """
        Validate that generated index content is syntactically correct.
        This is run after content generation but before writing files.
        """
        if not content.strip():
            context.add_warning("Generated empty content", dir_path)
            return False
        
        # Basic syntax validation
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith('//'):
                continue
            
            # Check for basic export syntax
            if line.startswith('export'):
                if not self._validate_export_line(line):
                    context.add_error(f"Invalid export syntax on line {i}: {line}", dir_path)
                    return False
            else:
                context.add_warning(f"Non-export line in index file on line {i}: {line}", dir_path)
        
        return True
    
    def _validate_export_line(self, line: str) -> bool:
        """Validate a single export line syntax"""
        import re
        
        # Valid export patterns
        patterns = [
            r'^export \* from \'.+\';$',  # export * from './module';
            r'^export type \* from \'.+\';$',  # export type * from './module';
            r'^export \{ .+ \} from \'.+\';$',  # export { name } from './module';
            r'^export type \{ .+ \} from \'.+\';$',  # export type { name } from './module';
            r'^export \{ default as \w+ \} from \'.+\';$',  # export { default as Name } from './module';
            r'^export type \{ default as \w+ \} from \'.+\';$',  # export type { default as Name } from './module';
        ]
        
        for pattern in patterns:
            if re.match(pattern, line):
                return True
        
        return False
    
    def validate_post_generation(self, context: WorkflowContext) -> bool:
        """
        Validate the entire generation result after all files are written.
        Performs final consistency checks.
        """
        success = True
        
        # Check for any critical errors
        if context.errors:
            print("❌ Generation completed with errors:")
            for error in context.errors:
                print(f"  - {error}")
            success = False
        
        # Report warnings
        if context.warnings:
            print("⚠️  Generation completed with warnings:")
            for warning in context.warnings:
                print(f"  - {warning}")
        
        return success
    
    def check_circular_dependencies(self, context: WorkflowContext) -> bool:
        """
        Check for potential circular dependency issues in the export structure.
        This is a basic check - full dependency analysis would require more sophisticated parsing.
        """
        # This is a simplified check - in a full implementation, we would build a dependency graph
        # and check for cycles. For now, we just ensure we don't have obvious issues.
        
        for dir_path, dir_context in context.directories.items():
            # Check if directory would export itself (basic check)
            dir_name = Path(dir_path).name
            
            for file_ctx in dir_context.files:
                for export in file_ctx.exports:
                    # Very basic check - this could be expanded
                    if export.name == dir_name:
                        context.add_warning(f"Potential naming conflict: export '{export.name}' matches directory name", dir_path)
        
        return True  # For now, always return True as this is just a warning check