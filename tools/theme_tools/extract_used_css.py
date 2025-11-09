#!/usr/bin/env python3
"""
Tool to extract used CSS classes and split CSS into used/unused files
"""
import os
import re
import click
from pathlib import Path

# Import the proper Tailwind filtering function
from scan_tsx_classes import is_tailwind_class

def extract_custom_classes_from_tsx(file_content):
    """Extract only custom CSS classes from TSX file content (excluding Tailwind)"""
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

    # Filter out invalid class names and Tailwind utilities - keep only custom classes
    custom_classes = set()
    for class_name in all_classes:
        # Must match kebab-case pattern or single-word lowercase
        if not class_name:
            continue

        # Skip if it's clearly not a CSS class
        # Valid custom CSS classes should be kebab-case
        if not re.match(r'^[a-z][a-z0-9]*(-[a-z0-9]+)+$', class_name, re.IGNORECASE):
            # Also allow single-word classes that start with lowercase
            if not re.match(r'^[a-z][a-z0-9_]*$', class_name):
                continue

        # Skip Tailwind utility classes
        if is_tailwind_class(class_name):
            continue

        custom_classes.add(class_name)

    return custom_classes

def get_used_classes_from_tsx_files(path):
    """Get all custom classes used in TSX files"""
    used_classes = set()
    tsx_files = list(Path(path).rglob('*.tsx'))
    
    for tsx_file in tsx_files:
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
                classes = extract_custom_classes_from_tsx(content)
                used_classes.update(classes)
        except Exception:
            continue
    
    return used_classes

def extract_css_classes_from_css(css_content):
    """Extract all CSS class definitions from CSS content"""
    classes = set()
    
    # Remove comments
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # Pattern for CSS class selectors
    pattern = r'\.([a-zA-Z][a-zA-Z0-9_-]*)'
    matches = re.findall(pattern, css_content)
    
    for match in matches:
        # Clean up pseudo-classes and pseudo-elements
        clean_class = re.sub(r':.*$', '', match)
        if clean_class:
            classes.add(clean_class)
    
    return classes

def extract_foundational_css_rules(css_content):
    """Extract foundational CSS rules (tailwind, layers, keyframes, root, html, body)"""
    foundational_rules = []
    
    # Remove comments but preserve structure
    processed_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # Handle @tailwind directives
    tailwind_matches = re.findall(r'(@tailwind[^;]*;)', processed_content)
    for directive in tailwind_matches:
        foundational_rules.append(directive)
    
    # Handle @layer blocks - include entire blocks as foundational
    # Need to handle nested braces properly
    layer_start_pattern = r'@layer\s+[^{]*\{'
    pos = 0
    while True:
        match = re.search(layer_start_pattern, processed_content[pos:])
        if not match:
            break
        
        start = pos + match.start()
        brace_start = pos + match.end() - 1  # Position of opening brace
        
        # Count braces to find the matching closing brace
        brace_count = 1
        i = brace_start + 1
        while i < len(processed_content) and brace_count > 0:
            if processed_content[i] == '{':
                brace_count += 1
            elif processed_content[i] == '}':
                brace_count -= 1
            i += 1
        
        if brace_count == 0:
            # Found complete @layer block
            layer_block = processed_content[start:i]
            foundational_rules.append(layer_block)
            pos = i
        else:
            # Malformed CSS, skip
            pos = brace_start + 1
    
    # Handle @keyframes
    keyframe_pattern = r'(@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\})'
    keyframe_matches = re.findall(keyframe_pattern, processed_content, re.DOTALL)
    for keyframe in keyframe_matches:
        foundational_rules.append(keyframe)
    
    return foundational_rules

