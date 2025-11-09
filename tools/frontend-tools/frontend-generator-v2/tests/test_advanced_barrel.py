#!/usr/bin/env python3
"""
Test script for the Advanced Barrel Generator
"""

import sys
import json
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from core.advanced_barrel_generator import AdvancedBarrelGenerator

def main():
    print("🧪 Testing Advanced Barrel Generator")
    print("=" * 50)
    
    # Initialize generator
    test_base = Path(__file__).parent
    generator = AdvancedBarrelGenerator(test_base, verbose=True)
    
    # Run comprehensive tests
    test_results = generator.run_tests()
    
    print("\n📊 Test Results Summary:")
    print("-" * 30)
    for result in test_results:
        print(f"✅ {result['test_case']}: {result['files_processed']} files, {result['content_length']} chars")
    
    # Generate analysis report
    report = generator.generate_report()
    
    print(f"\n📈 Analysis Report:")
    print("-" * 30)
    print(f"Files analyzed: {report['statistics']['files_analyzed']}")
    print(f"Exports found: {report['statistics']['exports_found']}")
    print(f"Conflicts detected: {report['statistics']['conflicts_detected']}")
    print(f"Barrels generated: {report['statistics']['barrels_generated']}")
    print(f"Validation errors: {report['validation_errors']}")
    
    # Save detailed report
    report_file = Path(__file__).parent / "barrel_analysis_report.json"
    with open(report_file, "w") as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\n📄 Detailed report saved to: {report_file}")
    
    print("\n✅ Advanced Barrel Generator tests completed successfully!")
    
    return generator

if __name__ == "__main__":
    generator = main()