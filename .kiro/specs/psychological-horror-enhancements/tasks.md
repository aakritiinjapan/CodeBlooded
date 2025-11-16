# Implementation Plan

This document outlines the implementation tasks for the psychological horror enhancements to CodeChroma. Tasks are organized to build incrementally, with core safety features first, followed by horror effects.

## Task List

- [x] 1. Implement Safety Manager and Core Infrastructure





  - Create SafetyManager class with panic button, warnings, and accessibility detection
  - Implement first-run warning dialog with photosensitivity notice
  - Add panic button command (Ctrl+Shift+Escape) that instantly disables all effects
  - Implement accessibility settings detection (Reduce Motion, High Contrast)
  - Add screen sharing detection to auto-disable effects
  - Create safe mode toggle in configuration
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.7, 16.1, 16.2, 16.4, 16.5_

- [-] 2. Build Random Event Engine



  - [-] 2.1 Create RandomEventEngine class with probability calculation system

    - Implement weighted random selection algorithm
    - Create event probability calculator based on intensity, time, and history
    - Implement exponential backoff for cooldown periods
    - Add cryptographically secure random number generation
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 2.2 Implement event history tracking and repetition prevention
    - Create EventRecord data structure
    - Track last 10 events with timestamps and types
    - Implement repetition penalty calculation
    - Add event type filtering to prevent consecutive duplicates
    - _Requirements: 11.2, 2.2, 2.5_
  
  - [ ] 2.3 Build event scheduling system with cooldown management
    - Implement min/max cooldown configuration
    - Create timer-based event scheduler
    - Add intensity-based frequency adjustment
    - Implement session-based event limits
    - _Requirements: 1.4, 11.4_

- [ ] 3. Create Horror Engine Core
  - [ ] 3.1 Implement HorrorEngine class as central coordinator
    - Create horror intensity state management (0-100 scale)
    - Implement session tracking (start time, active state)
    - Add user configuration loading and validation
    - Create effect manager registry
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 3.2 Implement progressive escalation system
    - Track session duration and calculate intensity increase
    - Implement 5% intensity increase every 2 minutes
    - Add intensity cap at 100%
    - Implement session reset after 5 minutes of inactivity
    - Adjust event frequencies based on current intensity
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 3.3 Integrate with existing extension activation
    - Hook into extension.ts activation
    - Initialize horror engine on extension start
    - Connect to document change events
    - Add typing activity detection
    - _Requirements: 1.1, 4.1_

- [ ] 4. Implement Enhanced Jumpscare System
  - [ ] 4.1 Refactor existing HorrorPopupManager for random triggers
    - Remove error-based trigger logic
    - Add random trigger method called by event engine
    - Implement variant selection system
    - Update cooldown to use RandomEventEngine
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 4.2 Create 5 new jumpscare variants with HTML/CSS
    - Implement "Glitching Skull" variant with RGB separation and static
    - Implement "Shadow Figure" variant with zoom and blur
    - Implement "Watching Eyes" variant with multiple eyes appearing
    - Implement "Static TV Flash" variant with brief disturbing image
    - Implement "Creeping Hands" variant with hands from screen edges
    - _Requirements: 2.1, 2.3_
  
  - [ ] 4.3 Add audio files for each jumpscare variant
    - Create/source distorted scream audio for glitching skull
    - Create/source heavy breathing audio for shadow figure
    - Create/source whisper layer audio for watching eyes
    - Create/source white noise audio for static TV
    - Create/source scratching sound for creeping hands
    - Update LocalAudioEngine to support variant-specific audio
    - _Requirements: 2.4_
  
  - [ ] 4.4 Implement weighted random variant selection
    - Create JumpscareVariant interface with weight property
    - Implement weightedRandom() selection function
    - Add history tracking to prevent repetition
    - Exclude last 3 variants from selection pool
    - _Requirements: 2.2, 2.5_

