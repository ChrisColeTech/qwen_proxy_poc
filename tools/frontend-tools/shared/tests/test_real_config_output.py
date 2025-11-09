#!/usr/bin/env python3
"""
Real Config Output Test

Creates actual config file and shows exactly what gets generated
when pages are added through the system.
"""

import tempfile
import json
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from config_integration import ConfigIntegration

# Mock page config for testing
class MockPageConfig:
    def __init__(self, name: str, parent: str = None, mobile: bool = False, icon: str = "Navigation", description: str = ""):
        self.name = name
        self.base_name = name
        self.page_name = f"{name}Page"
        self.page_id = name.lower()
        self.parent = parent
        self.parent_id = parent.lower() if parent else None
        self.mobile = mobile
        self.icon = icon
        self.description = description or f"Test {name} page"

def test_real_config_generation():
    """Test real config file generation and show the output."""
    
    print("🎯 Real Config Generation Test")
    print("=" * 50)
    
    # Use persistent directory for artifacts
    artifacts_dir = os.environ.get('TEST_ARTIFACTS_DIR')
    if artifacts_dir:
        project_root = Path(artifacts_dir)
        project_root.mkdir(exist_ok=True)
    else:
        # Fallback to temp directory if environment not set
        temp_dir = tempfile.mkdtemp()
        project_root = Path(temp_dir)
    
    integration = ConfigIntegration(project_root)
    
    print(f"\n📁 Project root: {project_root}")
    print(f"📄 Config path: {integration.get_config_path()}")
    
    # Step 1: Create parent pages
    print("\n🏗️  Step 1: Creating parent pages...")
    
    parent1 = MockPageConfig(
        name="TestSection",
        icon="Settings", 
        description="UI Testing Components"
    )
    
    parent2 = MockPageConfig(
        name="Gaming",
        icon="Gamepad",
        description="Gaming & Entertainment"
    )
    
    result1 = integration.register_parent_page(parent1)
    result2 = integration.register_parent_page(parent2)
    
    print(f"✅ Parent 1 registered: {result1}")
    print(f"✅ Parent 2 registered: {result2}")
    
    # Step 2: Create child pages
    print("\n🏗️  Step 2: Creating child pages...")
    
    child1 = MockPageConfig(
        name="LayoutTest",
        parent="TestSection",
        mobile=True,
        description="Responsive layout testing"
    )
    
    child2 = MockPageConfig(
        name="DragTest", 
        parent="TestSection",
        mobile=False,
        description="Drag and drop interactions"
    )
    
    child3 = MockPageConfig(
        name="BlackjackGame",
        parent="Gaming",
        mobile=True, 
        description="Classic blackjack card game"
    )
    
    result3 = integration.register_child_page(child1)
    result4 = integration.register_child_page(child2)
    result5 = integration.register_child_page(child3)
    
    print(f"✅ Child 1 registered: {result3}")
    print(f"✅ Child 2 registered: {result4}")
    print(f"✅ Child 3 registered: {result5}")
    
    # Step 3: Show actual config file
    print("\n📋 Step 3: Generated config file contents...")
    
    config_path = integration.get_config_path()
    if config_path.exists():
        with open(config_path, 'r') as f:
            config_data = json.load(f)
        
        print("\n" + "=" * 60)
        print("📄 ACTUAL CONFIG FILE CONTENTS:")
        print("=" * 60)
        print(json.dumps(config_data, indent=2))
        print("=" * 60)
    else:
        print("❌ Config file was not created!")
        return False
    
    # Step 4: Show navigation export
    print("\n🧭 Step 4: Navigation export data...")
    
    nav_config = integration.export_config_for_navigation()
    print("\n" + "-" * 40)
    print("🧭 NAVIGATION EXPORT:")
    print("-" * 40)
    print(json.dumps(nav_config, indent=2))
    print("-" * 40)
    
    # Step 5: Validate and summarize
    print("\n✅ Step 5: Validation and summary...")
    
    issues = integration.validate_config()
    if issues:
        print("❌ Validation issues:")
        for issue in issues:
            print(f"  • {issue}")
    else:
        print("✅ Configuration is valid!")
    
    summary = integration.get_config_summary()
    print(f"\n📊 Summary:")
    print(f"  • Total pages: {summary['total_pages']}")
    print(f"  • Parent pages: {summary['parent_pages']}")
    print(f"  • Child pages: {summary['child_pages']}")
    print(f"  • Config exists: {summary['config_exists']}")
    
    # Step 6: Show parent-child relationships
    print("\n🔗 Step 6: Parent-child relationships...")
    
    parents = integration.get_navigation_pages()
    for parent in parents:
        children = integration.get_parent_children(parent.id)
        print(f"\n📋 {parent.name} ({parent.id}):")
        print(f"   └─ Icon: {parent.icon}")
        print(f"   └─ Component: {parent.component_name}")
        print(f"   └─ Children: {len(children)}")
        for child in children:
            mobile_indicator = "📱" if child.has_mobile else "🖥️ "
            print(f"      └─ {mobile_indicator} {child.name} ({child.id})")
    
    print(f"\n🎉 Test complete! Config file created at:")
    print(f"   {config_path}")
    
    return True

if __name__ == "__main__":
    test_real_config_generation()