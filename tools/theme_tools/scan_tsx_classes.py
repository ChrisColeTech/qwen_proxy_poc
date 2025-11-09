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
    'contents', 'list-item', 'hidden',
    
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
    
    # Pattern for className="..." or className={`...`}
    patterns = [
        r'className="([^"]*)"',  # className="class1 class2"
        r'className=\{`([^`]*)`\}',  # className={`class1 class2`}
        r'className=\{\s*"([^"]*)"\s*\}',  # className={"class1 class2"}
        r'className=\{[^}]*"([^"]*)"[^}]*\}',  # className={condition ? "class1" : "class2"}
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, file_content, re.MULTILINE | re.DOTALL)
        for match in matches:
            # Clean up the match - remove template literal syntax
            clean_match = re.sub(r'\$\{[^}]*\}', '', match)  # Remove ${...}
            clean_match = re.sub(r'\s+', ' ', clean_match).strip()  # Normalize whitespace
            
            # Split on whitespace and filter out empty strings
            class_list = [cls.strip() for cls in clean_match.split() if cls.strip()]
            all_classes.update(class_list)
    
    # Filter classes based on include_tailwind flag
    if include_tailwind:
        # Return all valid classes
        return {cls for cls in all_classes if cls and re.match(r'^[a-zA-Z][a-zA-Z0-9_:-]*(?:\[[^\]]*\])?(?:/\d+)?$', cls)}
    else:
        # Filter out Tailwind classes
        custom_classes = set()
        for class_name in all_classes:
            # Skip invalid class names
            if not class_name or not re.match(r'^[a-zA-Z][a-zA-Z0-9_-]*$', class_name):
                continue
            
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