- [ ] 5. Implement Screen Distortion Effects
  - [ ] 5.1 Create ScreenDistortionManager class
    - Set up transparent webview overlay system
    - Implement effect activation/deactivation methods
    - Add intensity-based effect selection
    - Create cleanup and disposal methods
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 5.2 Implement screen shake effect
    - Create CSS keyframe animations for shake
    - Implement configurable intensity (2-8 pixels)
    - Add randomized shake patterns
    - Trigger on high complexity or random events
    - _Requirements: 3.1, 3.4_
  
  - [ ] 5.3 Implement VHS distortion effect
    - Create scan line CSS overlay
    - Add tracking error animation
    - Implement color bleeding effect
    - Trigger at random intervals during high complexity
    - _Requirements: 3.2, 3.5_
  
  - [ ] 5.4 Implement chromatic aberration effect
    - Create RGB channel separation using CSS filters
    - Add configurable separation distance
    - Trigger during critical complexity
    - Combine with other glitch effects
    - _Requirements: 3.3_
  
  - [ ] 5.5 Implement general glitch effect
    - Create random horizontal line displacement
    - Add pixelation/blockiness effect
    - Implement brief color inversion
    - Trigger randomly during coding sessions
    - _Requirements: 3.5_

- [ ] 6. Implement Entity Presence System
  - [ ] 6.1 Create EntityPresenceManager class
    - Implement eye entity spawning system
    - Create eye tracking and movement logic
    - Add cursor proximity detection
    - Implement max 3 eyes limit
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 6.2 Create eye icon gutter decorations
    - Design eye emoji gutter icon (👁️)
    - Implement gutter decoration rendering
    - Add eye movement animation
    - Create fade-in/fade-out effects
    - _Requirements: 5.1, 5.2_
  
  - [ ] 6.3 Implement cursor avoidance behavior
    - Track cursor position changes
    - Calculate distance between cursor and eyes
    - Move eyes when cursor approaches (within 3 lines)
    - Select new random location away from cursor
    - _Requirements: 5.4_
  
  - [ ] 6.4 Add intensity-based eye frequency
    - Spawn eyes only when intensity > 40%
    - Increase spawn rate at 80% intensity
    - Implement random spawn timing (every 30-90 seconds)
    - _Requirements: 5.1, 5.5_

- [ ] 7. Implement Phantom Typing System
  - [ ] 7.1 Create PhantomTypingManager with safe state management
    - Implement PhantomState interface for tracking changes
    - Create document state backup before modifications
    - Implement safe text insertion method
    - Create automatic restoration after 0.5-1.5 seconds
    - Add emergency restore all method
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 7.2 Implement phantom text generation
    - Create list of creepy phantom texts ("...", "help", "watching", etc.)
    - Implement random selection from list
    - Add 1-3 character insertion logic
    - Ensure text is visible but brief
    - _Requirements: 6.2_
  
  - [ ] 7.3 Add intensity-based triggering
    - Only trigger when intensity > 50%
    - Implement 60-second cooldown between events
    - Add random probability check (30% chance when eligible)
    - _Requirements: 6.1, 6.5_
  
  - [ ] 7.4 Implement error handling and failsafes
    - Wrap all edits in try-catch blocks
    - Log failures and disable phantom typing on error
    - Show user notification if restoration fails
    - Add session-based disable on repeated failures
    - _Requirements: 12.3, 12.5_

- [ ] 8. Implement Whispering Variables System
  - [ ] 8.1 Create WhisperingVariablesManager class
    - Create whisper mapping dictionary (user→victim, data→secrets, etc.)
    - Implement variable detection in visible editor range
    - Create decoration-based overlay system
    - Add expiration timing (1-3 seconds)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 8.2 Implement variable name detection
    - Use regex to find variable-like identifiers
    - Filter for variables in whisper mapping
    - Get position ranges for each match
    - Limit to visible editor range only
    - _Requirements: 7.2_
  
  - [ ] 8.3 Create whisper overlay decorations
    - Design CSS for creepy overlay text
    - Position whisper text over original variable
    - Add red/italic styling with opacity
    - Implement fade-in/fade-out animations
    - _Requirements: 7.2, 7.3_
  
  - [ ] 8.4 Add intensity-based triggering
    - Only trigger when intensity > 60%
    - Limit to max 2 simultaneous whispers
    - Implement random selection of target variables
    - Add cooldown between whisper events
    - _Requirements: 7.1, 7.5_

