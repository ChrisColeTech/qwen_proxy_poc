"""
Comprehensive tests for the unified logging framework.

Tests all logging modes, file logging, emoji formatting, and thread safety.
"""

import pytest
import threading
import time
from pathlib import Path
from io import StringIO
import sys
import logging
from unittest.mock import patch, MagicMock
import shutil

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from unified_logger import UnifiedLogger, LogMode, LogLevel, EmojiFormatter, create_logger

# Test output directory
TEST_OUTPUT_DIR = Path(__file__).parent / "test_outputs" / "unified_logger"
TEST_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class TestEmojiFormatter:
    """Test the emoji formatter functionality."""
    
    def test_emoji_formatter_with_emojis(self):
        """Test that emoji formatter adds correct emojis."""
        formatter = EmojiFormatter(use_emojis=True, include_timestamp=False)
        
        # Create a mock record
        record = logging.LogRecord(
            name="test", level=LogLevel.INFO.value, pathname="", lineno=0,
            msg="Test message", args=(), exc_info=None
        )
        
        formatted = formatter.format(record)
        assert "ℹ️" in formatted
        assert "Test message" in formatted
    
    def test_emoji_formatter_without_emojis(self):
        """Test formatter without emojis."""
        formatter = EmojiFormatter(use_emojis=False, include_timestamp=False)
        
        record = logging.LogRecord(
            name="test", level=LogLevel.INFO.value, pathname="", lineno=0,
            msg="Test message", args=(), exc_info=None
        )
        
        formatted = formatter.format(record)
        assert "ℹ️" not in formatted
        assert formatted == "Test message"
    
    def test_emoji_formatter_with_timestamp(self):
        """Test formatter with timestamp."""
        formatter = EmojiFormatter(use_emojis=False, include_timestamp=True)
        
        record = logging.LogRecord(
            name="test", level=LogLevel.INFO.value, pathname="", lineno=0,
            msg="Test message", args=(), exc_info=None
        )
        
        formatted = formatter.format(record)
        assert "test" in formatted
        assert "INFO" in formatted
        assert "Test message" in formatted
        assert "-" in formatted  # Should have timestamp separators


