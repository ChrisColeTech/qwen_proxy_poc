#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, '..', 'src');
const STYLES_DIR = path.join(SRC_DIR, 'styles');

console.log('🔍 Accurate CSS Analysis - Checking ALL usage patterns...\n');

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

  // Match .classname patterns
  const classRegex = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;
  let match;

  while ((match = classRegex.exec(cssContent)) !== null) {
    const className = match[1];
    // Skip Tailwind arbitrary values and pseudo-classes
    if (!className.includes('[') && !className.includes(':')) {
      classes.add(className);
    }
  }

  return Array.from(classes);
}

// Check if class is used anywhere in source
function isClassUsed(className, cssFilePath) {
  try {
    // Search in all .tsx, .ts, and .css files
    // Use word boundaries to avoid partial matches
    const result = execSync(
      `grep -rE "\\b${className}\\b" ${SRC_DIR} --include="*.tsx" --include="*.ts" --include="*.css" 2>/dev/null || true`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );

    if (!result.trim()) {
      return false;
    }

    // Check if usage is only in the CSS file itself (definition)
    const lines = result.trim().split('\n');
    const usedInOtherFiles = lines.some(line => {
      // Extract file path from grep output
      const filePath = line.split(':')[0];
      return filePath !== cssFilePath;
    });

    return usedInOtherFiles;
  } catch (error) {
    return false;
  }
}

// Analyze each CSS file
const cssFiles = getAllCSSFiles(STYLES_DIR);
const results = [];

for (const cssFile of cssFiles) {
  const relativePath = path.relative(SRC_DIR, cssFile);
  const content = fs.readFileSync(cssFile, 'utf8');
  const classes = extractClasses(content);

  const usedClasses = [];
  const unusedClasses = [];

  for (const className of classes) {
    if (isClassUsed(className, cssFile)) {
      usedClasses.push(className);
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
    unusedClasses: unusedClasses.slice(0, 10), // Show first 10
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
    console.log(`   Unused classes (showing first 10): ${result.unusedClasses.join(', ')}`);
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
console.log('');

// Files with 0% usage
const zeroUsageFiles = results.filter(r => r.usagePercent === 0);
if (zeroUsageFiles.length > 0) {
  console.log('⚠️  FILES WITH 0% USAGE (Safe to delete):');
  console.log('================================================================================');
  for (const file of zeroUsageFiles) {
    console.log(`   ❌ ${file.file}`);
  }
}
