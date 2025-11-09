"""
Centralized logging framework for shared use across multiple tools.

Supports verbose, minimal, and silent modes with optional file logging.
Maintains user-friendly emoji-based output while providing proper log management.
"""

import logging
import sys
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional, TextIO, Union
import threading


class LogLevel(Enum):
    """Custom log levels for the unified logger."""
    VERBOSE = 5      # Detailed operation info
    DEBUG = 10       # Debug information
    INFO = 20        # General information
    WARNING = 30     # Warning messages
    ERROR = 40       # Error messages
    CRITICAL = 50    # Critical errors


class LogMode(Enum):
    """Logging modes that control output verbosity."""
    VERBOSE = "verbose"    # Shows all messages including verbose details
    MINIMAL = "minimal"    # Shows info, warnings, and errors only
    SILENT = "silent"      # Shows warnings and errors only


class EmojiFormatter(logging.Formatter):
    """Custom formatter that adds emoji prefixes to log messages."""
    
    EMOJI_MAP = {
        LogLevel.VERBOSE.value: "🔍",     # Magnifying glass for detailed info
        LogLevel.DEBUG.value: "🐛",       # Bug for debug
        LogLevel.INFO.value: "ℹ️",         # Info symbol
        LogLevel.WARNING.value: "⚠️",     # Warning sign
        LogLevel.ERROR.value: "❌",       # Cross mark for errors
        LogLevel.CRITICAL.value: "💥",    # Explosion for critical
    }
    
    def __init__(self, use_emojis: bool = True, include_timestamp: bool = True):
        self.use_emojis = use_emojis
        self.include_timestamp = include_timestamp
        
        if include_timestamp:
            fmt = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        else:
            fmt = "%(message)s"
            
        super().__init__(fmt, datefmt="%Y-%m-%d %H:%M:%S")
    
    def format(self, record):
        if self.use_emojis and not self.include_timestamp:
            # For console output with emojis
            emoji = self.EMOJI_MAP.get(record.levelno, "")
            if emoji:
                record.msg = f"{emoji} {record.msg}"
        
        return super().format(record)


