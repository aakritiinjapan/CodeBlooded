# Safety Manager Testing Guide

This guide provides step-by-step instructions to manually test all safety features implemented in Task 1.

## Prerequisites

1. Build the extension: `npm run build` in `packages/vscode-extension`
2. Open the extension in VS Code Extension Development Host (F5)
3. Have a TypeScript or JavaScript file open for testing

## Test 1: First-Run Warning Dialog

**Objective**: Verify the photosensitivity warning appears on first activation

### Steps:
1. Clear extension storage:
   - Close VS Code
   - Delete: `%APPDATA%\Code\User\globalStorage\<publisher>.<extension-name>`
   - Or use: `context.globalState.update('codechroma.hasSeenHorrorWarning', undefined)`

2. Restart VS Code with extension

3. Open a TypeScript/JavaScript file

### Expected Results:
- ✅ Warning dialog appears with photosensitivity notice
- ✅ Dialog shows three options: "Enable Horror Features", "Stay in Safe Mode", "Learn More"
- ✅ "Learn More" shows additional information and re-prompts
- ✅ "Enable Horror Features" enables horror mode and closes dialog
- ✅ "Stay in Safe Mode" keeps safe mode active
- ✅ Dialog does NOT appear on subsequent activations

### Pass Criteria:
- [ ] Warning appears on first run only
- [ ] All three buttons work correctly
- [ ] User choice is persisted across sessions

---

## Test 2: Panic Button (Ctrl+Shift+Escape)

**Objective**: Verify panic button instantly disables all horror effects

### Steps:
1. Enable horror features (if in safe mode):
   - Command Palette → "CodeChroma: Toggle Safe Mode"
   - Or set `codechroma.horror.enabled` to `true`

2. Verify horror is enabled:
   - Check configuration: `codechroma.horror.enabled` should be `true`

3. Press panic button:
   - Windows/Linux: `Ctrl+Shift+Escape`
   - Mac: `Cmd+Shift+Escape`

### Expected Results:
- ✅ Modal dialog appears: "🛡️ SAFE MODE ACTIVATED"
- ✅ Message explains all horror effects are disabled
- ✅ Status bar shows: "$(shield) CodeChroma: Safe Mode Active" (for 5 seconds)
- ✅ Configuration `codechroma.horror.enabled` is set to `false`
- ✅ Safe mode persists after VS Code restart

### Pass Criteria:
- [ ] Panic button activates instantly
- [ ] Confirmation message appears
- [ ] Safe mode is enabled
- [ ] State persists across restarts

---

## Test 3: Panic Button via Command Palette

**Objective**: Verify panic button works via command palette

### Steps:
1. Enable horror features

2. Open Command Palette (`Ctrl+Shift+P`)

3. Type: "CodeChroma: Panic Button"

4. Execute command

### Expected Results:
- ✅ Same behavior as keyboard shortcut
- ✅ Safe mode activated
- ✅ Confirmation dialog appears

### Pass Criteria:
- [ ] Command palette method works identically to keyboard shortcut

---

## Test 4: Safe Mode Toggle

**Objective**: Verify safe mode can be toggled on/off

### Steps:
1. Open Command Palette

2. Execute: "CodeChroma: Toggle Safe Mode"

3. If currently in safe mode:
   - ✅ Warning dialog appears asking to enable horror
   - ✅ "Enable" button enables horror features
   - ✅ "Cancel" button keeps safe mode active

4. If currently NOT in safe mode:
   - ✅ Safe mode is enabled immediately
   - ✅ Confirmation message appears

### Expected Results:
- ✅ Toggle works in both directions
- ✅ Appropriate warnings shown when enabling horror
- ✅ Configuration updates correctly

### Pass Criteria:
- [ ] Can toggle from safe to horror mode
- [ ] Can toggle from horror to safe mode
- [ ] Warnings appear when appropriate

---

## Test 5: Accessibility Detection - Reduce Motion

**Objective**: Verify extension detects and respects Reduce Motion setting

