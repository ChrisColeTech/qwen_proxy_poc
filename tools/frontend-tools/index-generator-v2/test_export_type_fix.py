#!/usr/bin/env python3
"""
Test for the pageInstructions export issue with verbatimModuleSyntax
Tests that const exports are properly handled for index generation
"""

import tempfile
import os
from pathlib import Path
from workflow_context import WorkflowContext
from file_analyzer import FileAnalyzer
from export_generator import ExportGenerator


def test_pageInstructions_const_export():
    """Test that const pageInstructions exports are handled correctly"""
    print("🧪 Testing pageInstructions const export scenario...")
    
    # Create a temporary directory structure
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create a file with pageInstructions export like in the templates
        instructions_file = Path(temp_dir) / "test-instructions.ts"
        instructions_content = '''export const pageInstructions = {
  id: 'test-page',
  title: 'Test Page Instructions',
  instructions: [
    'Welcome to the test page',
    'This is a test instruction'
  ]
}'''
        instructions_file.write_text(instructions_content)
        
        # Analyze the file
        context = WorkflowContext()
        analyzer = FileAnalyzer()
        generator = ExportGenerator()
        
        # Analyze the directory
        analyzer.analyze_directory(context, temp_dir)
        
        # Get the directory context
        dir_context = context.directories.get(temp_dir)
        assert dir_context is not None, "Directory context should exist"
        assert len(dir_context.files) == 1, "Should have one file"
        
        # Check the export info
        file_context = dir_context.files[0]
        assert len(file_context.exports) == 1, "Should have one export"
        
        export_info = file_context.exports[0]
        print(f"  📊 Export info: name={export_info.name}, is_type_only={export_info.is_type_only}")
        
        # The issue: pageInstructions is a const export (value), not type-only
        assert export_info.name == "pageInstructions"
        assert export_info.is_type_only == False, "pageInstructions should NOT be type-only (it's a const value)"
        
        # Generate index content
        if generator.should_generate_index(context, temp_dir):
            content = generator.generate_index_content(context, temp_dir)
            print(f"  📝 Generated content:\n{content}")
            
            # The fix: should use 'export *' not 'export type *' since it's a value export
            assert "export * from './test-instructions';" in content
            assert "export type * from './test-instructions';" not in content
            
        print("  ✅ Test passed!")


def test_interface_type_export():
    """Test that interface exports use export type correctly"""
    print("🧪 Testing interface type export scenario...")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create a file with interface export
        types_file = Path(temp_dir) / "test-types.ts"
        types_content = '''export interface TestInterface {
  id: string;
  name: string;
}

export type TestType = {
  value: number;
}'''
        types_file.write_text(types_content)
        
        # Analyze the file
        context = WorkflowContext()
        analyzer = FileAnalyzer()
        generator = ExportGenerator()
        
        analyzer.analyze_directory(context, temp_dir)
        
        # Check exports
        dir_context = context.directories.get(temp_dir)
        file_context = dir_context.files[0]
        
        # Should have 2 exports, both type-only
        assert len(file_context.exports) == 2
        for export_info in file_context.exports:
            print(f"  📊 Export info: name={export_info.name}, is_type_only={export_info.is_type_only}")
            assert export_info.is_type_only == True, f"{export_info.name} should be type-only"
        
        # Generate content - should use export type *
        if generator.should_generate_index(context, temp_dir):
            content = generator.generate_index_content(context, temp_dir)
            print(f"  📝 Generated content:\n{content}")
            
            # Should use export type * for type-only exports (after fix)
            assert "export type * from './test-types';" in content
            assert "export * from './test-types';" not in content
            
        print("  ✅ Test passed!")


if __name__ == "__main__":
    test_pageInstructions_const_export()
    test_interface_type_export()
    print("🎉 All tests completed!")