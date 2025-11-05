#!/usr/bin/env node

/**
 * Pre-publish validation script
 * Checks that all required fields are set before publishing
 */

const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log('🎃 CodeChroma Publishing Validator\n');

const errors = [];
const warnings = [];

// Required fields
if (!pkg.publisher || pkg.publisher === 'codechroma') {
  errors.push('❌ Publisher ID not set. Update "publisher" in package.json with your actual publisher ID.');
}

if (!pkg.repository || pkg.repository.url.includes('yourusername')) {
  warnings.push('⚠️  Repository URL contains placeholder. Update with your actual GitHub URL.');
}

if (!pkg.bugs || pkg.bugs.url.includes('yourusername')) {
  warnings.push('⚠️  Bugs URL contains placeholder. Update with your actual GitHub URL.');
}

if (!pkg.homepage || pkg.homepage.includes('yourusername')) {
  warnings.push('⚠️  Homepage URL contains placeholder. Update with your actual URL.');
}

// Check for icon
if (pkg.icon) {
  const iconPath = path.join(__dirname, '..', pkg.icon);
  if (!fs.existsSync(iconPath)) {
    warnings.push(`⚠️  Icon file not found: ${pkg.icon}. Either create it or remove the "icon" field.`);
  }
}

// Check for README
const readmePath = path.join(__dirname, '..', 'README.md');
if (!fs.existsSync(readmePath)) {
  errors.push('❌ README.md not found. This is required for marketplace listing.');
}

// Check for LICENSE
const licensePath = path.join(__dirname, '..', '..', '..', 'LICENSE');
if (!fs.existsSync(licensePath)) {
  warnings.push('⚠️  LICENSE file not found in repo root. Consider adding one.');
}

// Display results
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Ready to publish.\n');
  console.log('Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Run: npm run package (to test locally)');
  console.log('3. Run: vsce login YOUR_PUBLISHER_ID');
  console.log('4. Run: npm run publish\n');
  process.exit(0);
}

if (errors.length > 0) {
  console.log('ERRORS (must fix before publishing):\n');
  errors.forEach(err => console.log(err));
  console.log('');
}

if (warnings.length > 0) {
  console.log('WARNINGS (recommended to fix):\n');
  warnings.forEach(warn => console.log(warn));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Cannot publish until errors are fixed.\n');
  console.log('See PUBLISHING.md for detailed instructions.\n');
  process.exit(1);
} else {
  console.log('⚠️  You can publish, but consider fixing warnings first.\n');
  process.exit(0);
}