- [ ] 9. Implement Context-Aware Trigger System
  - [ ] 9.1 Create ContextTriggerManager class
    - Define trigger keyword list with associated effects
    - Implement text change event listener
    - Create cooldown tracking per keyword
    - Add 30% probability check for triggers
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 9.2 Implement keyword detection
    - Monitor last 20 characters of typed text
    - Check for keyword matches in real-time
    - Validate cooldown before triggering
    - Apply probability check (30% chance)
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ] 9.3 Create keyword-specific effects
    - "kill" → trigger blood drip in gutter
    - "dead" → trigger skull flash popup
    - "death" → trigger screen shake
    - "error" → trigger glitch effect
    - "fatal" → trigger chromatic aberration
    - "crash" → trigger VHS distortion
    - "destroy" → trigger shadow figure
    - _Requirements: 8.2, 8.4_
  
  - [ ] 9.4 Implement 20-second cooldown per keyword
    - Track last trigger time for each keyword
    - Enforce minimum 20-second gap
    - Reset cooldowns on session restart
    - _Requirements: 8.5_

- [ ] 10. Implement Time Dilation Effects
  - [ ] 10.1 Create TimeDilationManager class
    - Implement animation speed modification system
    - Track original animation speeds for restoration
    - Add random duration (5-10 seconds)
    - Create intensity-based triggering (>70%)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 10.2 Implement cursor blink rate modification
    - Access VS Code cursor blink rate setting
    - Slow blink rate by 50-150%
    - Apply modification via CSS or settings API
    - Restore original rate after duration
    - _Requirements: 9.2, 9.5_
  
  - [ ] 10.3 Implement decoration animation speed changes
    - Speed up decoration animations by 150-300%
    - Apply to blood drips, eyes, and other animated decorations
    - Use CSS animation-duration modification
    - Restore normal speeds after event
    - _Requirements: 9.3, 9.5_
  
  - [ ] 10.4 Add random triggering during high intensity
    - Trigger only when intensity > 70%
    - Implement random intervals (every 2-5 minutes)
    - Add probability check (20% chance when eligible)
    - _Requirements: 9.1, 9.4_

- [ ] 11. Implement Easter Egg System
  - [ ] 11.1 Create EasterEggManager class
    - Define easter egg registry with trigger conditions
    - Implement achievement tracking
    - Create unlock notification system
    - Add persistent storage for discovered eggs
    - _Requirements: 15.1, 15.6_
  
  - [ ] 11.2 Implement "Nightmare Constant" easter egg
    - Detect "const nightmare = true;" in code
    - Trigger special nightmare-themed jumpscare
    - Enable maximum horror intensity temporarily
    - Show achievement notification
    - _Requirements: 15.2_
  
  - [ ] 11.3 Implement "Witching Hour" easter egg
    - Check system time on file open
    - Trigger special effect at exactly midnight
    - Show ghostly overlay with clock imagery
    - Play eerie bell toll audio
    - _Requirements: 15.4_
  
  - [ ] 11.4 Implement "Cumulative Time Secret" easter egg
    - Track total coding time across sessions
    - Unlock secret jumpscare at 6 hours
    - Show rare "exhaustion" themed horror
    - Display achievement with time badge
    - _Requirements: 15.3, 15.6_
  
  - [ ] 11.5 Implement "Konami Code" easter egg
    - Create key sequence detector for arrow keys + B + A
    - Activate maximum horror mode on completion
    - Show special "unlocked" animation
    - Enable all effects at 100% intensity
    - _Requirements: 15.7_
  
  - [ ] 11.6 Implement cryptic tooltip messages
    - Add 1% chance to hover tooltips
    - Replace normal message with creepy alternative
    - Create list of unsettling messages
    - Ensure messages are brief and mysterious
    - _Requirements: 15.5_

