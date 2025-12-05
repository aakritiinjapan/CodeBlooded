#!/usr/bin/env node

/**
 * Safety Property Validator Hook
 * 
 * This hook runs after agent completion to validate that all horror effects
 * respect safety constraints defined in the requirements.
 * 
 * Triggered by: stop event
 * Input: JSON event on STDIN with hook_event_name and cwd
 * Output: Exit code 0 (success) or 1 (failure)
 */

const fs = require('fs');
const path = require('path');

const SAFETY_PROPERTIES = {
  flashFrequency: {
    name: 'Flash Frequency Limit',
    description: 'No effect should exceed 3 flashes per second',
    maxFlashesPerSecond: 3
  },
  stateRestoration: {
    name: 'State Restoration Time',
    description: 'Phantom effects must restore within 2 seconds',
    maxRestorationMs: 2000
  },
  panicButton: {
    name: 'Panic Button Integration',
    description: 'All effects must respect panic button state',
    required: true
  },
  accessibility: {
    name: 'Accessibility Compliance',
    description: 'Effects must respect Reduce Motion setting',
    required: true
  },
  nonBlocking: {
    name: 'Non-Blocking Operations',
    description: 'No effect should block user input',
    required: true
  }
};

async function main() {
  try {
    // Read JSON event from STDIN
    const input = await readStdin();
    const event = JSON.parse(input);
    
    const cwd = event.cwd || process.cwd();
    
    console.log('🔍 Validating safety properties...\n');
    
    const results = {
      passed: [],
      failed: [],
      warnings: []
    };
    
    // Check for flash frequency limiters in code
    await checkFlashFrequency(cwd, results);
    
    // Check for state restoration patterns
    await checkStateRestoration(cwd, results);
    
    // Check for panic button integration
    await checkPanicButton(cwd, results);
    
    // Check for accessibility checks
    await checkAccessibility(cwd, results);
    
    // Check for blocking operations
    await checkNonBlocking(cwd, results);
    
    // Print results
    printResults(results);
    
    // Exit with appropriate code
    if (results.failed.length > 0) {
      console.error('\n❌ Safety validation FAILED');
      process.exit(1);
    } else {
      console.log('\n✅ Safety validation PASSED');
      process.exit(0);
    }
  } catch (error) {
    console.error('Safety validation error:', error.message);
    process.exit(1);
  }
}

async function checkFlashFrequency(cwd, results) {
  const property = SAFETY_PROPERTIES.flashFrequency;
  
  try {
    const horrorFiles = await findHorrorFiles(cwd);
    let hasLimiter = false;
    
    for (const file of horrorFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for flash frequency limiter pattern
      if (content.includes('FlashFrequencyLimiter') || 
          content.includes('maxFlashesPerSecond') ||
          content.includes('canFlash()')) {
        hasLimiter = true;
        break;
      }
    }
    
    if (hasLimiter) {
      results.passed.push({
        property: property.name,
        message: 'Flash frequency limiter found in code'
      });
    } else {
      results.warnings.push({
        property: property.name,
        message: 'No flash frequency limiter detected - ensure effects respect 3Hz limit'
      });
    }
  } catch (error) {
    results.failed.push({
      property: property.name,
      message: `Check failed: ${error.message}`
    });
  }
}

async function checkStateRestoration(cwd, results) {
  const property = SAFETY_PROPERTIES.stateRestoration;
  
  try {
    const horrorFiles = await findHorrorFiles(cwd);
    let hasRestoration = false;
    
    for (const file of horrorFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for state restoration patterns
      if (content.includes('SafeStateModifier') ||
          content.includes('restore') ||
          content.includes('snapshot')) {
        hasRestoration = true;
        break;
      }
    }
    
    if (hasRestoration) {
      results.passed.push({
        property: property.name,
        message: 'State restoration pattern found in code'
      });
    } else {
      results.warnings.push({
        property: property.name,
        message: 'No state restoration pattern detected - ensure phantom effects are reversible'
      });
    }
  } catch (error) {
    results.failed.push({
      property: property.name,
      message: `Check failed: ${error.message}`
    });
  }
}

