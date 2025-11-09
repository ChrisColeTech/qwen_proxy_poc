#!/usr/bin/env python3
"""
Comprehensive test suite for the Advanced Barrel Generator.

This script runs all test cases to validate:
1. Missing export detection and fixing
2. Type-only import detection and conversion
3. Over-aggressive type-only import prevention
4. Name collision handling
5. Comprehensive type-only import scenarios
"""

import sys
import subprocess
import time
from pathlib import Path
from typing import List, Dict, Tuple

def run_test(test_file: Path) -> Tuple[bool, str, float]:
    """Run a single test file and return results"""
    print(f"🧪 Running {test_file.name}...")
    start_time = time.time()
    
    try:
        result = subprocess.run(
            [sys.executable, str(test_file)],
            capture_output=True,
            text=True,
            timeout=60  # 60 second timeout per test
        )
        
        duration = time.time() - start_time
        success = result.returncode == 0
        output = result.stdout + result.stderr
        
        return success, output, duration
        
    except subprocess.TimeoutExpired:
        duration = time.time() - start_time
        return False, "❌ Test timed out after 60 seconds", duration
    except Exception as e:
        duration = time.time() - start_time
        return False, f"❌ Test failed with exception: {e}", duration

def main():
    """Run all tests and provide comprehensive report"""
    print("=" * 80)
    print("🚀 ADVANCED BARREL GENERATOR - COMPREHENSIVE TEST SUITE")
    print("=" * 80)
    print()
    
    # Automatically discover all test files
    current_dir = Path(__file__).parent
    test_files = sorted([f.name for f in current_dir.glob("test_*.py")])
    
    
    # Verify all test files exist
    missing_tests = []
    existing_tests = []
    
    for test_file in test_files:
        test_path = current_dir / test_file
        if test_path.exists():
            existing_tests.append(test_path)
        else:
            missing_tests.append(test_file)
    
    if missing_tests:
        print("⚠️  WARNING: The following test files are missing:")
        for missing in missing_tests:
            print(f"   - {missing}")
        print()
    
    if not existing_tests:
        print("❌ FATAL: No test files found!")
        return 1
    
    print(f"📋 Found {len(existing_tests)} test files to execute:")
    for test_path in existing_tests:
        print(f"   ✓ {test_path.name}")
    print()
    
    # Run all tests
    results: List[Dict] = []
    total_start_time = time.time()
    
    for test_path in existing_tests:
        success, output, duration = run_test(test_path)
        
        results.append({
            'name': test_path.name,
            'success': success,
            'output': output,
            'duration': duration
        })
        
        # Print immediate result
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"   {status} {test_path.name} ({duration:.2f}s)")
        
        # If test failed, show abbreviated output
        if not success:
            lines = output.split('\n')
            # Show last few lines which usually contain the error
            relevant_lines = [line for line in lines[-10:] if line.strip()]
            if relevant_lines:
                print("      Error details:")
                for line in relevant_lines[-5:]:  # Last 5 relevant lines
                    print(f"      {line}")
        print()
    
    total_duration = time.time() - total_start_time
    
    # Generate comprehensive report
    print("=" * 80)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for r in results if r['success'])
    failed = len(results) - passed
    
    print(f"📈 Overall Results: {passed}/{len(results)} tests passed")
    print(f"⏱️  Total execution time: {total_duration:.2f}s")
    print()
    
    # Detailed results
    if passed > 0:
        print("✅ PASSED TESTS:")
        for result in results:
            if result['success']:
                print(f"   ✓ {result['name']} ({result['duration']:.2f}s)")
        print()
    
    if failed > 0:
        print("❌ FAILED TESTS:")
        for result in results:
            if not result['success']:
                print(f"   ✗ {result['name']} ({result['duration']:.2f}s)")
        print()
        
        print("🔍 FAILURE DETAILS:")
        print("-" * 60)
        for result in results:
            if not result['success']:
                print(f"\n🚫 {result['name']}:")
                print(result['output'][-1000:])  # Last 1000 chars of output
                print("-" * 40)
    
    # Test coverage summary
    print("🧪 TEST COVERAGE SUMMARY:")
    print("   ✓ Missing Export Detection")
    print("   ✓ Type-Only Import Conversion") 
    print("   ✓ Over-Aggressive Type-Only Prevention")
    print("   ✓ Comprehensive Type-Only Scenarios")
    print("   ✓ Name Collision Handling")
    print()
    
    # Final result
    if failed == 0:
        print("🎉 ALL TESTS PASSED! The Advanced Barrel Generator is working correctly.")
        return 0
    else:
        print(f"💥 {failed} test(s) failed. Please review the failures above.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)