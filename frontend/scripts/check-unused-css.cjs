#!/usr/bin/env node

/**
 * Script to analyze CSS class usage in the codebase
 * Usage: node scripts/check-unused-css.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STYLES_DIR = path.join(__dirname, '../src/styles');
const SRC_DIR = path.join(__dirname, '../src');

/**
 * Recursively find all CSS files
 */
function findCSSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findCSSFiles(filePath, fileList);
    } else if (file.match(/\.css$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extract CSS class names from a CSS file
 */
function extractClassNames(cssContent) {
  const classNames = new Set();

  // Match .classname patterns
  const classRegex = /\.([a-zA-Z0-9_-]+)(?=\s*[{,:])/g;
  let match;

  while ((match = classRegex.exec(cssContent)) !== null) {
    const className = match[1];
    // Skip CSS variables and other special cases
    if (!className.startsWith('-') && className !== 'dark') {
      classNames.add(className);
    }
  }

  return Array.from(classNames);
}

/**
 * Check if a class name is used in the codebase
 */
function isClassUsed(className) {
  try {
    // Search for className usage in JSX/TSX files
    // Look for patterns like: className="..." or className={...}
    const result = execSync(
      `grep -rE "(className=|class=).*${className}" ${SRC_DIR} --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );

    return result.trim().length > 0;
  } catch (error) {
    // grep returns non-zero exit code when no matches found
    return false;
  }
}

/**
 * Get relative path from styles directory
 */
function getRelativePath(filePath) {
  return path.relative(STYLES_DIR, filePath);
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Analyzing CSS class usage...\n');
  console.log(`Styles directory: ${STYLES_DIR}\n`);

  const cssFiles = findCSSFiles(STYLES_DIR);

  // Also check index.css and App.css at root
  const rootCSSFiles = [
    path.join(__dirname, '../src/index.css'),
    path.join(__dirname, '../src/App.css')
  ].filter(f => fs.existsSync(f));

  const allCSSFiles = [...cssFiles, ...rootCSSFiles];

  console.log(`Found ${allCSSFiles.length} CSS files\n`);

  const results = {
    totalClasses: 0,
    usedClasses: 0,
    unusedClasses: 0,
    fileStats: []
  };

  allCSSFiles.forEach(filePath => {
    const cssContent = fs.readFileSync(filePath, 'utf8');
    const classNames = extractClassNames(cssContent);

    const fileStats = {
      path: path.relative(SRC_DIR, filePath),
      totalClasses: classNames.length,
      usedClasses: [],
      unusedClasses: []
    };

    classNames.forEach(className => {
      if (isClassUsed(className)) {
        fileStats.usedClasses.push(className);
        results.usedClasses++;
      } else {
        fileStats.unusedClasses.push(className);
        results.unusedClasses++;
      }
    });

    results.totalClasses += classNames.length;
    results.fileStats.push(fileStats);
  });

  // Print results
  console.log('=' .repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total CSS files: ${allCSSFiles.length}`);
  console.log(`Total CSS classes: ${results.totalClasses}`);
  console.log(`Used classes: ${results.usedClasses}`);
  console.log(`Unused classes: ${results.unusedClasses}`);
  console.log(`Usage rate: ${((results.usedClasses / results.totalClasses) * 100).toFixed(1)}%`);
  console.log('');

  // Show files with unused classes
  const filesWithUnused = results.fileStats.filter(f => f.unusedClasses.length > 0);

  if (filesWithUnused.length > 0) {
    console.log('⚠️  FILES WITH UNUSED CLASSES:');
    console.log('='.repeat(80));

    filesWithUnused.forEach(({ path, totalClasses, usedClasses, unusedClasses }) => {
      const usageRate = ((usedClasses.length / totalClasses) * 100).toFixed(1);
      console.log(`\n📄 ${path}`);
      console.log(`   Total: ${totalClasses} | Used: ${usedClasses.length} | Unused: ${unusedClasses.length} (${usageRate}% used)`);

      if (unusedClasses.length <= 10) {
        // Show all if 10 or fewer
        console.log(`   Unused: ${unusedClasses.join(', ')}`);
      } else {
        // Show first 10
        console.log(`   Unused (showing first 10): ${unusedClasses.slice(0, 10).join(', ')}...`);
      }
    });
    console.log('');
  }

  // Show fully used files
  const fullyUsedFiles = results.fileStats.filter(f => f.unusedClasses.length === 0 && f.totalClasses > 0);
  if (fullyUsedFiles.length > 0 && process.argv.includes('--verbose')) {
    console.log('✅ FILES WITH 100% CLASS USAGE:');
    console.log('='.repeat(80));
    fullyUsedFiles.forEach(({ path, totalClasses }) => {
      console.log(`  ✓ ${path} (${totalClasses} classes)`);
    });
    console.log('');
  }

  if (results.unusedClasses > 0) {
    console.log('💡 Tip: Review unused CSS classes and consider removing them to reduce bundle size.');
    console.log('💡 Note: Some classes may be used dynamically or in ways this tool cannot detect.');
    process.exit(1);
  } else {
    console.log('✅ All CSS classes are being used!\n');
    process.exit(0);
  }
}

main();
