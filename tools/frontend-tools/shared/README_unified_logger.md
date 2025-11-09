# Unified Logger Framework

A centralized logging framework for shared use across multiple tools. Supports verbose, minimal, and silent modes with optional file logging while maintaining user-friendly emoji-based output.

## Features

- **Multiple Log Modes**: Verbose, minimal, and silent modes
- **Emoji-Based Output**: User-friendly console output with emojis
- **File Logging**: Optional timestamped file logging
- **Thread-Safe**: Safe for concurrent use across multiple threads
- **Tool-Specific Instances**: Each tool gets its own logger instance
- **Dynamic Mode Switching**: Change log levels at runtime

## Quick Start

```python
from unified_logger import create_logger

# Basic usage
logger = create_logger("my_tool", "minimal")
logger.operation("Starting operation")
logger.info("Processing data")
logger.success("Operation completed")
logger.error("Something went wrong")
```

## Log Modes

### Verbose Mode
Shows all messages including detailed operation information:
- 🔍 Verbose messages (detailed operation info)
- 🐛 Debug messages
- ℹ️ Info messages  
- ⚠️ Warning messages
- ❌ Error messages

### Minimal Mode (Default)
Shows info, warnings, and errors:
- ℹ️ Info messages
- ⚠️ Warning messages  
- ❌ Error messages

### Silent Mode
Shows only warnings and errors:
- ⚠️ Warning messages
- ❌ Error messages

## Usage Examples

### Basic Logger Creation

```python
from unified_logger import create_logger, LogMode

# With string mode
logger = create_logger("tool_name", "verbose")

# With enum mode  
logger = create_logger("tool_name", LogMode.MINIMAL)

# With file logging
logger = create_logger("tool_name", "minimal", "/path/to/logfile.log")
```

### Available Log Methods

```python
logger.verbose("Detailed operation information")
logger.debug("Debug information for troubleshooting")
logger.info("General informational messages")
logger.success("Operation completed successfully")  # Shows ✅
logger.operation("Starting new operation")         # Shows 🚀
logger.warning("Warning message")                   # Shows ⚠️
logger.error("Error message")                      # Shows ❌
logger.critical("Critical error")                  # Shows 💥
```

### Dynamic Mode Switching

```python
logger = create_logger("my_tool", "silent")
logger.set_mode(LogMode.VERBOSE)  # Switch to verbose mode
```

### Adding File Logging Later

```python
logger = create_logger("my_tool", "minimal")
logger.add_file_logging(Path("./logs/my_tool.log"))
```

## Integration with Existing Code

### Before (Direct Print Statements)
```python
print(f"🚀 Creating parent page: {name}")
print(f"✅ Parent page creation completed")
print(f"❌ Error creating parent page: {e}")
print(f"🔍 DEBUG: Found {count} dependencies")
```

### After (Unified Logger)
```python
logger = create_logger("page_generator", "minimal")
logger.operation(f"Creating parent page: {name}")
logger.success("Parent page creation completed") 
logger.error(f"Error creating parent page: {e}")
logger.debug(f"Found {count} dependencies")
```

## CLI Integration

```python
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--verbose", "-v", action="store_true")
    parser.add_argument("--silent", "-s", action="store_true") 
    parser.add_argument("--log-file", type=str)
    args = parser.parse_args()
    
    # Determine mode from CLI args
    if args.verbose:
        mode = "verbose"
    elif args.silent:
        mode = "silent"
    else:
        mode = "minimal"
    
    # Create logger
    logger = create_logger("my_tool", mode, args.log_file)
```

## File Logging Format

Console output uses emojis and simple formatting:
```
🚀 Creating parent page: TestSection  
ℹ️ Analyzing project structure
✅ Parent page creation completed
```

File output includes timestamps and detailed information:
```
2024-01-15 10:30:15 - unified_logger.page_generator - INFO - Creating parent page: TestSection
2024-01-15 10:30:16 - unified_logger.page_generator - INFO - Analyzing project structure  
2024-01-15 10:30:17 - unified_logger.page_generator - INFO - Parent page creation completed
```

## Thread Safety

The logger is thread-safe and uses a singleton pattern per tool:

```python
# Multiple threads will get the same logger instance
logger1 = create_logger("my_tool", "minimal")  # Thread 1
logger2 = create_logger("my_tool", "minimal")  # Thread 2
assert logger1 is logger2  # Same instance
```

## Testing

Run the comprehensive test suite:

```bash
python -m pytest test_unified_logger.py -v
```

Tests cover:
- Emoji formatting
- All log modes and levels
- File logging functionality
- Thread safety
- Performance under load
- Integration scenarios

## Migration Guide

1. **Identify existing print statements** in your tool
2. **Initialize logger** at the top of your main class/module:
   ```python
   self.logger = create_logger("tool_name", "minimal")
   ```
3. **Replace print statements** using the conversion guide:
   - `print(f"🚀 {msg}")` → `logger.operation(msg)`
   - `print(f"✅ {msg}")` → `logger.success(msg)`
   - `print(f"❌ {msg}")` → `logger.error(msg)`
   - `print(f"🔍 DEBUG: {msg}")` → `logger.debug(msg)`
   - `print(f"  ✅ Created: {file}")` → `logger.verbose(f"Created: {file}")`

4. **Add CLI options** for verbosity control
5. **Test different modes** to ensure appropriate message visibility

## Best Practices

1. **Use appropriate log levels**:
   - `verbose()` for detailed operation steps
   - `info()` for general progress updates  
   - `success()/operation()` for user feedback
   - `error()` for recoverable errors
   - `critical()` for unrecoverable errors

2. **Structure messages clearly**:
   ```python
   # Good
   logger.operation(f"Creating {page_type} page: {name}")
   logger.verbose(f"Generated {len(files)} template files")
   
   # Avoid
   logger.info("doing stuff...")
   ```

3. **Use file logging for production tools** to aid in debugging

4. **Consider your users**: 
   - Default to minimal mode for regular use
   - Provide verbose option for debugging
   - Use silent mode for automated/scripted usage

## Performance

The logger is optimized for performance:
- Handles 1000+ log messages per second
- Thread-safe with minimal locking overhead
- Lazy evaluation of log messages when below threshold level

## Examples

See `logger_integration_example.py` for detailed integration examples and migration patterns.