- [ ] 12. Implement Configuration and User Controls
  - [ ] 12.1 Create comprehensive configuration schema
    - Define HorrorConfig interface in package.json
    - Add intensity slider (0-100)
    - Add feature toggle checkboxes
    - Add accessibility options
    - Add panic button key binding configuration
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 12.2 Implement configuration UI in VS Code settings
    - Create settings page with clear categories
    - Add descriptions for each setting
    - Include warnings for intensity levels
    - Add "Reset to Defaults" option
    - _Requirements: 10.1, 10.2_
  
  - [ ] 12.3 Implement safe mode toggle
    - Add prominent safe mode switch
    - Disable all horror effects when enabled
    - Show safe mode indicator in status bar
    - Default to safe mode on first install
    - _Requirements: 10.4, 13.7, 16.5_
  
  - [ ] 12.4 Add individual effect toggles
    - Toggle for jumpscares
    - Toggle for screen effects
    - Toggle for phantom events
    - Toggle for entity presence
    - Toggle for easter eggs
    - _Requirements: 10.2_
  
  - [ ] 12.5 Implement configuration persistence
    - Save settings to VS Code workspace/global config
    - Load settings on extension activation
    - Apply settings changes in real-time
    - Validate configuration values
    - _Requirements: 10.5_

- [ ] 13. Implement Accessibility and Safety Features
  - [ ] 13.1 Implement Reduce Motion detection and compliance
    - Check VS Code accessibility settings on startup
    - Monitor for setting changes during session
    - Disable screen shake when Reduce Motion is enabled
    - Disable rapid animations and flashing
    - Show notification when effects are reduced
    - _Requirements: 13.3, 13.4, 14.5_
  
  - [ ] 13.2 Implement flash frequency limiting
    - Track flash events per second
    - Enforce maximum 3 flashes per second
    - Queue or skip flashes that exceed limit
    - Log violations for debugging
    - _Requirements: 13.6_
  
  - [ ] 13.3 Implement screen sharing detection
    - Detect when VS Code window is being shared
    - Automatically disable all horror effects
    - Show notification to user
    - Re-enable when sharing stops
    - _Requirements: 14.6_
  
  - [ ] 13.4 Implement focus mode detection
    - Detect when VS Code focus mode is active
    - Pause all horror effects during focus mode
    - Resume when focus mode is disabled
    - _Requirements: 14.5_
  
  - [ ] 13.5 Implement debugging session detection
    - Detect when debugger is active
    - Pause all horror effects during debugging
    - Resume when debugging session ends
    - _Requirements: 14.4_

- [ ] 14. Implement Theme Compatibility
  - [ ] 14.1 Implement theme detection
    - Detect current VS Code theme (light/dark/high contrast)
    - Monitor for theme changes during session
    - Store original theme settings
    - _Requirements: 17.1, 17.5_
  
  - [ ] 14.2 Adjust horror colors for light themes
    - Darken horror effects for visibility on light backgrounds
    - Increase contrast of blood/shadow effects
    - Test with popular light themes
    - _Requirements: 17.2_
  
  - [ ] 14.3 Enhance contrast for high contrast mode
    - Increase horror effect contrast by 50%
    - Ensure all effects are clearly visible
    - Test with high contrast themes
    - _Requirements: 17.4_
  
  - [ ] 14.4 Test with popular VS Code themes
    - Test with Dark+ (default dark)
    - Test with Light+ (default light)
    - Test with Monokai
    - Test with Solarized Dark
    - Test with One Dark Pro
    - Document any theme-specific adjustments needed
    - _Requirements: 17.3_

