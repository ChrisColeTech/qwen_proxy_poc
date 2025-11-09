# Theme Tools

A comprehensive collection of CSS analysis and theme management tools for the Qwen Proxy POC frontend project.

## Table of Contents

- [Overview](#overview)
- [Main Tool: css_analyzer.py](#main-tool-css_analyzerpy)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Output Files](#output-files)
  - [Understanding the Results](#understanding-the-results)
- [Supporting Tools](#supporting-tools)
- [Detection Capabilities](#detection-capabilities)
- [Known Limitations](#known-limitations)
- [Examples](#examples)

## Overview

The theme tools suite provides automated CSS analysis to help you:

- Identify unused CSS classes in your codebase
- Track CSS class usage across TypeScript/TSX files
- Split CSS into used/unused categories
- Detect dynamically added classes (classList.add, etc.)
- Analyze theme files and CSS variables
- Generate detailed usage reports

## Main Tool: css_analyzer.py

`css_analyzer.py` is the master CSS analysis tool that coordinates all analysis tasks. It scans your TypeScript/TSX files to find which CSS classes are actually used in your code, then generates comprehensive reports and split CSS files.

### Installation

No special installation required. The tool uses standard Python 3 libraries:

```bash
cd /Users/chris/Projects/qwen_proxy_poc/tools/theme_tools
```

Dependencies (already included in Python 3):
- `os`, `json`, `re`, `pathlib`, `click`

### Usage

#### Basic Analysis

Run a complete CSS analysis on your project:

```bash
python3 css_analyzer.py analyze \
  --tsx-path ../../frontend/src \
  --css-file ../../frontend/src/index.css \
  --output-dir .
```

#### With Verbose Output

Get detailed progress information during analysis:

```bash
python3 css_analyzer.py analyze \
  --tsx-path ../../frontend/src \
  --css-file ../../frontend/src/index.css \
  --output-dir . \
  --verbose
```

#### Generate Report from Existing Analysis

If you've already run an analysis, you can regenerate the report:

```bash
python3 css_analyzer.py report --analysis-file css_analysis.json
```

#### Command-Line Options

**`analyze` command:**
- `-t, --tsx-path TEXT`: Path to scan for TypeScript/TSX files (default: `../src`)
- `-c, --css-file TEXT`: Main CSS file to analyze (default: `../src/index.css`)
- `-o, --output-dir TEXT`: Output directory for generated files (default: `.`)
- `-v, --verbose`: Enable verbose output for detailed progress
- `--help`: Show help message

**`report` command:**
- `-a, --analysis-file TEXT`: Path to existing analysis JSON file (default: `css_analysis.json`)
- `--help`: Show help message

### Output Files

When you run the analyzer, it generates **7 files**:

#### 1. `css_analysis.json`
**Purpose:** Machine-readable analysis data

Contains complete analysis results including:
- Summary statistics (usage percentages, file counts)
- List of all CSS classes found
- List of used custom classes
- List of used CSS classes
- List of unused CSS classes
- Per-file analysis breakdown

**Example structure:**
```json
{
  "summary": {
    "tsx_files_analyzed": 45,
    "tsx_count": 30,
    "ts_count": 15,
    "total_css_classes": 274,
    "custom_classes_used": 55,
    "css_classes_used": 55,
    "css_classes_unused": 219,
    "usage_percentage": 20.1
  },
  "used_custom_classes": ["card-title-with-icon", "dark", "light", ...],
  "unused_css_classes": ["old-button", "deprecated-style", ...]
}
```

#### 2. `analysis_report.md`
**Purpose:** Human-readable analysis report

A markdown report with:
- Summary statistics
- Complete list of used classes (with checkmarks)
- Complete list of unused classes (with warnings)

Perfect for code reviews and documentation.

#### 3. `used_classes.txt`
**Purpose:** Text list of CSS classes that ARE used

Simple line-by-line list of classes found in your TypeScript/TSX code. These are the classes you should keep.

**Example:**
```
# Custom Classes Used in TSX Files

card-title-with-icon
dark
light
sidebar
statusbar
```

#### 4. `unused_classes.txt`
**Purpose:** Text list of CSS classes that are NOT used

Classes defined in CSS but not referenced anywhere in your code. These are candidates for removal.

**Example:**
```
# CSS Classes NOT Used in TSX Files

old-button
deprecated-layout
unused-theme-class
```

#### 5. `css_classes.txt`
**Purpose:** Complete list of all CSS classes defined

Every class selector found in your CSS files.

#### 6. `foundational.css`
**Purpose:** Infrastructure CSS (Tailwind, layers, keyframes, root variables)

Contains:
- `@tailwind` directives
- `@layer` blocks
- `@keyframes` animations
- `:root` variable definitions
- `html` and `body` base styles

This is CSS that doesn't define specific classes but provides the foundation for your styling system.

#### 7. `used.css`
**Purpose:** Only the CSS rules for classes that ARE used

Contains actual CSS rules (selectors + properties) for classes found in your code. This is the CSS your application actually needs.

**Example:**
```css
/* Used CSS Classes - Referenced in TSX files */

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
}

.sidebar {
  width: 200px;
  background: var(--background);
}
```

#### 8. `unused.css`
**Purpose:** Only the CSS rules for classes that are NOT used

Contains CSS rules for unused classes. Useful for archiving before deletion, or for debugging why certain styles aren't working (if they're in this file, they're not being referenced!).

### Understanding the Results

#### Usage Percentage

The usage percentage tells you what portion of your defined CSS classes are actually used:

```
📈 Summary: 20.1% CSS usage rate
   ✅ 55 classes used
   ⚠️  219 classes unused
```

- **Low percentage (< 30%)**: You likely have significant CSS cleanup opportunities
- **Medium percentage (30-70%)**: Reasonable amount of unused CSS
- **High percentage (> 70%)**: Your CSS is well-maintained

#### What Counts as "Used"?

A class is considered "used" if it appears in your TypeScript/TSX code through:

1. **Direct className attributes:**
   ```tsx
   <div className="my-class">
   ```

2. **String literals in JSX:**
   ```tsx
   <div className={'my-class'}>
   <div className={`my-class`}>
   ```

3. **cn() utility calls:**
   ```tsx
   <div className={cn('my-class', condition && 'other-class')}>
   ```

4. **Ternary expressions:**
   ```tsx
   <div className={isActive ? 'active-class' : 'inactive-class'}>
   ```

5. **Dynamic classList manipulation:**
   ```tsx
   element.classList.add('my-class')
   element.classList.remove('my-class')
   element.classList.toggle('my-class')
   ```

6. **Direct className assignment:**
   ```tsx
   element.className = 'my-class'
   ```

7. **Class-related variables:**
   ```tsx
   const themeClass = 'dark'
   const styleClass = 'custom-style'
   ```

**Important:** The tool scans both `.tsx` and `.ts` files, so classes added in hooks or utility files (like `useDarkMode.ts`) are properly detected!

#### What Doesn't Count?

The analyzer filters out Tailwind utility classes automatically, so only your custom CSS classes are analyzed. This prevents false positives from Tailwind's massive utility class library.

## Supporting Tools

### scan_tsx_classes.py
Scans TypeScript/TSX files and extracts CSS classes.

**Usage:**
```bash
python3 scan_tsx_classes.py --path ../../frontend/src --output classes.txt
```

**Options:**
- `--custom-only`: Show only custom classes (exclude Tailwind)
- `--all-classes`: Include Tailwind utility classes
- `--verbose`: Detailed output

### extract_used_css.py
Splits CSS into used and unused files.

**Usage:**
```bash
python3 extract_used_css.py \
  --css-file ../../frontend/src/index.css \
  --tsx-path ../../frontend/src \
  --used-output used.css \
  --unused-output unused.css
```

### scan_css_classes.py
Extracts all class definitions from CSS files.

**Usage:**
```bash
python3 scan_css_classes.py --file ../../frontend/src/index.css
```

### Theme Management Tools

- **theme_organizer.py**: Combines and organizes all themes with consistent naming
- **theme_combiner.py**: Extracts and combines theme CSS from multiple files
- **theme_integrator.py**: Updates CSS files to use the new organized theme system
- **theme_color_generator.py**: Generates new color themes
- **fix_theme_variables.py**: Fixes CSS variable names in theme files
- **css_flattener.py**: Converts @layer-wrapped CSS to flat structure

### Other Analysis Tools

- **analyze_frontend_css.py**: Comprehensive CSS analysis for the entire frontend
- **css_analyzer_layer_aware.py**: Layer-aware CSS analysis (respects @layer semantics)
- **css_analyzer_simple.py**: Simplified CSS analysis using CSS flattener
- **smart_css_detection.py**: Analyzes indirect CSS usage patterns

## Detection Capabilities

### What the Analyzer Can Detect

✅ **Static class names in JSX**
```tsx
<div className="my-class">
```

✅ **Dynamic classList manipulation**
```tsx
root.classList.add('dark')
root.classList.remove('light', 'dark')
root.classList.toggle('active')
```

✅ **Conditional classes**
```tsx
className={cn('base', isActive && 'active')}
className={condition ? 'class-a' : 'class-b'}
```

✅ **Template literals (without interpolation)**
```tsx
className={`my-class other-class`}
```

✅ **Classes in .ts files** (not just .tsx)
```typescript
// In hooks/useDarkMode.ts
element.classList.add('dark')  // ✅ Detected!
```

### What the Analyzer Cannot Detect

❌ **Classes from string variables**
```tsx
const className = getClassFromApi() // Dynamic/runtime value
<div className={className}>
```

❌ **Classes in template literals with variables**
```tsx
className={`my-${variant}-class`} // Can't predict 'variant' value
```

❌ **Classes added at runtime from external sources**
```tsx
element.className = userProvidedClass // Unknown at analysis time
```

❌ **Classes in data attributes or other non-className contexts**
```tsx
<div data-class="my-class"> // Not analyzed
```

## Known Limitations

1. **Variable-based class names**: The analyzer only detects string literals, not computed or variable-based class names. If you build class names dynamically (e.g., `"btn-" + color`), those won't be detected.

2. **External packages**: Classes used by third-party React components won't be detected unless they're explicitly referenced in your code.

3. **CSS imports resolution**: The tool resolves `@import` statements in CSS files, but assumes relative imports are resolvable from the CSS file location.

4. **Tailwind filtering**: The tool tries to filter out Tailwind classes, but may occasionally misclassify custom classes that follow Tailwind naming patterns (e.g., `bg-custom-color`).

5. **Pseudo-classes and modifiers**: While the tool detects base classes, it may not capture every modifier. For example, if you have `.dark:hover` in CSS but only `.dark` in your code, it will still mark `.dark` as used.

6. **CSS-in-JS**: The tool doesn't analyze CSS-in-JS libraries (styled-components, emotion, etc.), only traditional CSS files and className attributes.

## Examples

### Example 1: Finding Unused Styles

You suspect there's dead CSS in your project:

```bash
cd /Users/chris/Projects/qwen_proxy_poc/tools/theme_tools
python3 css_analyzer.py analyze \
  --tsx-path ../../frontend/src \
  --css-file ../../frontend/src/index.css \
  --output-dir ./analysis-output \
  --verbose
```

**Output:**
```
🔍 Running complete CSS analysis...
📁 Scanning TSX and TS files for custom classes...
🎨 Analyzing CSS file and resolving imports...
   Resolved CSS imports, total content length: 29391 characters

✅ Analysis complete! Generated 7 files:
   📊 ./analysis-output/css_analysis.json
   📝 ./analysis-output/analysis_report.md
   📋 ./analysis-output/used_classes.txt, ./analysis-output/unused_classes.txt, ./analysis-output/css_classes.txt
   🎨 ./analysis-output/foundational.css, ./analysis-output/used.css, ./analysis-output/unused.css

📈 Summary: 20.1% CSS usage rate
   ✅ 55 classes used
   ⚠️  219 classes unused
```

Check `unused_classes.txt` for classes you can safely remove!

### Example 2: Verifying a Class is Used

You want to verify that the `.dark` theme class is being detected:

```bash
# Run the analysis
python3 css_analyzer.py analyze \
  --tsx-path ../../frontend/src \
  --css-file ../../frontend/src/index.css \
  --output-dir .

# Check if 'dark' is in the used list
grep "^dark$" used_classes.txt
# Output: dark

# Verify it's NOT in the unused list
grep "^dark$" unused_classes.txt
# Output: (empty - not found)
```

Result: `.dark` is correctly detected as used! ✅

### Example 3: Quick Usage Check

Want to see just the statistics?

```bash
python3 css_analyzer.py analyze \
  --tsx-path ../../frontend/src \
  --css-file ../../frontend/src/index.css \
  --output-dir . \
  | grep "Summary"
```

**Output:**
```
📈 Summary: 20.1% CSS usage rate
```

### Example 4: Scanning Only TSX Files (No TS)

If you want to scan just `.tsx` files and skip `.ts` files, you'll need to modify the `css_analyzer.py` code. However, the recommended approach is to scan both since hooks and utilities in `.ts` files can add classes dynamically (as we discovered with `useDarkMode.ts`!).

### Example 5: Analyzing a Specific CSS File

Want to analyze just your theme CSS?

```bash
python3 extract_used_css.py \
  --css-file ../../frontend/src/styles/base/theme.css \
  --tsx-path ../../frontend/src \
  --used-output theme-used.css \
  --unused-output theme-unused.css \
  --verbose
```

## Tips and Best Practices

1. **Run regularly**: Run the analyzer after major refactoring sessions to identify cleanup opportunities.

2. **Review unused classes carefully**: Just because a class is marked "unused" doesn't mean it should be deleted. Consider:
   - Is it used by external tools or docs?
   - Is it a utility class for future use?
   - Is it loaded dynamically in ways the tool can't detect?

3. **Use verbose mode for debugging**: If a class isn't being detected, run with `--verbose` to see which files are being scanned.

4. **Check both .ts and .tsx files**: The tool now scans both file types, which is crucial for detecting classes added in hooks or utility files.

5. **Commit before major deletions**: Before removing unused CSS based on the analysis, commit your changes so you can easily revert if needed.

6. **Compare with git history**: Cross-reference unused classes with your git history to see when they were last modified and by whom.

## Troubleshooting

### Class Not Detected as Used

If a class you're using is marked as unused:

1. **Check the file extension**: Is it in a `.ts` or `.tsx` file? Both are scanned.
2. **Check the pattern**: Is it a string literal or computed at runtime?
3. **Run with verbose**: Use `--verbose` to see which files are scanned
4. **Check for variable usage**: Classes in variables like `const cls = theme` won't be detected

### Too Many False Positives

If custom classes are being marked as Tailwind utilities:

1. Check the `is_tailwind_class()` function in `scan_tsx_classes.py`
2. Custom classes should follow kebab-case pattern: `my-custom-class`
3. Avoid Tailwind-like patterns: `bg-*`, `text-*`, `flex-*`

### Analysis Taking Too Long

For very large projects:

1. Limit the scope: Analyze specific subdirectories
2. Check for large files: The tool may be processing large CSS files
3. Run without verbose mode: `--verbose` slows down analysis

---

## Contributing

Found a bug or have a feature request? The tool is part of the Qwen Proxy POC project. Improvements are welcome!

## License

Part of the Qwen Proxy POC project.
