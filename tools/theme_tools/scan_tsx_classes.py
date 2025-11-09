#!/usr/bin/env python3
"""
Tool to scan TSX files and extract CSS classes in use
"""
import os
import re
import click
from pathlib import Path

# Common Tailwind prefixes and patterns to exclude
TAILWIND_PREFIXES = {
    # Layout
    'container', 'box-', 'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'table', 'inline-table',
    'table-caption', 'table-cell', 'table-column', 'table-column-group', 'table-footer-group',
    'table-header-group', 'table-row-group', 'table-row', 'flow-root', 'grid', 'inline-grid',
    'contents', 'list-item', 'hidden', 'peer', 'group',
    
    # Flexbox & Grid
    'flex-', 'grid-', 'gap-', 'justify-', 'content-', 'items-', 'self-', 'place-',
    
    # Spacing
    'p-', 'px-', 'py-', 'pt-', 'pr-', 'pb-', 'pl-', 'm-', 'mx-', 'my-', 'mt-', 'mr-', 'mb-', 'ml-',
    'space-', '-m', '-p',
    
    # Sizing
    'w-', 'min-w-', 'max-w-', 'h-', 'min-h-', 'max-h-',
    
    # Typography
    'font-', 'text-', 'leading-', 'tracking-', 'break-', 'whitespace-',
    
    # Backgrounds
    'bg-', 'from-', 'via-', 'to-',
    
    # Borders
    'border', 'border-', 'rounded', 'rounded-',
    
    # Effects
    'shadow', 'shadow-', 'opacity-', 'mix-', 'blur-', 'brightness-', 'contrast-', 'drop-shadow',
    'grayscale', 'hue-rotate-', 'invert', 'saturate-', 'sepia', 'backdrop-',
    
    # Filters
    'filter', 'backdrop-filter',
    
    # Tables
    'border-collapse', 'border-separate', 'table-auto', 'table-fixed',
    
    # Transitions & Animation
    'transition', 'transition-', 'duration-', 'ease-', 'delay-', 'animate-',
    
    # Transforms
    'transform', 'transform-', 'origin-', 'scale-', 'rotate-', 'translate-', 'skew-',
    
    # Interactivity
    'appearance-', 'cursor-', 'outline-', 'pointer-events-', 'resize', 'select-', 'user-select-',
    'ring-', 'ring-offset-',
    
    # SVG
    'fill-', 'stroke-', 'stroke-',
    
    # Accessibility
    'sr-only', 'not-sr-only',
    
    # Position
    'static', 'fixed', 'absolute', 'relative', 'sticky',
    'inset-', 'top-', 'right-', 'bottom-', 'left-', 'z-',
    
    # Overflow
    'overflow-', 'overscroll-',
    
    # Colors (common patterns)
    'slate-', 'gray-', 'zinc-', 'neutral-', 'stone-', 'red-', 'orange-', 'amber-', 'yellow-',
    'lime-', 'green-', 'emerald-', 'teal-', 'cyan-', 'sky-', 'blue-', 'indigo-', 'violet-',
    'purple-', 'fuchsia-', 'pink-', 'rose-',
}

def is_tailwind_class(class_name):
    """Check if a class name is likely a Tailwind utility class"""
    if not class_name or not class_name.replace('-', '').replace('/', '').replace('[', '').replace(']', '').replace(':', '').replace('.', '').isalnum():
        return True
    
    # Check for responsive prefixes
    responsive_prefixes = ['sm:', 'md:', 'lg:', 'xl:', '2xl:']
    for prefix in responsive_prefixes:
        if class_name.startswith(prefix):
            class_name = class_name[len(prefix):]
            break
    
    # Check for state prefixes
    state_prefixes = ['hover:', 'focus:', 'active:', 'visited:', 'disabled:', 'group-hover:', 'group-focus:']
    for prefix in state_prefixes:
        if class_name.startswith(prefix):
            class_name = class_name[len(prefix):]
            break
    
    # Check against Tailwind prefixes
    for prefix in TAILWIND_PREFIXES:
        if class_name == prefix or class_name.startswith(prefix):
            return True
    
    # Check for arbitrary value syntax [value]
    if '[' in class_name and ']' in class_name:
        return True
    
    # Check for fraction values (w-1/2, etc.)
    if re.match(r'^[a-z-]+\d+/\d+$', class_name):
        return True
    
    # Check for numeric suffixes (common Tailwind pattern)
    if re.match(r'^[a-z-]+\d+(\.\d+)?$', class_name):
        return True
    
    return False

