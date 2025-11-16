# CodeChroma Safety Features

## Overview

CodeChroma includes comprehensive safety features to protect users from potential harm while experiencing psychological horror effects.

## Safety Manager

The `SafetyManager` class is the core safety system that ensures user protection through:

### 1. First-Run Warning Dialog

**When**: Displayed on first activation of the extension
**Purpose**: Inform users about photosensitivity risks and horror content

The warning includes:
- ⚠️ Photosensitivity warning for flashing lights
- List of conditions where horror features are NOT recommended
- Clear explanation of safety features
- Option to enable or stay in safe mode
- "Learn More" option for additional information

**User Choices**:
- "Enable Horror Features" - Opts into horror experience
- "Stay in Safe Mode" - Keeps all horror effects disabled
- "Learn More" - Shows additional safety information

### 2. Panic Button (Ctrl+Shift+Escape)

**Purpose**: Instant emergency disable of all horror effects

**How to Use**:
- Press `Ctrl+Shift+Escape` (Windows/Linux)
- Press `Cmd+Shift+Escape` (Mac)
- Or use Command Palette: "CodeChroma: Panic Button"

**What It Does**:
- Immediately enters safe mode
- Disables all horror effects
- Shows confirmation message
- Updates status bar with shield icon
- Persists safe mode across sessions

### 3. Safe Mode

**Default State**: ENABLED (for safety)
**Purpose**: Completely disable all psychological horror features

**How to Toggle**:
- Command Palette: "CodeChroma: Toggle Safe Mode"
- Panic button automatically enables it
- Configuration: `codechroma.horror.enabled`

**When Active**:
- No jumpscares
- No random horror events
- No phantom typing
- No screen distortions
- No entity presence
- Standard CodeChroma complexity feedback only

### 4. Accessibility Detection

The SafetyManager automatically detects and respects system accessibility settings:

#### Reduce Motion
- **Detected From**: `workbench.reduceMotion` setting
- **Effect**: Disables screen shake and rapid animations
- **Notification**: User is informed when detected

#### High Contrast Mode
- **Detected From**: Active color theme
- **Effect**: Adjusts horror effects for better visibility
- **Notification**: User is informed when detected

#### Screen Reader Optimization
- **Detected From**: `editor.accessibilitySupport` setting
- **Effect**: Optimizes for screen reader users

### 5. Screen Sharing Detection

**Purpose**: Prevent horror effects during presentations or screen sharing

**How to Enable**:
- Configuration: `codechroma.safety.screenSharingMode`
- Set to `true` when screen sharing

**Effect**: Automatically disables all horror effects

### 6. Configuration Options

All safety features can be controlled through VS Code settings:

```json
{
  // Main horror toggle (default: false for safety)
  "codechroma.horror.enabled": false,
  
  // Horror intensity (0-100)
  "codechroma.horror.intensity": 50,
  
  // Screen sharing mode
  "codechroma.safety.screenSharingMode": false,
  
  // Respect Reduce Motion setting
  "codechroma.safety.respectReduceMotion": true
}
```

## Safety Checks

The SafetyManager provides methods to check if effects should be disabled:

- `shouldDisableEffects()` - Overall check for safe mode and screen sharing
- `shouldDisableScreenShake()` - Specific check for motion effects
- `shouldDisableRapidAnimations()` - Check for fast animations
- `shouldDisableFlashing()` - Check for flashing effects

## Events

The SafetyManager emits events that other components can listen to:

- `onSafeModeChanged` - Fired when safe mode is toggled

## Implementation Details

### State Persistence

Safe mode state is persisted in VS Code's global state:
- Key: `codechroma.safeMode`
- Default: `true` (safe by default)
- Survives VS Code restarts

### First-Run Tracking

First-run warning is tracked to avoid repeated prompts:
- Key: `codechroma.hasSeenHorrorWarning`
- Set to `true` after first display
- User must explicitly opt-in to horror features

### Accessibility Monitoring

The SafetyManager continuously monitors for accessibility setting changes:
- Configuration changes
- Theme changes (for high contrast detection)
- Notifies user when accessibility features are detected

## Testing Safety Features

### Manual Testing

1. **First-Run Warning**:
   - Clear global state: Delete VS Code storage
   - Restart extension
   - Verify warning appears
   - Test all three options

2. **Panic Button**:
   - Enable horror features
   - Press Ctrl+Shift+Escape
   - Verify immediate disable
   - Check confirmation message
   - Verify persistence across reload

3. **Accessibility Detection**:
   - Enable "Reduce Motion" in VS Code settings
   - Verify notification appears
   - Check that screen shake is disabled
   - Switch to high contrast theme
   - Verify notification and adjustments

4. **Screen Sharing Mode**:
   - Enable `codechroma.safety.screenSharingMode`
   - Verify all horror effects are disabled
   - Disable setting
   - Verify effects resume (if horror enabled)

### Automated Testing

See `test/safetyManager.test.ts` for unit tests covering:
- Safe mode toggling
- Accessibility detection
- Panic button activation
- Configuration persistence

## User Communication

### Status Bar Indicators

When safe mode is active:
- Shield icon (🛡️) appears in status bar
- Message: "CodeChroma: Safe Mode Active"

### Notifications

Users receive notifications for:
- Panic button activation
- Safe mode changes
- Accessibility feature detection
- First-run warnings

## Best Practices

1. **Always Default to Safe**: Safe mode is enabled by default
2. **Explicit Opt-In**: Users must explicitly enable horror features
3. **Easy Escape**: Panic button is always available
4. **Respect Accessibility**: Honor system accessibility settings
5. **Clear Communication**: Provide clear warnings and instructions
6. **Persistent State**: Remember user's safety preferences

## Support

If users experience issues with safety features:
1. Use panic button (Ctrl+Shift+Escape)
2. Check Command Palette for "CodeChroma: Toggle Safe Mode"
3. Manually set `codechroma.horror.enabled` to `false` in settings
4. Report issues on GitHub with safety concerns prioritized
