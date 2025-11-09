#!/usr/bin/env python3
"""
Test Orchestrator

Runs all tests in the shared/tests folder and provides comprehensive test reporting.
Supports different test execution modes and detailed output formatting.
"""

import sys
import subprocess
import importlib
import traceback
import tempfile
import shutil
import os
from pathlib import Path
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass
from datetime import datetime
import time


@dataclass
class TestResult:
    """Result of running a single test module."""
    module_name: str
    success: bool
    execution_time: float
    output: str
    error: str = ""
    test_count: int = 0


class TestOrchestrator:
    """
    Orchestrates execution of all tests in the tests folder.
    
    Responsibilities:
    - Discover test modules in tests folder
    - Execute tests with proper error handling
    - Collect and format test results
    - Provide detailed reporting and statistics
    """
    
    def __init__(self, tests_dir: Path = None):
        if tests_dir is None:
            tests_dir = Path(__file__).parent / "tests"
        
        self.tests_dir = Path(tests_dir)
        self.results: List[TestResult] = []
        
        if not self.tests_dir.exists():
            raise FileNotFoundError(f"Tests directory not found: {self.tests_dir}")
    
    def discover_test_modules(self) -> List[str]:
        """Discover all test modules in the tests directory."""
        test_files = list(self.tests_dir.glob("test_*.py"))
        
        # Sort for consistent execution order
        test_files.sort()
        
        # Convert to module names (remove .py extension)
        module_names = [f.stem for f in test_files]
        
        return module_names
    
    def run_python_module_tests(self, module_name: str) -> TestResult:
        """Run tests for a Python module using direct execution."""
        start_time = time.time()
        
        try:
            # Add tests directory to Python path
            test_file_path = self.tests_dir / f"{module_name}.py"
            
            if not test_file_path.exists():
                return TestResult(
                    module_name=module_name,
                    success=False,
                    execution_time=0.0,
                    output="",
                    error=f"Test file not found: {test_file_path}"
                )
            
            # Create artifacts directory for this test
            artifacts_dir = self.tests_dir / f"{module_name}_artifacts"
            artifacts_dir.mkdir(exist_ok=True)
            
            # Set environment variable so tests can use it
            env = os.environ.copy()
            env['TEST_ARTIFACTS_DIR'] = str(artifacts_dir)
            
            # Execute the test file directly
            result = subprocess.run(
                [sys.executable, str(test_file_path)],
                capture_output=True,
                text=True,
                timeout=60,  # 60 second timeout
                cwd=str(self.tests_dir),
                env=env
            )
            
            execution_time = time.time() - start_time
            
            return TestResult(
                module_name=module_name,
                success=result.returncode == 0,
                execution_time=execution_time,
                output=result.stdout,
                error=result.stderr,
                test_count=self._count_tests_in_output(result.stdout)
            )
        
        except subprocess.TimeoutExpired:
            execution_time = time.time() - start_time
            return TestResult(
                module_name=module_name,
                success=False,
                execution_time=execution_time,
                output="",
                error="Test execution timed out (60s)"
            )
        
        except Exception as e:
            execution_time = time.time() - start_time
            return TestResult(
                module_name=module_name,
                success=False,
                execution_time=execution_time,
                output="",
                error=f"Unexpected error: {str(e)}\n{traceback.format_exc()}"
            )
    
    def _count_tests_in_output(self, output: str) -> int:
        """Attempt to count tests from output."""
        # Simple heuristic - count integration test mentions or success indicators
        count = 0
        lines = output.lower().split('\n')
        
        for line in lines:
            if 'test passed' in line or 'integration test' in line or '✅' in line:
                count += 1
        
        # Default to 1 if we can't determine count but there's successful output
        return count if count > 0 else (1 if output.strip() else 0)
    
    def run_all_tests(self, verbose: bool = True) -> Dict[str, Any]:
        """
        Run all discovered tests.
        
        Args:
            verbose: If True, print detailed output during execution
            
        Returns:
            Dictionary with test execution summary
        """
        if verbose:
            print(f"🔍 Discovering tests in: {self.tests_dir}")
        
        test_modules = self.discover_test_modules()
        
        if not test_modules:
            print("⚠️  No test modules found!")
            return {
                'total_modules': 0,
                'passed': 0,
                'failed': 0,
                'execution_time': 0.0,
                'results': []
            }
        
        if verbose:
            print(f"📋 Found {len(test_modules)} test modules:")
            for module in test_modules:
                print(f"   • {module}")
            print()
        
        start_time = time.time()
        
        # Run each test module
        for i, module_name in enumerate(test_modules, 1):
            if verbose:
                print(f"🧪 Running {module_name} ({i}/{len(test_modules)})...")
            
            result = self.run_python_module_tests(module_name)
            self.results.append(result)
            
            if verbose:
                status = "✅ PASSED" if result.success else "❌ FAILED"
                print(f"   {status} in {result.execution_time:.2f}s")
                
                if result.output and result.success:
                    # Show first few lines of successful output
                    output_lines = result.output.strip().split('\n')[:3]
                    for line in output_lines:
                        if line.strip():
                            print(f"   📝 {line}")
                
                if not result.success and result.error:
                    # Show error for failed tests
                    error_lines = result.error.strip().split('\n')[:3]
                    for line in error_lines:
                        if line.strip():
                            print(f"   💥 {line}")
                print()
        
        total_time = time.time() - start_time
        
        # Generate summary
        summary = self._generate_summary(total_time)
        
        if verbose:
            self._print_detailed_summary(summary)
        
        return summary
    
    def _generate_summary(self, total_time: float) -> Dict[str, Any]:
        """Generate test execution summary."""
        passed = sum(1 for r in self.results if r.success)
        failed = len(self.results) - passed
        total_tests = sum(r.test_count for r in self.results)
        
        return {
            'total_modules': len(self.results),
            'passed_modules': passed,
            'failed_modules': failed,
            'total_tests': total_tests,
            'execution_time': total_time,
            'success_rate': (passed / len(self.results) * 100) if self.results else 0,
            'results': self.results,
            'timestamp': datetime.now().isoformat()
        }
    
    def _print_detailed_summary(self, summary: Dict[str, Any]) -> None:
        """Print detailed test execution summary."""
        print("=" * 60)
        print("📊 TEST EXECUTION SUMMARY")
        print("=" * 60)
        print(f"Total Modules:    {summary['total_modules']}")
        print(f"✅ Passed:        {summary['passed_modules']}")
        print(f"❌ Failed:        {summary['failed_modules']}")
        print(f"🧪 Total Tests:   {summary['total_tests']}")
        print(f"⏱️  Total Time:    {summary['execution_time']:.2f}s")
        print(f"📈 Success Rate:  {summary['success_rate']:.1f}%")
        print()
        
        # Show failed tests details
        failed_results = [r for r in self.results if not r.success]
        if failed_results:
            print("💥 FAILED TESTS:")
            for result in failed_results:
                print(f"   • {result.module_name}")
                if result.error:
                    error_preview = result.error.strip().split('\n')[0]
                    print(f"     {error_preview}")
            print()
        
        # Show execution times
        print("⏱️  EXECUTION TIMES:")
        for result in sorted(self.results, key=lambda x: x.execution_time, reverse=True):
            status = "✅" if result.success else "❌"
            print(f"   {status} {result.module_name}: {result.execution_time:.2f}s")
        
        print("=" * 60)
        
        # Overall result
        if summary['failed_modules'] == 0:
            print("🎉 ALL TESTS PASSED!")
        else:
            print(f"⚠️  {summary['failed_modules']} TEST MODULE(S) FAILED")
        
        print("=" * 60)
    
    def run_specific_test(self, module_name: str, verbose: bool = True) -> TestResult:
        """Run a specific test module."""
        if verbose:
            print(f"🧪 Running specific test: {module_name}")
        
        result = self.run_python_module_tests(module_name)
        
        if verbose:
            status = "✅ PASSED" if result.success else "❌ FAILED"
            print(f"   {status} in {result.execution_time:.2f}s")
            
            if result.output:
                print("📝 Output:")
                print(result.output)
            
            if result.error:
                print("💥 Errors:")
                print(result.error)
        
        return result
    
    def generate_report(self, output_file: Path = None) -> Path:
        """Generate a detailed test report."""
        if not self.results:
            raise RuntimeError("No test results available. Run tests first.")
        
        if output_file is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = self.tests_dir / f"test_report_{timestamp}.txt"
        
        summary = self._generate_summary(sum(r.execution_time for r in self.results))
        
        with open(output_file, 'w') as f:
            f.write("SHARED MODULE TEST REPORT\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Generated: {summary['timestamp']}\n")
            f.write(f"Tests Directory: {self.tests_dir}\n\n")
            
            f.write("SUMMARY:\n")
            f.write(f"Total Modules: {summary['total_modules']}\n")
            f.write(f"Passed: {summary['passed_modules']}\n")
            f.write(f"Failed: {summary['failed_modules']}\n")
            f.write(f"Success Rate: {summary['success_rate']:.1f}%\n")
            f.write(f"Total Time: {summary['execution_time']:.2f}s\n\n")
            
            f.write("DETAILED RESULTS:\n")
            f.write("-" * 30 + "\n")
            
            for result in self.results:
                f.write(f"\nModule: {result.module_name}\n")
                f.write(f"Status: {'PASSED' if result.success else 'FAILED'}\n")
                f.write(f"Time: {result.execution_time:.2f}s\n")
                f.write(f"Tests: {result.test_count}\n")
                
                if result.output:
                    f.write("Output:\n")
                    f.write(result.output)
                    f.write("\n")
                
                if result.error:
                    f.write("Errors:\n")
                    f.write(result.error)
                    f.write("\n")
                
                f.write("-" * 30 + "\n")
        
        print(f"📋 Test report generated: {output_file}")
        return output_file


def main():
    """Main CLI interface for test orchestrator."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Run tests for shared modules")
    parser.add_argument(
        "--module", "-m",
        help="Run specific test module (e.g., 'test_navigation_generator')"
    )
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Reduce output verbosity"
    )
    parser.add_argument(
        "--report", "-r",
        help="Generate detailed report to specified file"
    )
    parser.add_argument(
        "--tests-dir",
        help="Specify tests directory (default: ./tests)"
    )
    
    args = parser.parse_args()
    
    # Initialize orchestrator
    tests_dir = Path(args.tests_dir) if args.tests_dir else None
    orchestrator = TestOrchestrator(tests_dir)
    
    try:
        if args.module:
            # Run specific test
            result = orchestrator.run_specific_test(args.module, verbose=not args.quiet)
            exit_code = 0 if result.success else 1
        else:
            # Run all tests
            summary = orchestrator.run_all_tests(verbose=not args.quiet)
            exit_code = 0 if summary['failed_modules'] == 0 else 1
        
        # Generate report if requested
        if args.report:
            report_path = Path(args.report)
            orchestrator.generate_report(report_path)
        
        sys.exit(exit_code)
        
    except Exception as e:
        print(f"💥 Test orchestrator failed: {e}")
        if not args.quiet:
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()