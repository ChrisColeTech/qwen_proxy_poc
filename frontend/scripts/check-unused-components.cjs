#!/usr/bin/env node

/**
 * Script to check for unused components in the codebase
 * Usage: node scripts/check-unused-components.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COMPONENTS_DIR = path.join(__dirname, '../src/components');
const SRC_DIR = path.join(__dirname, '../src');

/**
 * Recursively find all component files
 */
function findComponentFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findComponentFiles(filePath, fileList);
    } else if (file.match(/\.(tsx|jsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extract component name from file path
 */
function getComponentName(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  return basename;
}

/**
 * Get relative path from src directory
 */
function getRelativePath(filePath) {
  return path.relative(SRC_DIR, filePath);
}

/**
 * Check if component is imported anywhere
 */
function isComponentUsed(componentPath, componentName) {
  try {
    // Search for component imports (components can use relative or @ paths)
    // Match patterns like: import { Sidebar } from './Sidebar' or from '@/components/...'
    const result = execSync(
      `grep -rE "(import.*${componentName}.*from|from.*).*${componentName}" ${SRC_DIR} --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );

    // Exclude matches in the component file itself
    const relativePath = getRelativePath(componentPath);
    const lines = result.trim().split('\n');
    const externalImports = lines.filter(line => !line.includes(relativePath));

    return externalImports.length > 0;
  } catch (error) {
    // grep returns non-zero exit code when no matches found
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Analyzing component usage...\n');
  console.log(`Components directory: ${COMPONENTS_DIR}`);
  console.log(`Source directory: ${SRC_DIR}\n`);

  const componentFiles = findComponentFiles(COMPONENTS_DIR);
  console.log(`Found ${componentFiles.length} component files\n`);

  const results = {
    used: [],
    unused: [],
    total: componentFiles.length
  };

  componentFiles.forEach(filePath => {
    const componentName = getComponentName(filePath);
    const relativePath = getRelativePath(filePath);
    const isUsed = isComponentUsed(filePath, componentName);

    if (isUsed) {
      results.used.push({ name: componentName, path: relativePath });
    } else {
      results.unused.push({ name: componentName, path: relativePath });
    }
  });

  // Print results
  console.log('=' .repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total components: ${results.total}`);
  console.log(`Used components: ${results.used.length}`);
  console.log(`Unused components: ${results.unused.length}`);
  console.log(`Usage rate: ${((results.used.length / results.total) * 100).toFixed(1)}%`);
  console.log('');

  if (results.unused.length > 0) {
    console.log('⚠️  UNUSED COMPONENTS:');
    console.log('='.repeat(80));
    results.unused.forEach(({ name, path }) => {
      console.log(`  ❌ ${name}`);
      console.log(`     ${path}`);
    });
    console.log('');
  } else {
    console.log('✅ All components are being used!\n');
  }

  if (results.used.length > 0 && process.argv.includes('--verbose')) {
    console.log('✅ USED COMPONENTS:');
    console.log('='.repeat(80));
    results.used.forEach(({ name, path }) => {
      console.log(`  ✓ ${name}`);
      console.log(`    ${path}`);
    });
    console.log('');
  }

  // Exit with error code if unused components found
  if (results.unused.length > 0) {
    console.log('💡 Tip: Review unused components and consider removing them to reduce bundle size.');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
