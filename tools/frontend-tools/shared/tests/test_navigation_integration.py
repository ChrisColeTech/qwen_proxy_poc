#!/usr/bin/env python3
"""
Test Navigation Integration Issue

This test reproduces the bug where navigation generation reports success
but the static template system overwrites the dynamically generated files.
"""

import json
import tempfile
import os
from pathlib import Path

# Add shared modules to path
import sys
sys.path.append(str(Path(__file__).parent.parent))
from config_integration import ConfigIntegration
from navigation_generator import NavigationGenerator
from page_config_manager import PageInfo


def test_navigation_generation_vs_static_template():
    """Test that navigation generation actually updates files and isn't overwritten."""
    print("🧪 Testing Navigation Generation vs Static Template Override")
    print("=" * 60)
    
    # Create a temporary project directory
    with tempfile.TemporaryDirectory() as temp_dir:
        project_root = Path(temp_dir)
        
        # Step 1: Create a page configuration
        print("\n📝 Step 1: Creating page configuration...")
        config_integration = ConfigIntegration(project_root)
        
        test_page = PageInfo(
            id="testpage",
            name="TestPage", 
            type="parent",
            icon="TestIcon",
            description="Test page for navigation generation",
            component_name="TestPageComponent"
        )
        
        # Use the page config manager directly
        from page_config_manager import PageConfigManager
        config_manager = PageConfigManager(project_root)
        success = config_manager.add_page(test_page)
        print(f"✅ Page registered: {success}")
        
        # Verify config exists
        config_path = project_root / "pages.config.json"
        if config_path.exists():
            with open(config_path) as f:
                config_data = json.load(f)
            print(f"✅ Config contains: {list(config_data['pages'].keys())}")
        else:
            print("❌ Config file not created!")
            return False
        
        # Step 2: Generate navigation files using the NavigationGenerator
        print("\n🔄 Step 2: Generating navigation files...")
        
        # Create templates directory and navigation templates
        templates_dir = project_root / "templates"
        templates_dir.mkdir(exist_ok=True)
        
        # Create a simple test template
        types_template = templates_dir / "types.ts.dynamic"
        types_template.write_text("export type TabId = {{TAB_IDS}};")
        
        tabbar_template = templates_dir / "TabBar.tsx.dynamic"  
        tabbar_template.write_text("// TabBar with tabs: {{TAB_IDS}}")
        
        app_template = templates_dir / "App.tsx.dynamic"
        app_template.write_text("// App routing: {{TAB_IDS}}")
        
        # Generate navigation files
        nav_generator = NavigationGenerator(project_root, templates_dir)
        output_dir = project_root / "src" / "components" / "layout"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        generated_files = nav_generator.generate_all_files(output_dir)
        
        print(f"✅ Generated files: {list(generated_files.keys())}")
        
        # Step 3: Check the content of generated types.ts
        print("\n📋 Step 3: Checking generated content...")
        
        types_file = output_dir / "types.ts"
        if types_file.exists():
            content = types_file.read_text()
            print(f"✅ Generated types.ts: {content.strip()}")
            
            # This should show 'testpage', not 'static'
            if "'testpage'" in content:
                print("✅ SUCCESS: Navigation generation is working!")
                dynamic_generation_works = True
            elif "'static'" in content:
                print("❌ FAILURE: Static template override detected!")
                dynamic_generation_works = False
            else:
                print("❌ UNEXPECTED: Neither 'testpage' nor 'static' found")
                dynamic_generation_works = False
        else:
            print("❌ types.ts was not created!")
            dynamic_generation_works = False
        
        # Step 4: Simulate static template override
        print("\n⚠️  Step 4: Simulating static template override...")
        
        # This simulates what the static template system does
        static_content = "export type TabId = 'static'"
        types_file.write_text(static_content)
        
        updated_content = types_file.read_text()
        print(f"📄 After static override: {updated_content.strip()}")
        
        # Step 5: Results
        print("\n🎯 Step 5: Test Results")
        print("-" * 40)
        
        if dynamic_generation_works:
            print("✅ Navigation generation WORKS correctly")
            print("❌ But it can be overwritten by static templates")
            print("🔧 Solution: Prevent static template override or run generation last")
        else:
            print("❌ Navigation generation FAILED to work")
            print("🔧 Solution: Fix the navigation generation integration")
        
        return dynamic_generation_works


if __name__ == "__main__":
    success = test_navigation_generation_vs_static_template()
    if success:
        print("\n✅ Navigation generation works but needs protection from static override")
    else:
        print("\n❌ Navigation generation is broken and needs fixing")