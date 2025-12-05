#!/usr/bin/env node

/**
 * Kiro Structure Validator
 * 
 * Validates the .kiro directory structure for hackathon submission.
 * This mimics what kiro-cli validate would check.
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_STRUCTURE = {
  '.kiro': {
    type: 'directory',
    required: true,
    children: {
      'steering': {
        type: 'directory',
        required: true,
        minFiles: 1
      },
      'hooks': {
        type: 'directory',
        required: true,
        minFiles: 1
      },
      'settings': {
        type: 'directory',
        required: true,
        children: {
          'mcp.json': {
            type: 'file',
            required: true,
            validate: validateJSON
          }
        }
      },
      'specs': {
        type: 'directory',
        required: true,
        minFiles: 1
      }
    }
  }
};

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function main() {
  console.log('🔍 Validating .kiro directory structure...\n');
  
  try {
    // Check if .kiro exists
    if (!fs.existsSync('.kiro')) {
      results.failed.push({
        path: '.kiro',
        message: 'CRITICAL: .kiro directory does not exist'
      });
      printResults();
      process.exit(1);
    }
    
    // Check if .kiro is gitignored
    checkGitignore();
    
    // Validate structure
    validateStructure('.kiro', REQUIRED_STRUCTURE['.kiro']);
    
    // Validate steering files
    validateSteeringFiles();
    
    // Validate hooks
    validateHooks();
    
    // Validate specs
    validateSpecs();
    
    // Print results
    printResults();
    
    // Exit with appropriate code
    if (results.failed.length > 0) {
      console.error('\n❌ Validation FAILED');
      process.exit(1);
    } else {
      console.log('\n✅ Validation PASSED');
      console.log('\n🎉 Your .kiro directory is ready for hackathon submission!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Validation error:', error.message);
    process.exit(1);
  }
}

function validateStructure(basePath, schema) {
  if (schema.type === 'directory') {
    if (!fs.existsSync(basePath)) {
      if (schema.required) {
        results.failed.push({
          path: basePath,
          message: 'Required directory does not exist'
        });
      }
      return;
    }
    
    const stat = fs.statSync(basePath);
    if (!stat.isDirectory()) {
      results.failed.push({
        path: basePath,
        message: 'Expected directory but found file'
      });
      return;
    }
    
    results.passed.push({
      path: basePath,
      message: 'Directory exists'
    });
    
    // Check minimum files
    if (schema.minFiles) {
      const files = fs.readdirSync(basePath);
      if (files.length < schema.minFiles) {
        results.failed.push({
          path: basePath,
          message: `Expected at least ${schema.minFiles} files, found ${files.length}`
        });
      } else {
        results.passed.push({
          path: basePath,
          message: `Contains ${files.length} files`
        });
      }
    }
    
    // Check children
    if (schema.children) {
      for (const [name, childSchema] of Object.entries(schema.children)) {
        const childPath = path.join(basePath, name);
        validateStructure(childPath, childSchema);
      }
    }
  } else if (schema.type === 'file') {
    if (!fs.existsSync(basePath)) {
      if (schema.required) {
        results.failed.push({
          path: basePath,
          message: 'Required file does not exist'
        });
      }
      return;
    }
    
    const stat = fs.statSync(basePath);
    if (!stat.isFile()) {
      results.failed.push({
        path: basePath,
        message: 'Expected file but found directory'
      });
      return;
    }
    
    results.passed.push({
      path: basePath,
      message: 'File exists'
    });
    
    // Run custom validation
    if (schema.validate) {
      schema.validate(basePath);
    }
  }
}

function validateJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    results.passed.push({
      path: filePath,
      message: 'Valid JSON'
    });
  } catch (error) {
    results.failed.push({
      path: filePath,
      message: `Invalid JSON: ${error.message}`
    });
  }
}

function validateSteeringFiles() {
  const steeringDir = '.kiro/steering';
  if (!fs.existsSync(steeringDir)) return;
  
  const files = fs.readdirSync(steeringDir);
  
  // Check for AGENTS.md (community standard)
  if (files.includes('AGENTS.md')) {
    results.passed.push({
      path: path.join(steeringDir, 'AGENTS.md'),
      message: 'AGENTS.md found (community standard)'
    });
  } else {
    results.warnings.push({
      path: steeringDir,
      message: 'AGENTS.md not found (recommended for community standard)'
    });
  }
  
  // Validate each markdown file
  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(steeringDir, file);
      validateMarkdownFile(filePath);
    }
  }
}

function validateMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for front-matter (optional for AGENTS.md)
    if (path.basename(filePath) !== 'AGENTS.md') {
      if (content.startsWith('---')) {
        const frontMatterEnd = content.indexOf('---', 3);
        if (frontMatterEnd > 0) {
          results.passed.push({
            path: filePath,
            message: 'Has YAML front-matter'
          });
        } else {
          results.warnings.push({
            path: filePath,
            message: 'Front-matter not properly closed'
          });
        }
      } else {
        results.warnings.push({
          path: filePath,
          message: 'No YAML front-matter (optional but recommended)'
        });
      }
    }
    
    // Check if parseable
    if (content.length > 0) {
      results.passed.push({
        path: filePath,
        message: 'Markdown file is readable'
      });
    }
  } catch (error) {
    results.failed.push({
      path: filePath,
      message: `Cannot read file: ${error.message}`
    });
  }
}

function validateHooks() {
  const hooksDir = '.kiro/hooks';
  if (!fs.existsSync(hooksDir)) return;
  
  const files = fs.readdirSync(hooksDir);
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(hooksDir, file);
      validateHookFile(filePath);
    }
  }
}

function validateHookFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hook = JSON.parse(content);
    
    // Check required fields
    const requiredFields = ['event', 'command'];
    for (const field of requiredFields) {
      if (!hook[field]) {
        results.failed.push({
          path: filePath,
          message: `Missing required field: ${field}`
        });
      }
    }
    
    // Check if command script exists
    if (hook.command === 'node' && hook.args && hook.args.length > 0) {
      const scriptPath = hook.args[0];
      if (!fs.existsSync(scriptPath)) {
        results.warnings.push({
          path: filePath,
          message: `Hook script not found: ${scriptPath}`
        });
      } else {
        results.passed.push({
          path: filePath,
          message: 'Hook script exists'
        });
      }
    }
    
    results.passed.push({
      path: filePath,
      message: 'Valid hook configuration'
    });
  } catch (error) {
    results.failed.push({
      path: filePath,
      message: `Invalid hook: ${error.message}`
    });
  }
}

function validateSpecs() {
  const specsDir = '.kiro/specs';
  if (!fs.existsSync(specsDir)) return;
  
  const specs = fs.readdirSync(specsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  for (const spec of specs) {
    const specDir = path.join(specsDir, spec);
    
    // Check for required spec files
    const requiredFiles = ['requirements.md', 'design.md', 'tasks.md'];
    for (const file of requiredFiles) {
      const filePath = path.join(specDir, file);
      if (fs.existsSync(filePath)) {
        results.passed.push({
          path: filePath,
          message: 'Spec file exists'
        });
      } else {
        results.warnings.push({
          path: filePath,
          message: 'Spec file missing (recommended)'
        });
      }
    }
  }
}

function checkGitignore() {
  if (fs.existsSync('.gitignore')) {
    const content = fs.readFileSync('.gitignore', 'utf8');
    if (content.includes('.kiro')) {
      results.failed.push({
        path: '.gitignore',
        message: 'CRITICAL: .kiro directory is gitignored - this will disqualify your submission!'
      });
    } else {
      results.passed.push({
        path: '.gitignore',
        message: '.kiro directory is not gitignored'
      });
    }
  }
}

function printResults() {
  console.log('📊 Validation Results:\n');
  
  if (results.passed.length > 0) {
    console.log('✅ PASSED:');
    results.passed.forEach(r => {
      console.log(`   • ${r.path}: ${r.message}`);
    });
    console.log();
  }
  
  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    results.warnings.forEach(r => {
      console.log(`   • ${r.path}: ${r.message}`);
    });
    console.log();
  }
  
  if (results.failed.length > 0) {
    console.log('❌ FAILED:');
    results.failed.forEach(r => {
      console.log(`   • ${r.path}: ${r.message}`);
    });
    console.log();
  }
  
  console.log(`Summary: ${results.passed.length} passed, ${results.warnings.length} warnings, ${results.failed.length} failed`);
}

// Run validation
main();
