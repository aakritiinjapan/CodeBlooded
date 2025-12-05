#!/usr/bin/env node

/**
 * Horror Keyword Trigger Hook
 * 
 * This hook monitors code changes for horror-related keywords and triggers
 * context-aware effects when detected.
 * 
 * Triggered by: postToolUse event on @builtin/write
 * Input: JSON event on STDIN with tool_input and tool_response
 * Output: Exit code 0 (success) or 1 (failure)
 */

const HORROR_KEYWORDS = {
  'kill': 'bloodDrip',
  'dead': 'skullFlash',
  'death': 'shadowCreep',
  'error': 'glitchEffect',
  'fatal': 'screenShake',
  'crash': 'staticNoise',
  'destroy': 'chromaAberration',
  'nightmare': 'maxIntensity',
  'TODO': 'phantomTyping',
  'FIXME': 'whisperingVariables'
};

const TRIGGER_CHANCE = 0.3; // 30% chance to trigger
const COOLDOWN_MS = 20000; // 20 seconds between triggers

let lastTriggerTime = 0;

async function main() {
  try {
    // Read JSON event from STDIN
    const input = await readStdin();
    const event = JSON.parse(input);
    
    // Extract file operations from tool_input
    const operations = event.tool_input?.operations || [];
    
    // Check each operation for horror keywords
    for (const op of operations) {
      if (op.type === 'write' || op.type === 'create') {
        const content = op.content || '';
        const triggeredEffect = checkForKeywords(content);
        
        if (triggeredEffect) {
          console.log(JSON.stringify({
            triggered: true,
            effect: triggeredEffect,
            file: op.path,
            timestamp: Date.now()
          }));
          
          // Exit with success - effect triggered
          process.exit(0);
        }
      }
    }
    
    // No keywords found
    console.log(JSON.stringify({
      triggered: false,
      timestamp: Date.now()
    }));
    
    process.exit(0);
  } catch (error) {
    console.error('Horror keyword check failed:', error.message);
    process.exit(1);
  }
}

function checkForKeywords(content) {
  const now = Date.now();
  
  // Check cooldown
  if (now - lastTriggerTime < COOLDOWN_MS) {
    return null;
  }
  
  // Check for keywords (case-insensitive)
  const lowerContent = content.toLowerCase();
  
  for (const [keyword, effect] of Object.entries(HORROR_KEYWORDS)) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      // Random chance to trigger
      if (Math.random() < TRIGGER_CHANCE) {
        lastTriggerTime = now;
        return effect;
      }
    }
  }
  
  return null;
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      resolve(data);
    });
    
    process.stdin.on('error', reject);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      reject(new Error('Timeout reading STDIN'));
    }, 5000);
  });
}

// Run the hook
main();
