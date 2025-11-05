#!/usr/bin/env node

/**
 * Post-install script for @codechroma/lsp-server
 * Sets up executable permissions and verifies installation
 */

const fs = require('fs');
const path = require('path');

try {
  // Verify the server binary exists
  const serverPath = path.join(__dirname, '..', 'dist', 'server.js');
  
  if (fs.existsSync(serverPath)) {
    // Set executable permissions on Unix-like systems
    if (process.platform !== 'win32') {
      fs.chmodSync(serverPath, '755');
    }
    
    console.log('✓ CodeChroma LSP Server installed successfully');
    console.log('  Run: codechroma-lsp --stdio');
  } else {
    console.log('⚠ CodeChroma LSP Server binary not found. Run: npm run build');
  }
} catch (error) {
  // Silent fail - don't break installation
  console.error('Warning: Could not complete post-install setup:', error.message);
}
