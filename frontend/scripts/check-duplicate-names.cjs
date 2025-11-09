#!/usr/bin/env node

/**
 * Script to check for duplicate file names in the codebase
 * Usage: node scripts/check-duplicate-names.cjs
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');

/**
 * Recursively find all files
 */
function findAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findAllFiles(filePath, fileList);
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Get relative path from src directory
 */
function getRelativePath(filePath) {
  return path.relative(SRC_DIR, filePath);
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Analyzing for duplicate file names...\n');
  console.log(`Source directory: ${SRC_DIR}\n`);

  const allFiles = findAllFiles(SRC_DIR);
  console.log(`Found ${allFiles.length} files\n`);

  // Group files by basename
  const filesByName = {};
  allFiles.forEach(filePath => {
    const basename = path.basename(filePath);
    if (!filesByName[basename]) {
      filesByName[basename] = [];
    }
    filesByName[basename].push(filePath);
  });

  // Find duplicates
  const duplicates = {};
  Object.keys(filesByName).forEach(basename => {
    if (filesByName[basename].length > 1) {
      duplicates[basename] = filesByName[basename];
    }
  });

  const duplicateCount = Object.keys(duplicates).length;

  // Print results
  console.log('=' .repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total unique file names: ${Object.keys(filesByName).length}`);
  console.log(`Duplicate file names: ${duplicateCount}`);
  console.log('');

  if (duplicateCount > 0) {
    console.log('⚠️  DUPLICATE FILE NAMES:');
    console.log('='.repeat(80));

    Object.keys(duplicates).sort().forEach(basename => {
      console.log(`\n📄 ${basename} (${duplicates[basename].length} occurrences):`);
      duplicates[basename].forEach(filePath => {
        console.log(`   - ${getRelativePath(filePath)}`);
      });
    });
    console.log('');
    console.log('💡 Tip: Consider renaming duplicate files to make them more unique.');
    process.exit(1);
  } else {
    console.log('✅ No duplicate file names found!\n');
    process.exit(0);
  }
}

main();
