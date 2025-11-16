# 🎉 CodeChroma Audio Test Instructions

Great news! The test audio command is working. Now let's test the full extension workflow:

## ✅ Audio Working - Now Test Full Extension

### Step 1: Open Extension Development Window
If not already open:
```
cd packages/vscode-extension
code --extensionDevelopmentPath=. --extensionDevelopmentKind=ui
```

### Step 2: Test Automatic Analysis + Audio
In the extension development window:

1. **Open a test file**: `samples/high-complexity.ts` (should trigger red theme + audio)
2. **Listen for audio**: You should hear audio tones as you open/edit the file
3. **Watch theme changes**: Background should turn reddish for high complexity

### Step 3: Test Different Complexity Levels
Open these files in sequence and notice theme/audio changes:
- `samples/low-complexity.ts` → Green/blue theme + low pitch audio
- `samples/medium-complexity.ts` → Yellow/orange theme + medium pitch audio  
- `samples/high-complexity.ts` → Red theme + high pitch audio
- `samples/critical-complexity.ts` → Deep red theme + urgent audio

### Step 4: Check Debug Logs
Press `Ctrl+Shift+P` → "Developer: Show Logs" → "Extension Host"

**Look for these debug messages:**
```
[CodeChroma Debug] Extension activated
[CodeChroma Debug] Audio engine initialized successfully
[CodeChroma Debug] Performing analysis for: [filename]
[CodeChroma Debug] Complexity calculated: [number]
[CodeChroma Debug] Playing audio for complexity: [frequency]
[CodeChroma Debug] Applying theme for complexity: [number]
```

### Step 5: Manual Commands
Test these commands via `Ctrl+Shift+P`:
- **"CodeChroma: Test Audio"** → Should play test tone
- **"CodeChroma: Reset Theme"** → Should clear theme and restart
- **"CodeChroma: Toggle Audio Feedback"** → Should enable/disable audio

### Step 6: Status Bar
Check bottom status bar:
- **Left side**: Should show health score (e.g., "CodeChroma: 75 (C)")
- **Right side**: Should show "🔊 Audio" (enabled) or "🔇 Audio" (disabled)

## 🎯 Expected Behavior

**When working correctly:**
- Opening complex files triggers both red workspace theme AND audio tones
- Different complexity levels produce different colors and pitches
- Status bar updates with health scores
- Debug logs show successful analysis and audio playback

**If something's wrong:**
- Check Extension Host logs for error messages
- Try the "Reset Theme" command
- Try "Test Audio" to isolate audio issues
- Look for any error popups in VS Code

## 🔧 Troubleshooting

**Red screen stuck**: Run "CodeChroma: Reset Theme"
**No audio but test works**: Check if analysis is running (open .ts/.js files)
**No analysis**: Make sure you're opening TypeScript/JavaScript files

The extension should now provide both visual workspace tinting AND audio feedback as you work with code of different complexity levels!