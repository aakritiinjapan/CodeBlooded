# Requirements Document

## Introduction

This specification defines enhancements to transform CodeChroma from a complexity-feedback system into a true psychological horror coding experience. The focus shifts from predictable error-based responses to unpredictable, randomized horror events that create genuine unease and tension while coding.

### Safety and Ethics Statement

This extension is designed as an **opt-in horror experience** for entertainment purposes. User safety is paramount:

- **Photosensitivity Warning**: Contains flashing lights and rapid visual changes that may trigger seizures in individuals with photosensitive epilepsy
- **Psychological Content**: Includes disturbing imagery, jump scares, and unsettling effects designed to create genuine fear
- **Accessibility First**: Respects system accessibility settings and provides immediate disable mechanisms
- **Informed Consent**: Users must explicitly opt-in after viewing warnings
- **Panic Button**: One-keypress emergency disable for immediate relief
- **No Permanent Changes**: All effects are temporary and reversible; actual code is never harmed

This extension is **NOT recommended** for users with:
- Photosensitive epilepsy or seizure disorders
- Anxiety disorders or PTSD
- Heart conditions sensitive to sudden stress
- Anyone who prefers a calm coding environment

## Glossary

- **Horror System**: The collection of visual, audio, and behavioral effects that create the psychological horror experience
- **Random Event Engine**: System that triggers horror effects at unpredictable intervals based on configurable probability
- **Jumpscare Popup**: Full-screen webview panel displaying disturbing imagery with synchronized audio
- **Typing Session**: Period of active code editing, tracked from first keystroke to 5 seconds of inactivity
- **Horror Intensity**: Configurable scale (0-100) determining frequency and severity of horror events
- **Screen Distortion**: Visual effects including shake, glitch, VHS artifacts, and chromatic aberration
- **Entity Presence**: Subtle indicators suggesting something is "watching" or "following" the user
- **Phantom Event**: Brief, unsettling occurrence that appears and disappears quickly (typing, variable changes, cursor effects)

## Requirements

### Requirement 1: Random Jumpscare System

**User Story:** As a developer using CodeChroma, I want to experience unpredictable horror jumpscares while coding, so that the experience feels genuinely unsettling rather than just error feedback.

#### Acceptance Criteria

1. WHEN the user is actively typing code, THE Horror System SHALL randomly trigger jumpscare popups at unpredictable intervals
2. WHEN a jumpscare is triggered, THE Horror System SHALL select from a pool of 4-6 different scary popup variants
3. WHEN a jumpscare popup appears, THE Horror System SHALL display it for 3-5 seconds with synchronized horror audio
4. WHEN a jumpscare has been shown, THE Horror System SHALL enforce a minimum cooldown period of 30-120 seconds before the next jumpscare
5. WHERE the user has configured horror intensity to "high", THE Horror System SHALL increase jumpscare frequency by 50%

### Requirement 2: Diverse Jumpscare Variants

**User Story:** As a developer experiencing horror effects, I want multiple different scary popups, so that the experience doesn't become predictable or repetitive.

#### Acceptance Criteria

1. THE Horror System SHALL implement at least 5 distinct jumpscare popup variants with unique visuals
2. WHEN selecting a jumpscare variant, THE Horror System SHALL use weighted randomization to prevent immediate repetition
3. THE Horror System SHALL include the following jumpscare types:
   - Realistic horror face (existing critical popup)
   - Glitching skull with distortion effects
   - Creeping shadow figure approaching screen
   - Multiple watching eyes appearing gradually
   - Static TV screen with brief disturbing image flash
4. WHEN a jumpscare variant is displayed, THE Horror System SHALL play a unique audio file matched to that variant
5. THE Horror System SHALL track the last 3 shown jumpscares to avoid showing the same one consecutively

### Requirement 3: Screen Distortion Effects

**User Story:** As a developer coding with CodeChroma, I want subtle screen distortions during high complexity, so that the environment feels increasingly unstable and unsettling.

#### Acceptance Criteria

1. WHEN code complexity exceeds medium level, THE Horror System SHALL apply subtle screen shake effects
2. WHEN code complexity reaches high level, THE Horror System SHALL add VHS-style scan lines and tracking errors
3. WHEN code complexity reaches critical level, THE Horror System SHALL apply chromatic aberration (RGB channel separation)
4. THE Horror System SHALL implement screen shake with randomized intensity between 2-8 pixels
5. THE Horror System SHALL apply glitch effects at random intervals (every 5-15 seconds) during high complexity

### Requirement 4: Progressive Horror Escalation

**User Story:** As a developer in a coding session, I want horror intensity to gradually increase over time, so that the experience builds tension rather than starting at maximum intensity.

#### Acceptance Criteria