class UnifiedLogger:
    """
    Centralized logger that can be shared across multiple tools.
    
    Features:
    - Multiple log modes (verbose, minimal, silent)
    - Optional file logging with timestamps
    - Emoji-based console output
    - Thread-safe operation
    - Tool-specific logger instances
    """
    
    _instances = {}
    _lock = threading.Lock()
    
    def __init__(self, tool_name: str, mode: LogMode = LogMode.SILENT, 
                 log_file: Optional[Path] = None):
        """
        Initialize the unified logger for a specific tool.
        
        Args:
            tool_name: Name of the tool using this logger
            mode: Logging mode (verbose, minimal, silent)
            log_file: Optional file path for log output
        """
        self.tool_name = tool_name
        self.mode = mode
        self.log_file = log_file
        
        # Create logger instance
        self.logger = logging.getLogger(f"unified_logger.{tool_name}")
        self.logger.setLevel(LogLevel.VERBOSE.value)  # Set to lowest level
        
        # Clear any existing handlers
        self.logger.handlers.clear()
        
        # Setup console handler
        self._setup_console_handler()
        
        # Setup file handler if requested
        if log_file:
            self._setup_file_handler()
    
    @classmethod
    def get_logger(cls, tool_name: str, mode: LogMode = LogMode.SILENT, 
                   log_file: Optional[Path] = None) -> 'UnifiedLogger':
        """
        Get or create a logger instance for a tool.
        Thread-safe singleton pattern per tool.
        """
        with cls._lock:
            key = f"{tool_name}_{mode.value}_{log_file}"
            if key not in cls._instances:
                cls._instances[key] = cls(tool_name, mode, log_file)
            return cls._instances[key]
    
    def _setup_console_handler(self):
        """Setup console output handler based on mode."""
        console_handler = logging.StreamHandler(sys.stdout)
        
        # Set level based on mode
        if self.mode == LogMode.VERBOSE:
            console_handler.setLevel(LogLevel.VERBOSE.value)
        elif self.mode == LogMode.MINIMAL:
            console_handler.setLevel(LogLevel.INFO.value)
        else:  # SILENT
            console_handler.setLevel(LogLevel.WARNING.value)
        
        # Use emoji formatter for console (no timestamps)
        console_formatter = EmojiFormatter(use_emojis=True, include_timestamp=False)
        console_handler.setFormatter(console_formatter)
        
        self.logger.addHandler(console_handler)
    
    def _setup_file_handler(self):
        """Setup file output handler with timestamps."""
        if not self.log_file:
            return
        
        # Ensure log directory exists
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(self.log_file, mode='a', encoding='utf-8')
        file_handler.setLevel(LogLevel.VERBOSE.value)  # Log everything to file
        
        # Use detailed formatter for file (with timestamps, no emojis)
        file_formatter = EmojiFormatter(use_emojis=False, include_timestamp=True)
        file_handler.setFormatter(file_formatter)
        
        self.logger.addHandler(file_handler)
    
    def verbose(self, message: str, *args, **kwargs):
        """Log verbose-level message (detailed operation info)."""
        self.logger.log(LogLevel.VERBOSE.value, message, *args, **kwargs)
    
    def debug(self, message: str, *args, **kwargs):
        """Log debug-level message."""
        self.logger.debug(message, *args, **kwargs)
    
    def info(self, message: str, *args, **kwargs):
        """Log info-level message."""
        self.logger.info(message, *args, **kwargs)
    
    def success(self, message: str, *args, **kwargs):
        """Log success message (alias for info with success emoji)."""
        # Override emoji for this specific message
        original_handlers = self.logger.handlers.copy()
        
        # Temporarily modify formatter for success emoji
        for handler in self.logger.handlers:
            if isinstance(handler.formatter, EmojiFormatter) and handler.formatter.use_emojis:
                # Create a one-time custom record
                record = logging.LogRecord(
                    self.logger.name, LogLevel.INFO.value, "", 0, f"✅ {message}", 
                    args, None
                )
                handler.emit(record)
                return
        
        # Fallback to regular info
        self.logger.info(message, *args, **kwargs)
    
    def operation(self, message: str, *args, **kwargs):
        """Log operation start message (alias for info with operation emoji)."""
        # Similar to success but with operation emoji
        for handler in self.logger.handlers:
            if isinstance(handler.formatter, EmojiFormatter) and handler.formatter.use_emojis:
                record = logging.LogRecord(
                    self.logger.name, LogLevel.INFO.value, "", 0, f"🚀 {message}", 
                    args, None
                )
                handler.emit(record)
                return
        
        self.logger.info(message, *args, **kwargs)
    
    def warning(self, message: str, *args, **kwargs):
        """Log warning-level message."""
        self.logger.warning(message, *args, **kwargs)
    
    def error(self, message: str, *args, **kwargs):
        """Log error-level message."""
        self.logger.error(message, *args, **kwargs)
    
    def critical(self, message: str, *args, **kwargs):
        """Log critical-level message."""
        self.logger.critical(message, *args, **kwargs)
    
    def set_mode(self, mode: LogMode):
        """Change the logging mode dynamically."""
        self.mode = mode
        
        # Update console handler level
        for handler in self.logger.handlers:
            if isinstance(handler, logging.StreamHandler) and handler.stream == sys.stdout:
                if mode == LogMode.VERBOSE:
                    handler.setLevel(LogLevel.VERBOSE.value)
                elif mode == LogMode.MINIMAL:
                    handler.setLevel(LogLevel.INFO.value)
                else:  # SILENT
                    handler.setLevel(LogLevel.WARNING.value)
    
    def add_file_logging(self, log_file: Path):
        """Add file logging to an existing logger."""
        if self.log_file:
            return  # Already has file logging
        
        self.log_file = log_file
        self._setup_file_handler()


# Convenience function for quick logger creation
def create_logger(tool_name: str, mode: Union[LogMode, str] = LogMode.SILENT, 
                 log_file: Optional[Union[Path, str]] = None) -> UnifiedLogger:
    """
    Create a logger with simplified interface.
    
    Args:
        tool_name: Name of the tool
        mode: Logging mode ('verbose', 'minimal', 'silent' or LogMode enum)
        log_file: Optional log file path
    
    Returns:
        UnifiedLogger instance
    """
    if isinstance(mode, str):
        mode = LogMode(mode)
    
    if isinstance(log_file, str):
        log_file = Path(log_file)
    
    return UnifiedLogger.get_logger(tool_name, mode, log_file)


# Example usage patterns for easy adoption
if __name__ == "__main__":
    # Example 1: Basic usage
    logger = create_logger("example_tool", "verbose")
    
    logger.operation("Starting example operation")
    logger.info("Processing data")
    logger.verbose("Detailed processing info")
    logger.success("Operation completed")
    logger.warning("This is a warning")
    logger.error("This is an error")
    
    # Example 2: With file logging
    log_file = Path("./logs/example.log")
    logger_with_file = create_logger("example_tool_2", "minimal", log_file)
    
    logger_with_file.info("This goes to both console and file")
    logger_with_file.verbose("This only goes to file (not console in minimal mode)")
    
    # Example 3: Dynamic mode switching
    logger.set_mode(LogMode.SILENT)
    logger.info("This won't show in silent mode")
    logger.error("But errors still show")