async function checkPanicButton(cwd, results) {
  const property = SAFETY_PROPERTIES.panicButton;
  
  try {
    const horrorFiles = await findHorrorFiles(cwd);
    let hasPanicIntegration = false;
    
    for (const file of horrorFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for panic button integration
      if (content.includes('panicButton') ||
          content.includes('emergencyDisable') ||
          content.includes('isEnabled')) {
        hasPanicIntegration = true;
        break;
      }
    }
    
    if (hasPanicIntegration) {
      results.passed.push({
        property: property.name,
        message: 'Panic button integration found in code'
      });
    } else {
      results.failed.push({
        property: property.name,
        message: 'CRITICAL: No panic button integration detected'
      });
    }
  } catch (error) {
    results.failed.push({
      property: property.name,
      message: `Check failed: ${error.message}`
    });
  }
}

async function checkAccessibility(cwd, results) {
  const property = SAFETY_PROPERTIES.accessibility;
  
  try {
    const horrorFiles = await findHorrorFiles(cwd);
    let hasAccessibilityCheck = false;
    
    for (const file of horrorFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for accessibility checks
      if (content.includes('reduceMotion') ||
          content.includes('respectReduceMotion') ||
          content.includes('accessibility')) {
        hasAccessibilityCheck = true;
        break;
      }
    }
    
    if (hasAccessibilityCheck) {
      results.passed.push({
        property: property.name,
        message: 'Accessibility checks found in code'
      });
    } else {
      results.failed.push({
        property: property.name,
        message: 'CRITICAL: No accessibility checks detected'
      });
    }
  } catch (error) {
    results.failed.push({
      property: property.name,
      message: `Check failed: ${error.message}`
    });
  }
}

async function checkNonBlocking(cwd, results) {
  const property = SAFETY_PROPERTIES.nonBlocking;
  
  try {
    const horrorFiles = await findHorrorFiles(cwd);
    let hasBlockingCode = false;
    
    for (const file of horrorFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for blocking patterns (basic heuristic)
      if (content.includes('sleep(') ||
          content.includes('while(true)') ||
          content.match(/for\s*\([^)]*;\s*true\s*;/)) {
        hasBlockingCode = true;
        results.warnings.push({
          property: property.name,
          message: `Potential blocking code detected in ${path.basename(file)}`
        });
      }
    }
    
    if (!hasBlockingCode) {
      results.passed.push({
        property: property.name,
        message: 'No obvious blocking operations detected'
      });
    }
  } catch (error) {
    results.failed.push({
      property: property.name,
      message: `Check failed: ${error.message}`
    });
  }
}

async function findHorrorFiles(cwd) {
  const horrorDir = path.join(cwd, 'packages', 'vscode-extension', 'src');
  const files = [];
  
  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        // Include files with "horror" in name or in specific directories
        if (entry.name.toLowerCase().includes('horror') ||
            fullPath.includes('horror')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walkDir(horrorDir);
  return files;
}

function printResults(results) {
  console.log('📊 Safety Property Validation Results:\n');
  
  if (results.passed.length > 0) {
    console.log('✅ PASSED:');
    results.passed.forEach(r => {
      console.log(`   • ${r.property}: ${r.message}`);
    });
    console.log();
  }
  
  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    results.warnings.forEach(r => {
      console.log(`   • ${r.property}: ${r.message}`);
    });
    console.log();
  }
  
  if (results.failed.length > 0) {
    console.log('❌ FAILED:');
    results.failed.forEach(r => {
      console.log(`   • ${r.property}: ${r.message}`);
    });
    console.log();
  }
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      resolve(data || '{}');
    });
    
    process.stdin.on('error', reject);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      resolve('{}');
    }, 5000);
  });
}

// Run the validator
main();