1. WHEN a new coding session begins, THE Horror System SHALL initialize horror intensity at 20%
2. WHILE the user continues coding, THE Horror System SHALL increase intensity by 5% every 2 minutes
3. WHEN horror intensity reaches 100%, THE Horror System SHALL maintain maximum intensity until session ends
4. WHEN the user stops coding for 5 minutes, THE Horror System SHALL reset intensity to 20%
5. THE Horror System SHALL adjust jumpscare frequency based on current intensity level (20% = rare, 100% = frequent)

### Requirement 5: Entity Presence Indicators

**User Story:** As a developer experiencing psychological horror, I want subtle hints that something is "watching" me, so that I feel a persistent sense of unease.

#### Acceptance Criteria

1. WHEN horror intensity exceeds 40%, THE Horror System SHALL randomly display eye icons (👁️) in the editor gutter
2. WHEN an eye icon is displayed, THE Horror System SHALL move it to a different line after 2-5 seconds
3. THE Horror System SHALL limit eye icons to maximum 3 visible at once
4. WHEN the user's cursor approaches an eye icon, THE Horror System SHALL move the eye to a different location
5. WHEN horror intensity reaches 80%, THE Horror System SHALL increase eye icon frequency by 200%

### Requirement 6: Phantom Typing Events

**User Story:** As a developer coding, I want to occasionally see characters appear or disappear as if someone else is typing, so that I experience genuine unease about control over my code.

#### Acceptance Criteria

1. WHEN horror intensity exceeds 50%, THE Horror System SHALL randomly trigger phantom typing events
2. WHEN a phantom typing event occurs, THE Horror System SHALL insert 1-3 random characters at cursor position
3. WHEN phantom characters are inserted, THE Horror System SHALL remove them after 0.5-1.5 seconds
4. THE Horror System SHALL store original document state before phantom typing to ensure safe restoration
5. THE Horror System SHALL limit phantom typing to maximum once per 60 seconds to avoid disruption

### Requirement 7: Whispering Variables Effect

**User Story:** As a developer hovering over variables, I want to occasionally see disturbing alternative names, so that the code feels "corrupted" or "possessed".

#### Acceptance Criteria

1. WHEN horror intensity exceeds 60%, THE Horror System SHALL randomly apply whispering variable decorations
2. WHEN a variable is selected for whispering, THE Horror System SHALL overlay a creepy alternative name using decorations
3. THE Horror System SHALL display whispering overlays for 1-3 seconds before fading
4. THE Horror System SHALL use a predefined list of unsettling variable names (e.g., "watchingYou", "theyKnow", "noEscape")
5. THE Horror System SHALL apply whispering effect to maximum 2 variables simultaneously

### Requirement 8: Context-Aware Horror Triggers

**User Story:** As a developer typing specific keywords, I want special horror effects to trigger, so that the IDE feels "aware" of what I'm writing.

#### Acceptance Criteria

1. WHEN the user types keywords from a predefined horror list, THE Horror System SHALL detect them in real-time
2. THE Horror System SHALL include the following trigger keywords: "kill", "dead", "death", "error", "fatal", "crash", "destroy"
3. WHEN a trigger keyword is typed, THE Horror System SHALL have a 30% chance to trigger a special effect
4. THE Horror System SHALL implement keyword-specific effects (e.g., "kill" triggers blood drip, "dead" triggers skull flash)
5. THE Horror System SHALL enforce a 20-second cooldown between keyword-triggered effects

### Requirement 9: Time Dilation Effects

**User Story:** As a developer experiencing high horror intensity, I want UI animations to feel "wrong", so that the environment feels increasingly unstable.

#### Acceptance Criteria

1. WHEN horror intensity exceeds 70%, THE Horror System SHALL randomly alter animation speeds
2. THE Horror System SHALL slow cursor blink rate by 50-150% during time dilation events
3. THE Horror System SHALL speed up decoration animations by 150-300% during critical moments
4. WHEN a time dilation event occurs, THE Horror System SHALL maintain altered speed for 5-10 seconds
5. THE Horror System SHALL restore normal animation speeds after time dilation ends

### Requirement 10: User Configuration Controls

**User Story:** As a developer using CodeChroma, I want to control horror intensity and enable/disable specific effects, so that I can customize the experience to my comfort level.

#### Acceptance Criteria

1. THE Horror System SHALL provide a configuration setting for horror intensity (0-100 scale)
2. THE Horror System SHALL provide toggle settings for each major effect category (jumpscares, screen effects, phantom events, entity presence)
3. WHEN horror intensity is set to 0, THE Horror System SHALL disable all random horror events
4. THE Horror System SHALL provide a "safe mode" toggle that disables all psychological horror features
5. THE Horror System SHALL persist user configuration settings across VS Code sessions

### Requirement 11: Random Event Engine

**User Story:** As the Horror System, I need a robust randomization engine, so that horror events feel truly unpredictable and organic.

#### Acceptance Criteria