def extract_css_rules_for_classes(css_content, target_classes):
    """Extract CSS rules for specific classes only (no foundational CSS)"""
    rules = []
    seen_selectors = set()  # Track selectors to prevent duplicates

    # Remove comments but preserve structure
    processed_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # Parse @layer blocks to extract individual class rules (without @layer wrapper)
    layer_start_pattern = r'@layer\s+[^{]*\{'
    pos = 0
    while True:
        match = re.search(layer_start_pattern, processed_content[pos:])
        if not match:
            break
        
        start = pos + match.start()
        brace_start = pos + match.end() - 1  # Position of opening brace
        
        # Count braces to find the matching closing brace
        brace_count = 1
        i = brace_start + 1
        while i < len(processed_content) and brace_count > 0:
            if processed_content[i] == '{':
                brace_count += 1
            elif processed_content[i] == '}':
                brace_count -= 1
            i += 1
        
        if brace_count == 0:
            # Found complete @layer block, extract content inside
            layer_content = processed_content[brace_start + 1:i - 1]  # Content between braces
            
            # Find class rules within this layer
            rule_pattern = r'([^{}]+)\s*\{([^{}]*)\}'
            layer_matches = re.finditer(rule_pattern, layer_content, re.DOTALL)
            
            for rule_match in layer_matches:
                selector = rule_match.group(1).strip()
                rule_body = rule_match.group(2).strip()
                
                # Skip foundational selectors - only want regular class rules
                if (selector.startswith(':root') or 
                    selector.startswith('html') or 
                    selector.startswith('body') or 
                    selector.startswith('*') or
                    selector.startswith('#root')):
                    continue
                
                # Check if this rule contains any target classes
                contains_target_class = False
                for target_class in target_classes:
                    if re.search(rf'\.{re.escape(target_class)}(?![a-zA-Z0-9_-])', selector):
                        contains_target_class = True
                        break

                if contains_target_class and selector not in seen_selectors:
                    seen_selectors.add(selector)
                    rules.append(f"{selector} {{\n{rule_body}\n}}")
            
            pos = i
        else:
            # Malformed CSS, skip
            pos = brace_start + 1
    
    # Handle any remaining standalone rules (not in @layer blocks)
    # This is unlikely given the CSS structure but good to be safe
    standalone_content = processed_content
    
    # Remove @layer blocks, @keyframes, and @tailwind
    layer_pattern = r'(@layer\s+[^{]*\{.*?\})'  
    # Use the same nested brace logic for consistency
    layer_start_pattern = r'@layer\s+[^{]*\{'
    pos = 0
    layer_blocks = []
    while True:
        match = re.search(layer_start_pattern, standalone_content[pos:])
        if not match:
            break
        
        start = pos + match.start()
        brace_start = pos + match.end() - 1
        
        brace_count = 1
        i = brace_start + 1
        while i < len(standalone_content) and brace_count > 0:
            if standalone_content[i] == '{':
                brace_count += 1
            elif standalone_content[i] == '}':
                brace_count -= 1
            i += 1
        
        if brace_count == 0:
            layer_blocks.append(standalone_content[start:i])
            pos = i
        else:
            pos = brace_start + 1
    
    for layer_block in layer_blocks:
        standalone_content = standalone_content.replace(layer_block, '')
    
    # Remove @keyframes and @tailwind
    keyframe_pattern = r'(@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\})'
    keyframe_matches = re.findall(keyframe_pattern, standalone_content, re.DOTALL)
    for keyframe in keyframe_matches:
        standalone_content = standalone_content.replace(keyframe, '')
        
    tailwind_matches = re.findall(r'(@tailwind[^;]*;)', standalone_content)
    for directive in tailwind_matches:
        standalone_content = standalone_content.replace(directive, '')
    
    # Find any remaining standalone class rules
    rule_pattern = r'([^{}]+)\s*\{([^{}]*)\}'
    standalone_matches = re.finditer(rule_pattern, standalone_content, re.DOTALL)
    
    for match in standalone_matches:
        selector = match.group(1).strip()
        rule_body = match.group(2).strip()
        
        if not selector:  # Skip empty selectors
            continue
            
        # Check if this rule contains any target classes
        contains_target_class = False
        for target_class in target_classes:
            if re.search(rf'\.{re.escape(target_class)}(?![a-zA-Z0-9_-])', selector):
                contains_target_class = True
                break

        if contains_target_class and selector not in seen_selectors:
            seen_selectors.add(selector)
            rules.append(f"{selector} {{\n{rule_body}\n}}")
    
    return rules