def extract_classes_from_tsx(file_content, include_tailwind=True):
    """Extract CSS classes from TSX file content"""
    all_classes = set()

    # Remove comments to avoid false positives
    # Remove single-line comments
    content_no_comments = re.sub(r'//.*?$', '', file_content, flags=re.MULTILINE)
    # Remove multi-line comments
    content_no_comments = re.sub(r'/\*.*?\*/', '', content_no_comments, flags=re.DOTALL)

    # Pattern 1: className="literal string"
    pattern1 = r'className="([^"]*)"'
    matches = re.findall(pattern1, content_no_comments)
    for match in matches:
        class_list = [cls.strip() for cls in match.split() if cls.strip()]
        all_classes.update(class_list)

    # Pattern 2: className={'literal string'}
    pattern2 = r'className=\{\s*["\']([^"\']*)["\']?\s*\}'
    matches = re.findall(pattern2, content_no_comments)
    for match in matches:
        class_list = [cls.strip() for cls in match.split() if cls.strip()]
        all_classes.update(class_list)

    # Pattern 3: className={`template literal`} (without variables)
    pattern3 = r'className=\{`([^`$]*)`\}'
    matches = re.findall(pattern3, content_no_comments)
    for match in matches:
        class_list = [cls.strip() for cls in match.split() if cls.strip()]
        all_classes.update(class_list)

    # Pattern 4: className={cn(...)} - extract strings from cn() calls
    # This needs to handle nested function calls properly
    pattern4 = r'className=\{cn\('
    pos = 0
    while True:
        match = re.search(pattern4, content_no_comments[pos:])
        if not match:
            break

        start = pos + match.start()
        paren_start = pos + match.end() - 1  # Position of opening paren

        # Count parens to find the matching closing paren
        paren_count = 1
        i = paren_start + 1
        while i < len(content_no_comments) and paren_count > 0:
            if content_no_comments[i] == '(':
                paren_count += 1
            elif content_no_comments[i] == ')':
                paren_count -= 1
            i += 1

        if paren_count == 0:
            # Found complete cn(...) call
            cn_content = content_no_comments[paren_start + 1:i - 1]

            # Only extract strings that are:
            # 1. After && operator (conditional classes)
            # 2. Not preceded by comparison operators (===, ==, !=, !==)
            # 3. Not in function parameter assignments (=)

            # Remove comparison values: anything before comparison operators
            # Replace "var === 'value'" patterns with empty string
            clean_cn = re.sub(r'[a-zA-Z_$][a-zA-Z0-9_$]*\s*[!=]==?\s*["\'][^"\']*["\']', '', cn_content)

            # Now extract strings that remain
            quoted_strings = re.findall(r'["\']([^"\']*)["\']', clean_cn)
            for quoted in quoted_strings:
                # Only add if it looks like CSS classes (contains spaces or hyphens)
                # Single lowercase words without hyphens are suspicious (like "popper")
                if ' ' in quoted or '-' in quoted or '_' in quoted:
                    class_list = [cls.strip() for cls in quoted.split() if cls.strip()]
                    all_classes.update(class_list)
                elif re.match(r'^[a-z][a-z0-9]*(-[a-z0-9]+)+$', quoted, re.IGNORECASE):
                    # Single kebab-case word is likely a valid class
                    all_classes.add(quoted)
            pos = i
        else:
            pos = paren_start + 1

    # Pattern 5: className={condition ? "class1" : "class2"} - ternary expressions
    # Only match ternary operator patterns, not all strings in className={...}
    pattern5 = r'className=\{[^}]*\?[^}]*:[^}]*\}'
    ternary_matches = re.findall(pattern5, content_no_comments)
    for ternary in ternary_matches:
        # Only extract strings that appear after ? or : (not from function calls)
        # Match strings that are direct values in the ternary
        ternary_strings = re.findall(r'[?:]\s*["\']([^"\']*)["\']', ternary)
        for quoted in ternary_strings:
            class_list = [cls.strip() for cls in quoted.split() if cls.strip()]
            all_classes.update(class_list)

    # Pattern 6: classList.add('class') or classList.add("class")
    pattern6 = r'classList\.add\s*\(\s*["\']([^"\']+)["\']\s*\)'
    matches = re.findall(pattern6, content_no_comments)
    for match in matches:
        class_list = [cls.strip() for cls in match.split(',') if cls.strip()]
        all_classes.update(class_list)

    # Pattern 7: classList.toggle('class') or classList.toggle("class")
    pattern7 = r'classList\.toggle\s*\(\s*["\']([^"\']+)["\']\s*\)'
    matches = re.findall(pattern7, content_no_comments)
    for match in matches:
        all_classes.add(match.strip())

    # Pattern 8: classList.remove('class1', 'class2', ...) - multiple classes
    pattern8 = r'classList\.remove\s*\(([^)]+)\)'
    matches = re.findall(pattern8, content_no_comments)
    for match in matches:
        # Extract all quoted strings from the arguments
        quoted_classes = re.findall(r'["\']([^"\']+)["\']', match)
        for cls in quoted_classes:
            all_classes.add(cls.strip())

    # Pattern 9: className = "literal" or element.className = "literal"
    pattern9 = r'\.className\s*=\s*["\']([^"\']+)["\']'
    matches = re.findall(pattern9, content_no_comments)
    for match in matches:
        class_list = [cls.strip() for cls in match.split() if cls.strip()]
        all_classes.update(class_list)

    # Pattern 10: Direct string references to class names in variables that might be used for classList
    # Look for const/let/var declarations with string literals that look like class names
    # Only capture if the variable name suggests it's a class (contains 'class', 'style', 'theme')
    pattern10 = r'(?:const|let|var)\s+\w*(?:class|Class|style|Style|theme|Theme)\w*\s*=\s*["\']([a-z][a-z0-9_-]*)["\']'
    matches = re.findall(pattern10, content_no_comments, re.IGNORECASE)
    for match in matches:
        all_classes.add(match.strip())

    # Filter out invalid class names and apply Tailwind filtering
    valid_classes = set()
    for class_name in all_classes:
        # Must match kebab-case pattern (letters, numbers, hyphens, underscores)
        # Must start with a letter or underscore
        # Must contain at least one character
        if not class_name:
            continue

        # Skip if it's clearly not a CSS class (no hyphens and looks like code)
        # Valid custom CSS classes should be kebab-case
        if not re.match(r'^[a-z][a-z0-9]*(-[a-z0-9]+)+$', class_name, re.IGNORECASE):
            # Also allow single-word classes that start with lowercase
            if not re.match(r'^[a-z][a-z0-9_]*$', class_name):
                continue

        valid_classes.add(class_name)

    # Filter classes based on include_tailwind flag
    if include_tailwind:
        return valid_classes
    else:
        # Filter out Tailwind classes
        custom_classes = set()
        for class_name in valid_classes:
            # Skip if it's a Tailwind class
            if is_tailwind_class(class_name):
                continue

            custom_classes.add(class_name)

        return custom_classes

