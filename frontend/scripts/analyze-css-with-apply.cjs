#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, '..', 'src');
const STYLES_DIR = path.join(SRC_DIR, 'styles');

console.log('🔍 CSS Analysis with @apply dependency tracking...\n');

// Get all CSS files
function getAllCSSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllCSSFiles(fullPath));
    } else if (item.endsWith('.css')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Extract class names from CSS file
function extractClasses(cssContent) {
  const classes = new Set();
  const classRegex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  let match;

  while ((match = classRegex.exec(cssContent)) !== null) {
    const className = match[1];
    if (!className.includes('[') && !className.includes(':')) {
      classes.add(className);
    }
  }

  return Array.from(classes);
}

// Extract @apply dependencies from CSS file
function extractApplyDependencies(cssContent) {
  const dependencies = new Map(); // className -> [classes it depends on via @apply]
  const lines = cssContent.split('\n');
  let currentClass = null;

  for (const line of lines) {
    // Match class definition
    const classMatch = line.match(/^\.([a-zA-Z_-][a-zA-Z0-9_-]*)\s*\{/);
    if (classMatch) {
      currentClass = classMatch[1];
      dependencies.set(currentClass, []);
    }

    // Match @apply usage
    const applyMatch = line.match(/@apply\s+([^;]+);/);
    if (applyMatch && currentClass) {
      const appliedClasses = applyMatch[1]
        .split(/\s+/)
        .filter(c => c && !c.startsWith('[') && !c.includes(':'));

      const existing = dependencies.get(currentClass) || [];
      dependencies.set(currentClass, [...existing, ...appliedClasses]);
    }

    // End of class definition
    if (line.trim() === '}') {
      currentClass = null;
    }
  }

  return dependencies;
}

// Build complete dependency map across all CSS files
const cssFiles = getAllCSSFiles(STYLES_DIR);
const allDependencies = new Map();
const allClasses = new Map(); // className -> file path

for (const cssFile of cssFiles) {
  const content = fs.readFileSync(cssFile, 'utf8');
  const classes = extractClasses(content);
  const deps = extractApplyDependencies(content);

  for (const className of classes) {
    allClasses.set(className, cssFile);
  }

  for (const [className, appliedClasses] of deps.entries()) {
    allDependencies.set(className, appliedClasses);
  }
}

// Check if class is used in source or via @apply
function isClassUsed(className, cssFilePath) {
  // Check direct usage in .tsx/.ts files
  try {
    const result = execSync(
      `grep -rE "\\b${className}\\b" ${SRC_DIR} --include="*.tsx" --include="*.ts" 2>/dev/null || true`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );

    if (result.trim()) {
      const lines = result.trim().split('\n');
      const usedInOtherFiles = lines.some(line => {
        const filePath = line.split(':')[0];
        return filePath !== cssFilePath && !filePath.endsWith('.css');
      });

      if (usedInOtherFiles) {
        return { used: true, reason: 'direct usage in code' };
      }
    }
  } catch (error) {
    // Ignore
  }

  // Check if used via @apply by another class that IS used
  for (const [otherClass, appliedClasses] of allDependencies.entries()) {
    if (appliedClasses.includes(className)) {
      // Check if the OTHER class is used
      const otherClassUsed = isClassUsed(otherClass, allClasses.get(otherClass) || '');
      if (otherClassUsed.used) {
        return { used: true, reason: `used via @apply in .${otherClass}` };
      }
    }
  }

  return { used: false, reason: '' };
}

// Analyze each CSS file
const results = [];

for (const cssFile of cssFiles) {
  const relativePath = path.relative(SRC_DIR, cssFile);
  const content = fs.readFileSync(cssFile, 'utf8');
  const classes = extractClasses(content);

  const usedClasses = [];
  const unusedClasses = [];
  const usageReasons = {};

  for (const className of classes) {
    const { used, reason } = isClassUsed(className, cssFile);
    if (used) {
      usedClasses.push(className);
      usageReasons[className] = reason;
    } else {
      unusedClasses.push(className);
    }
  }

  const totalClasses = classes.length;
  const usagePercent = totalClasses > 0 ? ((usedClasses.length / totalClasses) * 100).toFixed(1) : 0;

  results.push({
    file: relativePath,
    total: totalClasses,
    used: usedClasses.length,
    unused: unusedClasses.length,
    usagePercent: parseFloat(usagePercent),
    unusedClasses: unusedClasses.slice(0, 10),
    usedClasses: usedClasses,
    usageReasons: usageReasons,
  });
}

// Sort by usage percent (lowest first)
results.sort((a, b) => a.usagePercent - b.usagePercent);

// Print results
console.log('================================================================================');
console.log('RESULTS - Sorted by Usage (Lowest First)');
console.log('================================================================================\n');

for (const result of results) {
  console.log(`📄 ${result.file}`);
  console.log(`   Total: ${result.total} | Used: ${result.used} | Unused: ${result.unused} (${result.usagePercent}% used)`);

  if (result.unused > 0) {
    console.log(`   Unused classes: ${result.unusedClasses.join(', ')}`);
  }

  if (result.used > 0 && result.used <= 5) {
    console.log(`   Used classes: ${result.usedClasses.map(c => `${c} (${result.usageReasons[c]})`).join(', ')}`);
  }

  console.log('');
}

// Summary
const totalFiles = results.length;
const totalClasses = results.reduce((sum, r) => sum + r.total, 0);
const totalUsed = results.reduce((sum, r) => sum + r.used, 0);
const totalUnused = results.reduce((sum, r) => sum + r.unused, 0);

console.log('================================================================================');
console.log('SUMMARY');
console.log('================================================================================');
console.log(`Total CSS files: ${totalFiles}`);
console.log(`Total CSS classes: ${totalClasses}`);
console.log(`Used classes: ${totalUsed} (${((totalUsed / totalClasses) * 100).toFixed(1)}%)`);
console.log(`Unused classes: ${totalUnused} (${((totalUnused / totalClasses) * 100).toFixed(1)}%)`);