class TestUnifiedLogger:
    """Test the main UnifiedLogger class."""
    
    def setup_method(self):
        """Setup for each test method."""
        # Clear any existing logger instances
        UnifiedLogger._instances.clear()
    
    def test_logger_creation(self):
        """Test basic logger creation."""
        logger = UnifiedLogger("test_tool", LogMode.MINIMAL)
        assert logger.tool_name == "test_tool"
        assert logger.mode == LogMode.MINIMAL
        assert logger.log_file is None
        assert logger.logger.name == "unified_logger.test_tool"
    
    def test_singleton_behavior(self):
        """Test that get_logger returns same instance for same parameters."""
        logger1 = UnifiedLogger.get_logger("test_tool", LogMode.MINIMAL)
        logger2 = UnifiedLogger.get_logger("test_tool", LogMode.MINIMAL)
        assert logger1 is logger2
    
    def test_different_tools_different_instances(self):
        """Test that different tool names get different instances."""
        logger1 = UnifiedLogger.get_logger("tool1", LogMode.MINIMAL)
        logger2 = UnifiedLogger.get_logger("tool2", LogMode.MINIMAL)
        assert logger1 is not logger2
        assert logger1.tool_name == "tool1"
        assert logger2.tool_name == "tool2"
    
    @patch('sys.stdout', new_callable=StringIO)
    def test_verbose_mode_output(self, mock_stdout):
        """Test that verbose mode shows all message types."""
        logger = UnifiedLogger("test_tool", LogMode.VERBOSE)
        
        logger.verbose("Verbose message")
        logger.debug("Debug message")
        logger.info("Info message")
        logger.warning("Warning message")
        logger.error("Error message")
        
        output = mock_stdout.getvalue()
        assert "Verbose message" in output
        assert "Debug message" in output
        assert "Info message" in output
        assert "Warning message" in output
        assert "Error message" in output
    
    @patch('sys.stdout', new_callable=StringIO)
    def test_minimal_mode_output(self, mock_stdout):
        """Test that minimal mode filters out verbose and debug."""
        logger = UnifiedLogger("test_tool", LogMode.MINIMAL)
        
        logger.verbose("Verbose message")
        logger.debug("Debug message")
        logger.info("Info message")
        logger.warning("Warning message")
        logger.error("Error message")
        
        output = mock_stdout.getvalue()
        assert "Verbose message" not in output
        assert "Debug message" not in output
        assert "Info message" in output
        assert "Warning message" in output
        assert "Error message" in output
    
    @patch('sys.stdout', new_callable=StringIO)
    def test_silent_mode_output(self, mock_stdout):
        """Test that silent mode only shows warnings and errors."""
        logger = UnifiedLogger("test_tool", LogMode.SILENT)
        
        logger.verbose("Verbose message")
        logger.debug("Debug message")
        logger.info("Info message")
        logger.warning("Warning message")
        logger.error("Error message")
        
        output = mock_stdout.getvalue()
        assert "Verbose message" not in output
        assert "Debug message" not in output
        assert "Info message" not in output
        assert "Warning message" in output
        assert "Error message" in output
    
    @patch('sys.stdout', new_callable=StringIO)
    def test_success_and_operation_methods(self, mock_stdout):
        """Test success and operation convenience methods."""
        logger = UnifiedLogger("test_tool", LogMode.MINIMAL)
        
        logger.success("Operation successful")
        logger.operation("Starting operation")
        
        output = mock_stdout.getvalue()
        assert "✅" in output
        assert "🚀" in output
        assert "Operation successful" in output
        assert "Starting operation" in output
    
    def test_file_logging(self):
        """Test that file logging works correctly."""
        log_file = TEST_OUTPUT_DIR / "test_file_logging.log"
        
        # Clean up any existing log file
        if log_file.exists():
            log_file.unlink()
            
        logger = UnifiedLogger("test_tool", LogMode.MINIMAL, log_file)
        
        logger.info("Test file message")
        logger.verbose("Verbose file message")  # Should only go to file
        
        # Check file exists and has content
        assert log_file.exists()
        
        content = log_file.read_text()
        assert "Test file message" in content
        assert "Verbose file message" in content
        assert "test_tool" in content  # Logger name should be in file
        assert "INFO" in content  # Log level should be in file
    
    def test_dynamic_mode_switching(self):
        """Test that logging mode can be changed dynamically."""
        with patch('sys.stdout', new_callable=StringIO) as mock_stdout:
            logger = UnifiedLogger("test_tool", LogMode.SILENT)
            
            logger.info("This should not show")
            output1 = mock_stdout.getvalue()
            assert "This should not show" not in output1
            
            # Switch to minimal mode
            logger.set_mode(LogMode.MINIMAL)
            logger.info("This should show now")
            
            output2 = mock_stdout.getvalue()
            assert "This should show now" in output2
    
    def test_add_file_logging_dynamically(self):
        """Test adding file logging to existing logger."""
        logger = UnifiedLogger("test_tool", LogMode.MINIMAL)
        
        log_file = TEST_OUTPUT_DIR / "test_dynamic_file_logging.log"
        
        # Clean up any existing log file
        if log_file.exists():
            log_file.unlink()
            
        logger.add_file_logging(log_file)
        
        logger.info("Dynamic file logging test")
        
        assert log_file.exists()
        content = log_file.read_text()
        assert "Dynamic file logging test" in content
    
    def test_thread_safety(self):
        """Test that logger is thread-safe."""
        results = []
        
        def worker(thread_id):
            logger = UnifiedLogger.get_logger("thread_test", LogMode.MINIMAL)
            results.append((thread_id, logger))
        
        threads = []
        for i in range(5):
            thread = threading.Thread(target=worker, args=(i,))
            threads.append(thread)
            thread.start()
        
        for thread in threads:
            thread.join()
        
        # All threads should get the same logger instance
        first_logger = results[0][1]
        for thread_id, logger in results:
            assert logger is first_logger