def extract_foundational_css(css_content):
    """Extract foundational CSS (root, themes, layers, keyframes) separate from class rules"""
    foundational_rules = []
    
    # Remove comments
    processed_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # Patterns for foundational CSS
    patterns = [
        r'(@tailwind[^;]*;)',  # Tailwind directives
        r'(@layer\s+[^{]*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})',  # @layer blocks
        r'(@keyframes?\s+[^{]*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})',  # @keyframes
        r'(:root\s*\{[^{}]*\})',  # :root selector
        r'(\.dark\s*\{[^{}]*\})',  # .dark selector
        r'(\.theme-[a-zA-Z0-9_-]+\s*\{[^{}]*\})',  # .theme-* selectors
        r'(html[^{]*\{[^{}]*\})',  # html selector
        r'(body[^{]*\{[^{}]*\})',  # body selector
        r'(\*[^{]*\{[^{}]*\})',  # universal selector
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, processed_content, re.DOTALL)
        for match in matches:
            foundational_rules.append(match.strip())
    
    return foundational_rules

@click.command()
@click.option('--css-file', '-c', help='CSS file to analyze', required=True)
@click.option('--tsx-path', '-t', help='Path to scan for TSX files', required=True)
@click.option('--used-output', '-u', help='Output file for used CSS classes', default='used.css')
@click.option('--unused-output', '-n', help='Output file for unused CSS classes', default='unused.css')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def main(css_file, tsx_path, used_output, unused_output, verbose):
    """Split CSS into used and unused class files"""
    
    if not os.path.exists(css_file):
        click.echo(f"Error: CSS file {css_file} not found")
        return
    
    if not os.path.exists(tsx_path):
        click.echo(f"Error: TSX path {tsx_path} not found")
        return
    
    # Get used classes from TSX files
    if verbose:
        click.echo("Scanning TSX files for used custom classes...")
    used_classes = get_used_classes_from_tsx_files(tsx_path)
    
    # Read CSS file
    try:
        with open(css_file, 'r', encoding='utf-8') as f:
            css_content = f.read()
    except Exception as e:
        click.echo(f"Error reading CSS file: {e}")
        return
    
    # Get all CSS classes defined in the file
    if verbose:
        click.echo("Extracting all CSS class definitions...")
    all_css_classes = extract_css_classes_from_css(css_content)
    
    # Determine used vs unused classes
    unused_classes = all_css_classes - used_classes
    used_css_classes = all_css_classes & used_classes
    
    if verbose:
        click.echo(f"Found {len(all_css_classes)} total CSS classes")
        click.echo(f"Found {len(used_classes)} custom classes used in TSX files")
        click.echo(f"Used CSS classes: {len(used_css_classes)}")
        click.echo(f"Unused CSS classes: {len(unused_classes)}")
    
    # Extract CSS rules for used and unused classes
    if verbose:
        click.echo("Extracting CSS rules...")
    
    used_rules = extract_css_rules_for_classes(css_content, used_css_classes)
    unused_rules = extract_css_rules_for_classes(css_content, unused_classes)
    
    # Write used CSS file
    try:
        with open(used_output, 'w', encoding='utf-8') as f:
            f.write("/* Used CSS Classes - Classes that are referenced in TSX files */\n\n")
            for rule in used_rules:
                f.write(rule + "\n\n")
        
        click.echo(f"✅ Used classes: {len(used_rules)} CSS rules → {used_output}")
        
    except Exception as e:
        click.echo(f"Error writing used CSS file: {e}")
        return
    
    # Write unused CSS file
    try:
        with open(unused_output, 'w', encoding='utf-8') as f:
            f.write("/* Unused CSS Classes - Classes that are NOT referenced in TSX files */\n\n")
            for rule in unused_rules:
                f.write(rule + "\n\n")
        
        click.echo(f"⚠️  Unused classes: {len(unused_rules)} CSS rules → {unused_output}")
        
    except Exception as e:
        click.echo(f"Error writing unused CSS file: {e}")
        return
    
    if verbose:
        click.echo("\nUsed classes:")
        for cls in sorted(used_css_classes):
            click.echo(f"  ✅ {cls}")
        
        click.echo(f"\nUnused classes:")
        for cls in sorted(unused_classes):
            click.echo(f"  ⚠️  {cls}")
    
    # Summary
    usage_percent = (len(used_css_classes) / len(all_css_classes) * 100) if all_css_classes else 0
    click.echo(f"\nSummary: {usage_percent:.1f}% of CSS classes are being used ({len(used_css_classes)}/{len(all_css_classes)})")

if __name__ == '__main__':
    main()