### Steps:
1. Enable horror features (exit safe mode)

2. Open VS Code Settings (`Ctrl+,`)

3. Search for: "reduce motion"

4. Enable: `workbench.reduceMotion`

### Expected Results:
- ✅ Notification appears: "CodeChroma: Reduce Motion detected. Screen shake and rapid animations will be disabled."
- ✅ `safetyManager.getAccessibilityState().reduceMotion` returns `true`
- ✅ `safetyManager.shouldDisableScreenShake()` returns `true`
- ✅ `safetyManager.shouldDisableRapidAnimations()` returns `true`

### Pass Criteria:
- [ ] Reduce Motion is detected
- [ ] User is notified
- [ ] Appropriate effects are disabled

---

## Test 6: Accessibility Detection - High Contrast

**Objective**: Verify extension detects high contrast themes

### Steps:
1. Open Command Palette

2. Execute: "Preferences: Color Theme"

3. Select a high contrast theme (e.g., "High Contrast" or "High Contrast Light")

### Expected Results:
- ✅ Notification appears: "CodeChroma: High Contrast mode detected. Horror effects will be adjusted for visibility."
- ✅ `safetyManager.getAccessibilityState().highContrast` returns `true`

### Pass Criteria:
- [ ] High contrast theme is detected
- [ ] User is notified
- [ ] Effects are adjusted (implementation in future tasks)

---

## Test 7: Screen Sharing Mode

**Objective**: Verify screen sharing mode disables effects

### Steps:
1. Enable horror features

2. Open VS Code Settings

3. Add to settings.json:
   ```json
   "codechroma.safety.screenSharingMode": true
   ```

4. Check effect status

### Expected Results:
- ✅ `safetyManager.detectScreenSharing()` returns `true`
- ✅ `safetyManager.shouldDisableEffects()` returns `true`
- ✅ Horror effects are disabled (verified in future tasks)

### Pass Criteria:
- [ ] Screen sharing mode is detected from configuration
- [ ] Effects are disabled when active

---

## Test 8: Configuration Persistence

**Objective**: Verify safe mode state persists across sessions

### Steps:
1. Enable horror features (exit safe mode)

2. Verify: `codechroma.horror.enabled` is `true`

3. Close VS Code completely

4. Reopen VS Code

5. Check configuration

### Expected Results:
- ✅ Horror features remain enabled
- ✅ `codechroma.horror.enabled` is still `true`
- ✅ No warning dialog appears (already seen)

### Repeat with Safe Mode:
1. Activate panic button

2. Close VS Code

3. Reopen VS Code

### Expected Results:
- ✅ Safe mode remains active
- ✅ `codechroma.horror.enabled` is `false`

### Pass Criteria:
- [ ] Horror enabled state persists
- [ ] Safe mode state persists
- [ ] No unexpected warnings on restart

---

## Test 9: Default State (New Installation)

**Objective**: Verify extension defaults to safe mode

### Steps:
1. Simulate fresh installation:
   - Clear all extension storage
   - Clear configuration

2. Activate extension

3. Check initial state

### Expected Results:
- ✅ `codechroma.horror.enabled` defaults to `false`
- ✅ Safe mode is active by default
- ✅ First-run warning appears
- ✅ User must explicitly opt-in to horror features

### Pass Criteria:
- [ ] Safe mode is default
- [ ] No horror effects without opt-in
- [ ] Warning appears before any horror

---

## Test 10: SafetyManager Event Emission

**Objective**: Verify SafetyManager emits events correctly

### Steps:
1. Add test listener in extension.ts:
   ```typescript
   safetyManager.onSafeModeChanged(isSafe => {
     console.log('[Test] Safe mode changed:', isSafe);
     vscode.window.showInformationMessage(`Safe mode: ${isSafe}`);
   });
   ```

2. Toggle safe mode multiple times

### Expected Results:
- ✅ Event fires when entering safe mode (`true`)
- ✅ Event fires when exiting safe mode (`false`)
- ✅ Console logs show correct state
- ✅ Notifications appear with correct state

