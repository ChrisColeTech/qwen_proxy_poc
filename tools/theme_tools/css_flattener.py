#!/usr/bin/env python3
"""
CSS Flattener - Converts @layer-wrapped CSS to flat structure for easier analysis
"""
import re
import click

def flatten_css(css_content):
    """Flatten CSS by extracting rules from @layer blocks"""
    foundational_rules = []
    flattened_rules = []
    
    # Remove comments but preserve structure
    processed_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # Extract @tailwind directives
    tailwind_matches = re.findall(r'(@tailwind[^;]*;)', processed_content)
    foundational_rules.extend(tailwind_matches)
    
    # Extract @keyframes
    keyframe_pattern = r'(@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\})'
    keyframe_matches = re.findall(keyframe_pattern, processed_content, re.DOTALL)
    foundational_rules.extend(keyframe_matches)
    
    # Extract and flatten @layer blocks
    layer_start_pattern = r'@layer\s+[^{]*\{'
    pos = 0
    while True:
        match = re.search(layer_start_pattern, processed_content[pos:])
        if not match:
            break
        
        start = pos + match.start()
        brace_start = pos + match.end() - 1
        
        # Count braces to find matching closing brace
        brace_count = 1
        i = brace_start + 1
        while i < len(processed_content) and brace_count > 0:
            if processed_content[i] == '{':
                brace_count += 1
            elif processed_content[i] == '}':
                brace_count -= 1
            i += 1
        
        if brace_count == 0:
            # Extract content inside the @layer block
            layer_content = processed_content[brace_start + 1:i - 1]
            
            # Find individual rules within the layer
            rule_pattern = r'([^{}]+)\s*\{([^{}]*)\}'
            layer_matches = re.finditer(rule_pattern, layer_content, re.DOTALL)
            
            for rule_match in layer_matches:
                selector = rule_match.group(1).strip()
                rule_body = rule_match.group(2).strip()
                
                if not selector or not rule_body:
                    continue
                
                # Categorize rules
                if (selector.startswith(':root') or 
                    selector.startswith('html') or 
                    selector.startswith('body') or 
                    selector.startswith('*') or
                    selector.startswith('#root')):
                    # Foundational rules
                    foundational_rules.append(f"{selector} {{\n{rule_body}\n}}")
                else:
                    # Regular class rules - flatten them
                    flattened_rules.append(f"{selector} {{\n{rule_body}\n}}")
            
            pos = i
        else:
            pos = brace_start + 1
    
    # Handle any standalone rules (not in @layer blocks)
    standalone_content = processed_content
    
    # Remove everything we've already processed
    for tailwind in tailwind_matches:
        standalone_content = standalone_content.replace(tailwind, '')
    
    for keyframe in keyframe_matches:
        standalone_content = standalone_content.replace(keyframe, '')
    
    # Remove @layer blocks
    layer_start_pattern = r'@layer\s+[^{]*\{'
    pos = 0
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
            layer_block = standalone_content[start:i]
            standalone_content = standalone_content.replace(layer_block, '')
            pos = 0  # Restart search
        else:
            pos = brace_start + 1
    
    # Process any remaining standalone rules
    rule_pattern = r'([^{}]+)\s*\{([^{}]*)\}'
    standalone_matches = re.finditer(rule_pattern, standalone_content, re.DOTALL)
    
    for match in standalone_matches:
        selector = match.group(1).strip()
        rule_body = match.group(2).strip()
        
        if not selector or not rule_body:
            continue
            
        if (selector.startswith(':root') or 
            selector.startswith('html') or 
            selector.startswith('body') or 
            selector.startswith('*') or
            selector.startswith('#root')):
            foundational_rules.append(f"{selector} {{\n{rule_body}\n}}")
        else:
            flattened_rules.append(f"{selector} {{\n{rule_body}\n}}")
    
    return foundational_rules, flattened_rules

@click.command()
@click.option('--input', '-i', help='Input CSS file', required=True)
@click.option('--foundational', '-f', help='Output foundational CSS file', default='foundational_flat.css')
@click.option('--flattened', '-o', help='Output flattened CSS file', default='flattened.css')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def main(input, foundational, flattened, verbose):
    """Flatten CSS by removing @layer wrappers and separating foundational vs class rules"""
    
    try:
        with open(input, 'r', encoding='utf-8') as f:
            css_content = f.read()
    except Exception as e:
        click.echo(f"Error reading input file: {e}")
        return
    
    if verbose:
        click.echo(f"Flattening CSS from {input}...")
    
    foundational_rules, flattened_rules = flatten_css(css_content)
    
    # Write foundational CSS
    try:
        with open(foundational, 'w', encoding='utf-8') as f:
            f.write("/* Foundational CSS - Infrastructure and structural styles */\n\n")
            for rule in foundational_rules:
                f.write(rule + "\n\n")
        
        if verbose:
            click.echo(f"✅ Foundational CSS: {len(foundational_rules)} rules → {foundational}")
    except Exception as e:
        click.echo(f"Error writing foundational file: {e}")
        return
    
    # Write flattened CSS
    try:
        with open(flattened, 'w', encoding='utf-8') as f:
            f.write("/* Flattened CSS - All class rules without @layer wrappers */\n\n")
            for rule in flattened_rules:
                f.write(rule + "\n\n")
        
        if verbose:
            click.echo(f"✅ Flattened CSS: {len(flattened_rules)} rules → {flattened}")
    except Exception as e:
        click.echo(f"Error writing flattened file: {e}")
        return
    
    click.echo(f"\n📊 Summary:")
    click.echo(f"   🏗️  Foundational rules: {len(foundational_rules)}")
    click.echo(f"   📝 Class rules: {len(flattened_rules)}")
    click.echo(f"   🎯 Total processed: {len(foundational_rules) + len(flattened_rules)}")

if __name__ == '__main__':
    main()