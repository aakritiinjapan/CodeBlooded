# CodeChroma Extension Debugging Guide

## Current Issue: Red Screen and No Audio

The extension appears to be working (red screen indicates theme manager is active) but there are two issues:
1. The theme appears to be stuck on red
2. No audio is playing

## Debug Steps:

### 1. Open Extension Development Window
The extension development window should already be open. If not:
```bash
cd packages/vscode-extension
code --extensionDevelopmentPath=. --extensionDevelopmentKind=ui
```

### 2. Check Console Logs
In the extension development window:
- Press `Ctrl+Shift+P` and run "Developer: Show Logs" → "Extension Host"
- Look for debug messages starting with "[CodeChroma Debug]"

### 3. Test the Reset Command
- Press `Ctrl+Shift+P` 
- Type "CodeChroma: Reset Theme"
- Run the command to clear any stuck themes

### 4. Test with Sample Files
Open these test files to trigger different complexity levels:
- `samples/low-complexity.ts` - Should be green/blue
- `samples/medium-complexity.ts` - Should be yellow/orange  
- `samples/high-complexity.ts` - Should be red
- `samples/critical-complexity.ts` - Should be deep red

### 5. Check Audio Initialization
Look for these log messages:
- "Audio engine initialized successfully"
- "Webview created for audio engine"
- "Tone.js loaded successfully"
- "Playing audio for complexity: X"

### 6. Manual Audio Test
If audio fails, check:
- Volume is up
- No other audio applications blocking
- Try the reset command first

## Expected Debug Output

When working correctly, you should see:
```
[CodeChroma Debug] Extension activated
[CodeChroma Debug] Webview created for audio engine  
[CodeChroma Debug] Tone.js loaded successfully
[CodeChroma Debug] Audio engine initialized successfully
[CodeChroma Debug] Performing analysis for: filename.ts
[CodeChroma Debug] Analysis result: {...}
[CodeChroma Debug] Playing audio for complexity: X
[CodeChroma Debug] Theme applied for complexity: X
```

## Common Issues

1. **Red screen stuck**: Run reset command
2. **No audio**: Check console for Tone.js loading errors
3. **No analysis**: Check if files are TypeScript/JavaScript
4. **Extension not loading**: Check Extension Host logs for activation errors