- [ ] 15. Integration and Testing
  - [ ] 15.1 Integrate all managers into HorrorEngine
    - Register all effect managers with horror engine
    - Connect event engine to trigger managers
    - Implement coordinated effect activation
    - Add manager lifecycle management (init/dispose)
    - _Requirements: All_
  
  - [ ] 15.2 Implement comprehensive error handling
    - Wrap all effect triggers in try-catch
    - Log errors with context
    - Gracefully degrade on failures
    - Show user-friendly error messages
    - Implement automatic recovery
    - _Requirements: 12.3, 12.5_
  
  - [ ] 15.3 Add telemetry and debugging tools
    - Create debug command to show horror engine state
    - Log event triggers and probabilities
    - Track effect performance metrics
    - Add verbose logging mode for troubleshooting
    - _Requirements: All_
  
  - [ ]* 15.4 Write unit tests for core systems
    - Test random event probability calculations
    - Test event history and repetition prevention
    - Test cooldown management
    - Test phantom state restoration
    - Test configuration validation
    - _Requirements: All_
  
  - [ ]* 15.5 Write integration tests
    - Test safety manager panic button
    - Test accessibility setting detection
    - Test screen sharing detection
    - Test theme compatibility
    - Test effect coordination
    - _Requirements: All_
  
  - [ ] 15.6 Perform manual testing
    - Test photosensitivity compliance
    - Test user experience flow
    - Test easter egg discovery
    - Test performance impact
    - Test cross-theme compatibility
    - _Requirements: All_

- [ ] 16. Documentation and Polish
  - [ ] 16.1 Update README with horror warnings
    - Add prominent photosensitivity warning
    - List psychological content warnings
    - Document panic button clearly
    - Add "Not recommended for" section
    - Include safety features overview
    - _Requirements: 13.5, 16.3_
  
  - [ ] 16.2 Create user guide for horror features
    - Document all horror effects
    - Explain intensity system
    - List all easter eggs (spoiler section)
    - Provide troubleshooting guide
    - Include FAQ section
    - _Requirements: 16.4_
  
  - [ ] 16.3 Update VS Code marketplace description
    - Add clear horror theme description
    - Include all safety warnings
    - List key features
    - Add screenshots/GIFs of effects
    - Include user testimonials
    - _Requirements: 13.5, 16.3_
  
  - [ ] 16.4 Create first-run tutorial
    - Show welcome message with warnings
    - Demonstrate panic button
    - Explain intensity settings
    - Show how to enable/disable effects
    - Provide quick start guide
    - _Requirements: 16.2, 16.4_
  
  - [ ] 16.5 Add in-editor help commands
    - Command: "Show Horror Controls"
    - Command: "Test Horror Effects"
    - Command: "View Easter Eggs"
    - Command: "Reset Horror Settings"
    - Command: "Emergency Restore"
    - _Requirements: 12.5_

- [ ] 17. Performance Optimization
  - [ ] 17.1 Implement resource management
    - Limit active webviews to 2 maximum
    - Dispose unused decorations immediately
    - Lazy-load jumpscare assets
    - Implement asset caching
    - _Requirements: All_
  
  - [ ] 17.2 Optimize event calculations
    - Throttle probability calculations to 100ms
    - Use requestAnimationFrame for animations
    - Debounce text change events
    - Cache frequently accessed values
    - _Requirements: All_
  
  - [ ] 17.3 Profile and optimize performance
    - Measure extension activation time
    - Profile effect trigger overhead
    - Optimize webview rendering
    - Reduce memory footprint
    - _Requirements: All_

## Implementation Notes

### Development Order
1. Start with safety features (Task 1) - critical for user protection
2. Build core infrastructure (Tasks 2-3) - foundation for all effects
3. Implement visual effects (Tasks 4-6) - most impactful features
4. Add psychological effects (Tasks 7-10) - deeper horror experience
5. Implement easter eggs (Task 11) - replayability and discovery
6. Add configuration and polish (Tasks 12-16) - user experience
7. Optimize and test (Task 17) - production readiness

### Testing Strategy
- Test each manager independently before integration
- Use manual testing for subjective horror effectiveness
- Automated tests for safety-critical features (panic button, restoration)
- Performance testing with large codebases
- Accessibility testing with screen readers and reduced motion

### Rollout Plan
1. Alpha release with core features (Tasks 1-6)
2. Beta release with psychological effects (Tasks 7-10)
3. Release candidate with easter eggs and polish (Tasks 11-16)
4. Production release after optimization (Task 17)

### Migration from Current System
- Keep existing error-based popups as optional feature
- Add configuration to choose between error-based and random
- Default new users to random system
- Provide migration guide for existing users
