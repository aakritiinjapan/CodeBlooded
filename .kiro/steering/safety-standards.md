---
inclusion: always
---

# Safety Standards for CodeChroma

## Core Safety Principles

CodeChroma is a horror-themed code analysis extension that prioritizes user safety above all else. These standards apply to all development work on this project.

## Mandatory Safety Requirements

### 1. Photosensitivity Protection

- **Flash Frequency Limit**: NEVER exceed 3 flashes per second
- **Reduce Motion**: ALWAYS respect system accessibility settings
- **Warning Dialogs**: Display photosensitivity warnings before enabling horror features
- **Panic Button**: Provide instant disable mechanism (Ctrl+Alt+S)

### 2. Code Safety

- **No Permanent Changes**: Horror effects MUST be reversible
- **State Management**: Always store original state before phantom modifications
- **Restoration Guarantee**: Restore original state within 2 seconds
- **Disk Safety**: NEVER modify saved files on disk, only in-memory state

### 3. User Control

- **Opt-In Only**: Horror features MUST be disabled by default
- **Granular Controls**: Allow users to disable individual effect categories
- **Safe Mode**: Provide one-click disable for all horror effects
- **Screen Sharing Detection**: Auto-disable effects during presentations

### 4. Accessibility Compliance

- **Reduce Motion**: Disable screen shake, rapid animations when system setting enabled
- **High Contrast**: Increase effect contrast by 50% in high contrast mode
- **Focus Mode**: Respect VS Code focus mode and disable effects
- **Keyboard Navigation**: All controls accessible via keyboard

### 5. Performance Standards

- **Non-Blocking**: NEVER block user input to the editor
- **No Interference**: Don't interfere with IntelliSense, autocomplete, or navigation
- **Async Operations**: All analysis and effects run asynchronously
- **Resource Limits**: Monitor CPU/memory usage, throttle if excessive

## Development Guidelines

### When Implementing Horror Effects

1. **Test with accessibility settings enabled**
2. **Verify panic button works during effect**
3. **Measure flash frequency with automated tests**
4. **Test state restoration in failure scenarios**
5. **Document all safety mechanisms in code comments**

### Code Review Checklist

- [ ] Effect respects "Reduce Motion" setting
- [ ] Flash frequency ≤ 3Hz verified with property test
- [ ] Panic button tested and working
- [ ] Original state restoration verified
- [ ] No blocking operations in main thread
- [ ] Photosensitivity warning displayed to users

## Error Handling

- **Graceful Degradation**: If horror effect fails, disable it silently
- **User Notification**: Log errors but don't spam users with error dialogs
- **Emergency Restore**: Provide command to clear all stuck effects
- **Session Disable**: If multiple failures occur, disable horror for session

## Testing Requirements

All horror effects MUST have:

1. **Unit tests** for core logic
2. **Property-based tests** for safety properties
3. **Integration tests** for panic button
4. **Accessibility tests** with Reduce Motion enabled

## Compliance

These standards are non-negotiable. Any PR that violates safety standards will be rejected.

**Remember**: We're creating entertainment, not endangering users.
