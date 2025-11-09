#!/usr/bin/env python3
"""
Smart CSS detection that analyzes indirect usage
"""
import re
from pathlib import Path

def extract_css_variables_from_rules(css_content):
    """Extract all CSS variables defined in the stylesheet"""
    variables = set()
    
    # Find all --variable-name definitions
    var_pattern = r'--([a-zA-Z0-9_-]+)\s*:'
    matches = re.findall(var_pattern, css_content)
    variables.update(matches)
    
    return variables

def extract_tailwind_classes_using_variables(tsx_content):
    """Extract Tailwind classes that likely use CSS variables"""
    # Common Tailwind classes that use CSS variables
    variable_dependent_classes = [
        'bg-background', 'bg-foreground', 'bg-primary', 'bg-secondary',
        'bg-muted', 'bg-accent', 'bg-card', 'bg-border',
        'text-background', 'text-foreground', 'text-primary', 'text-secondary',
        'text-muted', 'text-accent', 'text-card', 'text-border',
        'border-background', 'border-foreground', 'border-primary',
        'border-secondary', 'border-muted', 'border-accent', 'border-card',
        'border-border'
    ]
    
    used_variable_classes = set()
    
    # Extract all classes from TSX
    class_pattern = r'className=(?:"([^"]*)"|{`([^`]*)`})'
    matches = re.findall(class_pattern, tsx_content)
    
    all_classes = set()
    for match in matches:
        for group in match:
            if group:
                classes = re.split(r'\s+', group.strip())
                all_classes.update(classes)
    
    # Check which variable-dependent classes are used
    for cls in all_classes:
        if cls in variable_dependent_classes:
            used_variable_classes.add(cls)
    
    return used_variable_classes

def detect_theme_usage(tsx_files_path):
    """Detect if theme system is actually being used"""
    theme_indicators = {
        'theme_switching': False,
        'theme_state': False,
        'theme_classes': set(),
        'dynamic_themes': False
    }
    
    tsx_files = list(Path(tsx_files_path).rglob('*.tsx'))
    
    for tsx_file in tsx_files:
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Check for theme switching patterns
                theme_switch_patterns = [
                    r'setTheme\([\'"]([^\'"]*)[\'"]?\)',
                    r'useTheme\(\)',
                    r'ThemeProvider',
                    r'theme:\s*[\'"]([^\'"]*)[\'"]',
                ]
                
                for pattern in theme_switch_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        theme_indicators['theme_switching'] = True
                        break
                
                # Check for theme state management
                state_patterns = [
                    r'useState.*[Tt]heme',
                    r'useContext.*[Tt]heme',
                    r'createContext.*[Tt]heme',
                ]
                
                for pattern in state_patterns:
                    if re.search(pattern, content):
                        theme_indicators['theme_state'] = True
                        break
                
                # Check for direct theme class usage
                theme_class_pattern = r'theme-([a-zA-Z0-9_-]+)'
                theme_matches = re.findall(theme_class_pattern, content)
                theme_indicators['theme_classes'].update(theme_matches)
                
                # Check for dynamic theme application
                dynamic_patterns = [
                    r'classList\.add.*theme',
                    r'className.*\$\{.*theme',
                    r'document\.body\.className.*theme',
                ]
                
                for pattern in dynamic_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        theme_indicators['dynamic_themes'] = True
                        break
                        
        except Exception:
            continue
    
    return theme_indicators

def analyze_foundational_usage(css_file, tsx_path):
    """Analyze which foundational CSS is actually needed"""
    
    with open(css_file, 'r') as f:
        css_content = f.read()
    
    # Get all CSS variables defined
    css_variables = extract_css_variables_from_rules(css_content)
    
    # Analyze all TSX files
    tsx_files = list(Path(tsx_path).rglob('*.tsx'))
    all_tsx_content = ""
    
    for tsx_file in tsx_files:
        try:
            with open(tsx_file, 'r') as f:
                all_tsx_content += f.read() + "\n"
        except Exception:
            continue
    
    # Check variable usage through Tailwind classes
    used_variable_classes = extract_tailwind_classes_using_variables(all_tsx_content)
    
    # Analyze theme usage
    theme_analysis = detect_theme_usage(tsx_path)
    
    return {
        'css_variables_defined': css_variables,
        'variable_dependent_classes_used': used_variable_classes,
        'theme_analysis': theme_analysis,
        'recommendations': {
            'include_root': len(used_variable_classes) > 0,
            'include_dark': 'dark' in all_tsx_content or theme_analysis['theme_switching'],
            'include_themes': (
                theme_analysis['theme_switching'] or 
                theme_analysis['dynamic_themes'] or 
                len(theme_analysis['theme_classes']) > 0
            ),
            'specific_themes_used': theme_analysis['theme_classes']
        }
    }

if __name__ == '__main__':
    # Example usage
    css_file = '../src/index.css'
    tsx_path = '../src'
    
    analysis = analyze_foundational_usage(css_file, tsx_path)
    
    print("🔍 Foundational CSS Usage Analysis")
    print("=" * 50)
    print(f"CSS Variables Defined: {len(analysis['css_variables_defined'])}")
    print(f"Variable-dependent Classes Used: {len(analysis['variable_dependent_classes_used'])}")
    
    print(f"\n📊 Recommendations:")
    print(f"Include :root? {analysis['recommendations']['include_root']}")
    print(f"Include .dark? {analysis['recommendations']['include_dark']}")
    print(f"Include themes? {analysis['recommendations']['include_themes']}")
    
    if analysis['recommendations']['specific_themes_used']:
        print(f"Specific themes used: {analysis['recommendations']['specific_themes_used']}")
    
    print(f"\n🎨 Theme Analysis:")
    for key, value in analysis['theme_analysis'].items():
        print(f"{key}: {value}")