class TestCreateLoggerConvenience:
    """Test the create_logger convenience function."""
    
    def setup_method(self):
        """Setup for each test method."""
        UnifiedLogger._instances.clear()
    
    def test_create_logger_with_string_mode(self):
        """Test create_logger with string mode parameter."""
        logger = create_logger("test_tool", "verbose")
        assert logger.mode == LogMode.VERBOSE
        
        logger = create_logger("test_tool2", "minimal")
        assert logger.mode == LogMode.MINIMAL
        
        logger = create_logger("test_tool3", "silent")
        assert logger.mode == LogMode.SILENT
    
    def test_create_logger_with_enum_mode(self):
        """Test create_logger with LogMode enum."""
        logger = create_logger("test_tool", LogMode.VERBOSE)
        assert logger.mode == LogMode.VERBOSE
    
    def test_create_logger_with_string_log_file(self):
        """Test create_logger with string log file path."""
        log_path = str(TEST_OUTPUT_DIR / "test_create_logger_string.log")
        
        # Clean up any existing log file
        if Path(log_path).exists():
            Path(log_path).unlink()
            
        logger = create_logger("test_tool", "minimal", log_path)
        
        assert logger.log_file == Path(log_path)
        
        logger.info("Test message")
        assert Path(log_path).exists()
    
    def test_create_logger_with_path_log_file(self):
        """Test create_logger with Path object."""
        log_path = TEST_OUTPUT_DIR / "test_create_logger_path.log"
        
        # Clean up any existing log file
        if log_path.exists():
            log_path.unlink()
            
        logger = create_logger("test_tool", "minimal", log_path)
        
        assert logger.log_file == log_path
        
        logger.info("Test message")
        assert log_path.exists()


class TestIntegrationScenarios:
    """Integration tests for real-world scenarios."""
    
    def setup_method(self):
        """Setup for each test method."""
        UnifiedLogger._instances.clear()
    
    def test_multiple_tools_same_log_file(self):
        """Test multiple tools logging to same file."""
        log_file = TEST_OUTPUT_DIR / "test_multiple_tools_shared.log"
        
        # Clean up any existing log file
        if log_file.exists():
            log_file.unlink()
            
        logger1 = create_logger("tool1", "minimal", log_file)
        logger2 = create_logger("tool2", "minimal", log_file)
        
        logger1.info("Message from tool1")
        logger2.info("Message from tool2")
        
        content = log_file.read_text()
        assert "tool1" in content
        assert "tool2" in content
        assert "Message from tool1" in content
        assert "Message from tool2" in content
    
    @patch('sys.stdout', new_callable=StringIO)
    def test_real_world_usage_pattern(self, mock_stdout):
        """Test realistic usage pattern similar to mobile-pages-v2."""
        logger = create_logger("page_generator", "minimal")
        
        # Simulate page generation process
        logger.operation("Creating parent page: TestSection")
        logger.verbose("Starting from: core templates")
        logger.verbose("Found 16 total dependencies")
        logger.info("Analyzing project capabilities")
        logger.success("Parent page creation completed")
        
        output = mock_stdout.getvalue()
        
        # Should see operation start and success
        assert "🚀" in output
        assert "Creating parent page: TestSection" in output
        assert "✅" in output
        assert "Parent page creation completed" in output
        
        # Verbose messages should not appear in minimal mode
        assert "Starting from: core templates" not in output
        assert "Found 16 total dependencies" not in output
        
        # Info should appear
        assert "Analyzing project capabilities" in output
    
    def test_error_handling_scenario(self):
        """Test error logging scenarios."""
        with patch('sys.stdout', new_callable=StringIO) as mock_stdout:
            logger = create_logger("error_test", "minimal")
            
            try:
                raise ValueError("Test error")
            except ValueError as e:
                logger.error(f"Error creating parent page: {e}")
            
            output = mock_stdout.getvalue()
            assert "❌" in output
            assert "Error creating parent page: Test error" in output


# Performance and stress tests
class TestPerformance:
    """Performance and stress tests."""
    
    def test_high_volume_logging(self):
        """Test logger performance with high volume of messages."""
        logger = create_logger("perf_test", "silent")  # Reduce output for speed
        
        start_time = time.time()
        for i in range(1000):
            logger.info(f"Message {i}")
        end_time = time.time()
        
        # Should complete quickly (adjust threshold as needed)
        assert (end_time - start_time) < 5.0
    
    def test_concurrent_logging(self):
        """Test concurrent logging from multiple threads."""
        logger = create_logger("concurrent_test", "silent")
        results = []
        
        def log_worker(thread_id, message_count=100):
            for i in range(message_count):
                logger.info(f"Thread {thread_id} - Message {i}")
            results.append(thread_id)
        
        threads = []
        for i in range(10):
            thread = threading.Thread(target=log_worker, args=(i,))
            threads.append(thread)
            thread.start()
        
        for thread in threads:
            thread.join()
        
        # All threads should complete
        assert len(results) == 10


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])