1. THE Horror System SHALL implement a weighted random selection algorithm for event types
2. THE Horror System SHALL track event history to prevent repetitive patterns
3. THE Horror System SHALL calculate event probability based on horror intensity, time since last event, and user activity
4. THE Horror System SHALL implement exponential backoff for event cooldowns to create unpredictable timing
5. THE Horror System SHALL use cryptographically secure random number generation for true unpredictability

### Requirement 12: Safe State Management

**User Story:** As a developer, I want all horror effects to be completely reversible, so that my actual code is never permanently affected.

#### Acceptance Criteria

1. WHEN any phantom event modifies document content, THE Horror System SHALL store the original state before modification
2. THE Horror System SHALL automatically restore original state within 2 seconds of any phantom modification
3. IF restoration fails, THE Horror System SHALL log an error and disable phantom events for the session
4. THE Horror System SHALL never modify saved files on disk, only in-memory document state
5. THE Horror System SHALL provide an emergency "restore all" command to undo any stuck effects

### Requirement 13: User Safety and Accessibility

**User Story:** As a user with photosensitivity or accessibility needs, I want clear warnings and safety controls, so that I can use the extension without health risks.

#### Acceptance Criteria

1. WHEN the extension is first activated, THE Horror System SHALL display a warning about flashing content and photosensitivity risks
2. THE Horror System SHALL provide a "Panic Button" command that instantly disables all horror effects with a single keypress
3. THE Horror System SHALL respect VS Code's accessibility settings and reduce motion when "Reduce Motion" is enabled
4. WHEN "Reduce Motion" is enabled, THE Horror System SHALL disable screen shake, rapid flashing, and fast animations
5. THE Horror System SHALL provide a clear description in the extension marketplace warning about horror content
6. THE Horror System SHALL limit flash frequency to maximum 3 flashes per second to reduce seizure risk
7. WHEN the panic button is activated, THE Horror System SHALL display a confirmation message and remain disabled until manually re-enabled

### Requirement 14: Core Functionality Preservation

**User Story:** As a developer, I want horror effects to enhance but never break my coding workflow, so that I can still work productively.

#### Acceptance Criteria

1. THE Horror System SHALL never block or delay user input to the editor
2. THE Horror System SHALL never interfere with IntelliSense, autocomplete, or code navigation features
3. WHEN a horror effect is active, THE Horror System SHALL allow the user to continue typing without interruption
4. THE Horror System SHALL automatically pause all effects during debugging sessions
5. THE Horror System SHALL respect VS Code's focus mode and disable effects when focus mode is active
6. WHEN the user is presenting or screen sharing, THE Horror System SHALL detect this and disable effects automatically

### Requirement 15: Hidden Easter Eggs

**User Story:** As a curious developer, I want to discover hidden horror elements through exploration, so that the experience has depth and replayability.

#### Acceptance Criteria

1. THE Horror System SHALL implement at least 5 hidden easter eggs that trigger under specific conditions
2. WHEN the user types a specific code pattern (e.g., "const nightmare = true;"), THE Horror System SHALL trigger a unique easter egg effect
3. THE Horror System SHALL include a "secret jumpscare" that only appears after 6 hours of cumulative coding time
4. WHEN the user opens a file at exactly midnight (system time), THE Horror System SHALL trigger a special "witching hour" effect
5. THE Horror System SHALL hide cryptic messages in hover tooltips that appear randomly (1% chance)
6. WHEN the user discovers an easter egg, THE Horror System SHALL track it and display a hidden achievement notification
7. THE Horror System SHALL implement a "konami code" equivalent (specific key sequence) that unlocks maximum horror mode

### Requirement 16: Extension Onboarding and Communication

**User Story:** As a new user of CodeChroma, I want clear information about what the extension does, so that I can make an informed decision about enabling horror features.

#### Acceptance Criteria

1. WHEN the extension is installed, THE Horror System SHALL display a welcome message explaining the horror theme
2. THE Horror System SHALL provide a first-run tutorial showing how to enable/disable effects and use the panic button
3. THE Horror System SHALL include clear documentation about photosensitivity warnings in the README
4. THE Horror System SHALL display the panic button keyboard shortcut prominently in the welcome message
5. THE Horror System SHALL default to "safe mode" (horror disabled) on first install, requiring explicit opt-in

### Requirement 17: Theme and Configuration Compatibility

**User Story:** As a developer using different VS Code themes, I want horror effects to work correctly regardless of my theme choice, so that the experience is consistent.

#### Acceptance Criteria

1. THE Horror System SHALL detect the current VS Code theme (light/dark/high contrast)
2. WHEN a light theme is active, THE Horror System SHALL adjust horror colors to maintain visibility and impact
3. THE Horror System SHALL test compatibility with at least 5 popular VS Code themes
4. WHEN high contrast mode is enabled, THE Horror System SHALL increase contrast of horror effects by 50%
5. THE Horror System SHALL preserve user's original theme settings when horror effects are disabled