@click.command()
@click.option('--path', '-p', default='.', help='Path to scan for TSX files')
@click.option('--output', '-o', help='Output file to write results')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
@click.option('--custom-only', is_flag=True, help='Show only custom classes (exclude Tailwind)')
@click.option('--all-classes', is_flag=True, help='Show all classes including Tailwind')
def main(path, output, verbose, custom_only, all_classes):
    """Scan TSX files for CSS classes"""
    
    # Default to custom-only if neither flag is specified
    include_tailwind = all_classes or not custom_only
    if not all_classes and not custom_only:
        include_tailwind = False  # Default to custom only
    
    found_classes = set()
    file_count = 0
    
    # Find all TSX files
    tsx_files = list(Path(path).rglob('*.tsx'))
    
    if verbose:
        filter_desc = "all classes" if include_tailwind else "custom classes only"
        click.echo(f"Found {len(tsx_files)} TSX files, extracting {filter_desc}")
    
    for tsx_file in tsx_files:
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
                classes = extract_classes_from_tsx(content, include_tailwind)
                found_classes.update(classes)
                file_count += 1
                
                if verbose:
                    click.echo(f"  {tsx_file}: {len(classes)} classes")
        except Exception as e:
            if verbose:
                click.echo(f"Error reading {tsx_file}: {e}")
    
    # Sort classes for consistent output
    sorted_classes = sorted(found_classes)
    
    class_type = "custom" if not include_tailwind else "total"
    
    if output:
        with open(output, 'w') as f:
            for cls in sorted_classes:
                f.write(f"{cls}\n")
        click.echo(f"Found {len(sorted_classes)} {class_type} classes in {file_count} files")
        click.echo(f"Results written to {output}")
    else:
        click.echo(f"Found {len(sorted_classes)} {class_type} classes in {file_count} files:")
        for cls in sorted_classes:
            click.echo(f"  {cls}")

if __name__ == '__main__':
    main()