### Pass Criteria:
- [ ] Events fire on state changes
- [ ] Event payload is correct
- [ ] Listeners receive notifications

---

## Test 11: Multiple Accessibility Settings

**Objective**: Verify multiple accessibility settings work together

### Steps:
1. Enable Reduce Motion

2. Switch to High Contrast theme

3. Enable Screen Reader support

4. Check accessibility state

### Expected Results:
- ✅ All three settings detected correctly
- ✅ `getAccessibilityState()` returns:
  ```typescript
  {
    reduceMotion: true,
    highContrast: true,
    screenReaderOptimized: true
  }
  ```

### Pass Criteria:
- [ ] All accessibility settings detected
- [ ] No conflicts between settings
- [ ] Appropriate effects disabled

---

## Test 12: Keybinding Conflict Resolution

**Objective**: Verify panic button keybinding doesn't conflict

### Steps:
1. Check existing keybindings:
   - Open: Preferences → Keyboard Shortcuts
   - Search: `Ctrl+Shift+Escape`

2. Verify CodeChroma panic button is registered

3. Test if any conflicts exist

### Expected Results:
- ✅ Panic button keybinding is registered
- ✅ No conflicts with other extensions
- ✅ Keybinding works in editor context

### Pass Criteria:
- [ ] Keybinding is registered
- [ ] No conflicts detected
- [ ] Works when editor has focus

---

## Regression Tests

After completing all tests above, verify:

1. **Existing Features Still Work**:
   - [ ] Audio feedback plays correctly
   - [ ] Visual decorations appear
   - [ ] Status bar updates
   - [ ] AST graph renders

2. **No Performance Degradation**:
   - [ ] Extension activates quickly
   - [ ] No noticeable lag when typing
   - [ ] Memory usage is reasonable

3. **No Console Errors**:
   - [ ] Check Developer Tools console
   - [ ] No errors or warnings related to SafetyManager
   - [ ] All logs are informational

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. First-Run Warning | ⬜ | |
| 2. Panic Button (Keyboard) | ⬜ | |
| 3. Panic Button (Command) | ⬜ | |
| 4. Safe Mode Toggle | ⬜ | |
| 5. Reduce Motion Detection | ⬜ | |
| 6. High Contrast Detection | ⬜ | |
| 7. Screen Sharing Mode | ⬜ | |
| 8. Configuration Persistence | ⬜ | |
| 9. Default State | ⬜ | |
| 10. Event Emission | ⬜ | |
| 11. Multiple Accessibility | ⬜ | |
| 12. Keybinding Conflicts | ⬜ | |

**Overall Status**: ⬜ Not Started / 🟡 In Progress / ✅ Passed / ❌ Failed

---

## Debugging Tips

### View SafetyManager State
Add to Command Palette:
```typescript
vscode.commands.registerCommand('codechroma.debugSafety', () => {
  const state = {
    safeMode: safetyManager.isSafeModeActive(),
    accessibility: safetyManager.getAccessibilityState(),
    shouldDisable: safetyManager.shouldDisableEffects(),
    screenSharing: safetyManager.detectScreenSharing()
  };
  console.log('[SafetyManager Debug]', state);
  vscode.window.showInformationMessage(JSON.stringify(state, null, 2), { modal: true });
});
```

### Check Global State
```typescript
const hasSeenWarning = context.globalState.get('codechroma.hasSeenHorrorWarning');
const safeMode = context.globalState.get('codechroma.safeMode');
console.log({ hasSeenWarning, safeMode });
```

### Monitor Events
```typescript
safetyManager.onSafeModeChanged(isSafe => {
  console.log('[SafetyManager] Mode changed:', isSafe ? 'SAFE' : 'HORROR');
});
```

---

## Sign-Off

**Tester**: ___________________  
**Date**: ___________________  
**Build Version**: ___________________  
**Result**: ⬜ Pass / ⬜ Fail  

**Notes**:
