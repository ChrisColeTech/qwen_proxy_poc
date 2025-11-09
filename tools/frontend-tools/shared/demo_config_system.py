#!/usr/bin/env python3
"""
Demo of the Page Configuration System

Shows how the config system tracks page relationships and exports navigation data.
"""

import tempfile
import json
from pathlib import Path
from page_config_manager import PageConfigManager, PageInfo

def demo_config_system():
    """Demonstrate the config system in action."""
    
    print("🎯 Page Configuration System Demo")
    print("=" * 50)
    
    # Create temporary project
    with tempfile.TemporaryDirectory() as temp_dir:
        project_root = Path(temp_dir)
        config_manager = PageConfigManager(project_root)
        
        print(f"\n📁 Project root: {project_root}")
        print(f"📄 Config path: {config_manager.config_path}")
        
        # Step 1: Create parent pages
        print("\n🏗️  Step 1: Creating parent pages...")
        
        parent1 = PageInfo(
            id="testsection",
            name="TestSection", 
            type="parent",
            icon="Settings",
            description="UI Testing Section"
        )
        
        parent2 = PageInfo(
            id="gaming",
            name="Gaming",
            type="parent", 
            icon="Gamepad",
            description="Gaming Components"
        )
        
        config_manager.add_page(parent1)
        config_manager.add_page(parent2)
        
        print(f"✅ Added parent: {parent1.name} ({parent1.id})")
        print(f"✅ Added parent: {parent2.name} ({parent2.id})")
        
        # Step 2: Create child pages
        print("\n🏗️  Step 2: Creating child pages...")
        
        child1 = PageInfo(
            id="layouttest",
            name="LayoutTest",
            type="child",
            parent_id="testsection", 
            description="Layout testing component",
            has_mobile=True
        )
        
        child2 = PageInfo(
            id="dragtest", 
            name="DragTest",
            type="child",
            parent_id="testsection",
            description="Drag and drop testing",
            has_mobile=False
        )
        
        child3 = PageInfo(
            id="blackjack",
            name="BlackjackGame",
            type="child",
            parent_id="gaming",
            description="Blackjack card game",
            has_mobile=True
        )
        
        config_manager.add_page(child1)
        config_manager.add_page(child2)
        config_manager.add_page(child3)
        
        print(f"✅ Added child: {child1.name} → {child1.parent_id} (mobile: {child1.has_mobile})")
        print(f"✅ Added child: {child2.name} → {child2.parent_id} (mobile: {child2.has_mobile})")
        print(f"✅ Added child: {child3.name} → {child3.parent_id} (mobile: {child3.has_mobile})")
        
        # Step 3: Show config file contents
        print("\n📋 Step 3: Generated config file contents...")
        
        with open(config_manager.config_path, 'r') as f:
            config_data = json.load(f)
        
        print(f"📊 Total pages: {len(config_data['pages'])}")
        print(f"📊 Parent pages: {config_data['metadata']['parent_pages']}")
        print(f"📊 Child pages: {config_data['metadata']['child_pages']}")
        
        # Step 4: Query relationships
        print("\n🔍 Step 4: Querying page relationships...")
        
        # Get all parents
        parents = config_manager.get_parent_pages()
        print(f"\n📋 Parent pages ({len(parents)}):")
        for parent in parents:
            children = config_manager.get_children_for_parent(parent.id)
            print(f"  • {parent.name} ({parent.id}) → {len(children)} children")
            for child in children:
                mobile_indicator = "📱" if child.has_mobile else "🖥️ "
                print(f"    └─ {mobile_indicator} {child.name}")
        
        # Step 5: Export for navigation
        print("\n🧭 Step 5: Export for navigation generation...")
        
        from config_integration import ConfigIntegration
        integration = ConfigIntegration(project_root)
        nav_config = integration.export_config_for_navigation()
        
        print("\n📋 Tab Bar Data:")
        for tab in nav_config['tab_data']:
            print(f"  • {tab['label']} ({tab['id']}) - {tab['icon']}")
        
        print("\n📋 Routing Data:")
        for route in nav_config['routing_data']:
            print(f"  • {route['tab_id']} → {route['component_name']}")
        
        print("\n📋 Parent-Child Structure:")
        for parent in nav_config['parent_pages']:
            children_str = ', '.join(parent['children']) if parent['children'] else 'none'
            print(f"  • {parent['name']}: [{children_str}]")
        
        # Step 6: Validation
        print("\n✅ Step 6: Configuration validation...")
        
        issues = config_manager.validate_config()
        if issues:
            print("❌ Validation issues found:")
            for issue in issues:
                print(f"  • {issue}")
        else:
            print("✅ Configuration is valid!")
        
        # Summary
        summary = config_manager.get_config_summary()
        print(f"\n📊 Summary:")
        print(f"  • Config version: {summary['version']}")
        print(f"  • Total pages: {summary['total_pages']}")
        print(f"  • Parent pages: {summary['parent_pages']}")
        print(f"  • Child pages: {summary['child_pages']}")
        print(f"  • Config location: {config_manager.config_path}")
        
        print("\n🎉 Demo complete! The config system provides a complete")
        print("   source of truth for navigation and tabbar generation.")


if __name__ == "__main__":
    demo_config_system()