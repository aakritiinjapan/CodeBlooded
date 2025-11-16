# Design Document

## Overview

This design document outlines the architecture and implementation approach for transforming CodeChroma into a psychological horror coding experience. The system introduces unpredictable, randomized horror events while maintaining code safety, user accessibility, and VS Code compatibility.

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     Extension Entry Point                    │
│                      (extension.ts)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼─────────┐
│  Safety Manager │      │  Horror Engine   │
│  - Panic button │      │  - Event system  │
│  - Warnings     │      │  - Randomization │
│  - Accessibility│      │  - State mgmt    │
└───────┬────────┘      └────────┬─────────┘
        │                         │
        │         ┌───────────────┴──────────────┐
        │         │                              │
┌───────▼─────────▼──────┐            ┌─────────▼──────────┐
│  Random Event Engine    │            │  Effect Managers   │
│  - Probability calc     │            │  - Jumpscares      │
│  - Event scheduling     │            │  - Screen FX       │
│  - History tracking     │            │  - Phantom events  │
│  - Cooldown management  │            │  - Entity presence │
└─────────────────────────┘            └────────────────────┘
```

### Core Components

#### 1. Safety Manager
**Purpose**: Ensures user safety and accessibility compliance

**Responsibilities**:
- Display photosensitivity warnings on first activation
- Implement panic button (Ctrl+Shift+Escape)
- Monitor accessibility settings (Reduce Motion)
- Detect screen sharing and auto-disable effects
- Manage safe mode state

**Key Methods**:
```typescript
class SafetyManager {
  showFirstRunWarning(): Promise<boolean>
  activatePanicButton(): void
  checkAccessibilitySettings(): AccessibilityState
  detectScreenSharing(): boolean
  enterSafeMode(): void
  exitSafeMode(): void
}
```

#### 2. Horror Engine
**Purpose**: Central coordinator for all horror effects

**Responsibilities**:
- Manage horror intensity (0-100 scale)
- Coordinate between effect managers
- Track session state and timing
- Handle user configuration
- Implement progressive escalation

**Key Properties**:
```typescript
interface HorrorEngineState {
  intensity: number;              // 0-100
  sessionStartTime: number;
  lastEventTime: number;
  isActive: boolean;
  isSafeMode: boolean;
  userConfig: HorrorConfig;
}
```

#### 3. Random Event Engine
**Purpose**: Generate unpredictable horror events with intelligent timing

**Responsibilities**:
- Calculate event probabilities based on intensity
- Schedule events with exponential backoff
- Track event history to prevent repetition
- Implement weighted random selection
- Manage cooldown periods

**Algorithm**:
```typescript
interface EventProbability {
  baseChance: number;           // 0-1
  intensityMultiplier: number;  // Scales with horror intensity
  cooldownSeconds: number;      // Min time between events
  maxPerSession: number;        // Limit per coding session
}

// Probability calculation
function calculateEventChance(
  baseChance: number,
  intensity: number,
  timeSinceLastEvent: number,
  eventHistory: EventType[]
): number {
  const intensityFactor = intensity / 100;
  const timeFactor = Math.min(timeSinceLastEvent / 60, 2); // Max 2x after 60s
  const repetitionPenalty = getRepetitionPenalty(eventHistory);
  
  return baseChance * intensityFactor * timeFactor * repetitionPenalty;
}
```

#### 4. Jumpscare Manager (Enhanced)
**Purpose**: Display random, diverse jumpscare popups

**New Features**:
- 5+ jumpscare variants with unique visuals
- Weighted random selection
- History tracking to prevent repetition
- Synchronized audio for each variant

**Jumpscare Variants**:

1. **Realistic Horror Face** (existing)
   - Full CSS-rendered horror face
   - Rushing animation
   - Demonic roar audio
   - Duration: 5 seconds

2. **Glitching Skull**
   - Skull emoji with extreme glitch effects
   - RGB channel separation
   - Static noise overlay
   - Distorted scream audio
   - Duration: 3 seconds

3. **Shadow Figure**
   - Dark silhouette approaching from distance
   - Gradual zoom with blur
   - Heavy breathing audio
   - Duration: 4 seconds

4. **Watching Eyes**
   - Multiple eyes appearing one by one
   - Blinking and tracking cursor
   - Whisper audio layer
   - Duration: 4 seconds

5. **Static TV Flash**
   - Old TV static effect
   - Brief flash of disturbing image
   - White noise audio
   - Duration: 2 seconds

6. **Creeping Hands**
   - Hands reaching from edges of screen
   - Scratching sound effects
   - Duration: 3 seconds

**Implementation**:
```typescript
interface JumpscareVariant {
  id: string;
  name: string;
  weight: number;              // For weighted random selection
  duration: number;            // Milliseconds
  htmlGenerator: () => string;
  audioFile: string;
  cooldownMultiplier: number;  // Some variants need longer cooldown
}

class JumpscareManager {
  private variants: JumpscareVariant[];
  private history: string[];   // Last 3 shown
  
  selectVariant(): JumpscareVariant {
    // Weighted random selection excluding recent history
    const available = this.variants.filter(v => 
      !this.history.includes(v.id)
    );
    return weightedRandom(available);
  }
  
  async showRandomJumpscare(): Promise<void> {
    const variant = this.selectVariant();
    await this.showJumpscare(variant);
    this.history.push(variant.id);
    if (this.history.length > 3) this.history.shift();
  }
}
```

#### 5. Screen Distortion Manager
**Purpose**: Apply visual distortion effects to create instability

**Effects**:

**Screen Shake**:
```typescript
interface ShakeConfig {
  intensity: number;      // 2-8 pixels
  duration: number;       // Milliseconds
  frequency: number;      // Hz (oscillations per second)
}

// Implementation via CSS transforms in webview overlay
function applyScreenShake(config: ShakeConfig): void {
  const overlay = createTransparentWebview();
  overlay.style.animation = `
    shake ${1000 / config.frequency}ms infinite
  `;
  
  // CSS keyframes
  @keyframes shake {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(${config.intensity}px, ${config.intensity}px); }
    50% { transform: translate(-${config.intensity}px, ${config.intensity}px); }
    75% { transform: translate(${config.intensity}px, -${config.intensity}px); }
  }
}
```

**VHS Distortion**:
```css
.vhs-effect {
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    rgba(255, 255, 255, 0.03) 2px,
    transparent 4px
  );
  animation: vhs-tracking 0.1s infinite;
}

@keyframes vhs-tracking {
  0% { transform: translateY(0); }
  100% { transform: translateY(-4px); }
}
```

**Chromatic Aberration**:
```css
.chromatic-aberration {
  filter: 
    drop-shadow(2px 0 0 red)
    drop-shadow(-2px 0 0 cyan)
    drop-shadow(0 2px 0 yellow);
}
```

**Glitch Effect**:
```typescript
function applyGlitchEffect(): void {
  // Random horizontal displacement
  const glitchLines = Math.floor(Math.random() * 10) + 5;
  for (let i = 0; i < glitchLines; i++) {
    const line = document.createElement('div');
    line.style.cssText = `
      position: absolute;
      top: ${Math.random() * 100}%;
      left: 0;
      width: 100%;
      height: 2px;
      background: rgba(255, 0, 0, 0.5);
      transform: translateX(${Math.random() * 20 - 10}px);
    `;
    overlay.appendChild(line);
  }
}
```

#### 6. Entity Presence Manager
**Purpose**: Create subtle "watching" indicators

**Implementation**:
```typescript
interface EyeEntity {
  line: number;
  column: number;
  createdAt: number;
  lastMoveTime: number;
}

class EntityPresenceManager {
  private eyes: EyeEntity[] = [];
  private maxEyes = 3;
  
  spawnEye(): void {
    if (this.eyes.length >= this.maxEyes) return;
    
    const editor = vscode.window.activeTextEditor;
    const randomLine = Math.floor(Math.random() * editor.document.lineCount);
    
    const eye: EyeEntity = {
      line: randomLine,
      column: 0,
      createdAt: Date.now(),
      lastMoveTime: Date.now()
    };
    
    this.eyes.push(eye);
    this.renderEye(eye);
  }
  
  moveEyeAwayFromCursor(cursorLine: number): void {
    this.eyes.forEach(eye => {
      if (Math.abs(eye.line - cursorLine) < 3) {
        // Move eye to different location
        const newLine = this.findDistantLine(cursorLine);
        eye.line = newLine;
        eye.lastMoveTime = Date.now();
        this.renderEye(eye);
      }
    });
  }
  
  private renderEye(eye: EyeEntity): void {
    // Use gutter decoration with eye icon
    const decoration = vscode.window.createTextEditorDecorationType({
      gutterIconPath: this.getEyeIconUri(),
      gutterIconSize: 'contain'
    });
    
    const range = new vscode.Range(eye.line, 0, eye.line, 0);
    editor.setDecorations(decoration, [range]);
  }
}
```

#### 7. Phantom Typing Manager
**Purpose**: Safely insert/remove characters to simulate external typing

**Safety-First Implementation**:
```typescript
interface PhantomState {
  originalText: string;
  position: vscode.Position;
  insertedText: string;
  timestamp: number;
}

class PhantomTypingManager {
  private activePhantoms: PhantomState[] = [];
  private maxDuration = 1500; // 1.5 seconds max
  
  async triggerPhantomTyping(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    // Store original state
    const position = editor.selection.active;
    const originalText = editor.document.getText();
    
    // Generate creepy text
    const phantomText = this.getRandomPhantomText();
    
    // Insert text
    const success = await editor.edit(editBuilder => {
      editBuilder.insert(position, phantomText);
    });
    
    if (!success) return;
    
    // Store state for restoration
    const state: PhantomState = {
      originalText,
      position,
      insertedText: phantomText,
      timestamp: Date.now()
    };
    this.activePhantoms.push(state);
    
    // Schedule removal
    setTimeout(() => this.removePhantom(state), 
      Math.random() * 1000 + 500);
  }
  
  private async removePhantom(state: PhantomState): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    // Calculate range to delete
    const endPosition = state.position.translate(0, state.insertedText.length);
    const range = new vscode.Range(state.position, endPosition);
    
    // Remove phantom text
    await editor.edit(editBuilder => {
      editBuilder.delete(range);
    });
    
    // Remove from active list
    const index = this.activePhantoms.indexOf(state);
    if (index > -1) {
      this.activePhantoms.splice(index, 1);
    }
  }
  
  private getRandomPhantomText(): string {
    const options = [
      '...',
      'help',
      'watching',
      'behind you',
      '👁️',
      'no escape',
      'they know'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Emergency restore all
  async restoreAll(): Promise<void> {
    for (const state of this.activePhantoms) {
      await this.removePhantom(state);
    }
  }
}
```

#### 8. Whispering Variables Manager
**Purpose**: Overlay creepy alternative names on variables

**Implementation**:
```typescript
interface WhisperMapping {
  original: string;
  whisper: string;
  position: vscode.Range;
  expiresAt: number;
}

class WhisperingVariablesManager {
  private whisperMap: Map<string, string> = new Map([
    ['user', 'victim'],
    ['data', 'secrets'],
    ['id', 'soul'],
    ['name', 'trueName'],
    ['value', 'price'],
    ['result', 'fate'],
    ['error', 'doom'],
    ['success', 'illusion'],
    ['count', 'remaining'],
    ['index', 'marked']
  ]);
  
  private activeWhispers: WhisperMapping[] = [];
  
  async applyWhisper(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    // Find variables in current view
    const variables = this.findVariablesInView(editor);
    if (variables.length === 0) return;
    
    // Select random variable
    const target = variables[Math.floor(Math.random() * variables.length)];
    const whisper = this.whisperMap.get(target.text) || 'unknown';
    
    // Create decoration overlay
    const decoration = vscode.window.createTextEditorDecorationType({
      before: {
        contentText: whisper,
        color: 'rgba(255, 0, 0, 0.7)',
        fontStyle: 'italic',
        textDecoration: 'none; position: absolute; margin-left: -${whisper.length}ch;'
      },
      textDecoration: 'none; opacity: 0.3;'
    });
    
    editor.setDecorations(decoration, [target.range]);
    
    // Store for cleanup
    const mapping: WhisperMapping = {
      original: target.text,
      whisper,
      position: target.range,
      expiresAt: Date.now() + (Math.random() * 2000 + 1000)
    };
    this.activeWhispers.push(mapping);
    
    // Schedule removal
    setTimeout(() => {
      decoration.dispose();
      const index = this.activeWhispers.indexOf(mapping);
      if (index > -1) this.activeWhispers.splice(index, 1);
    }, mapping.expiresAt - Date.now());
  }
  
  private findVariablesInView(editor: vscode.TextEditor): Array<{text: string, range: vscode.Range}> {
    // Use regex to find variable-like identifiers
    const text = editor.document.getText();
    const regex = /\b[a-z][a-zA-Z0-9]*\b/g;
    const variables: Array<{text: string, range: vscode.Range}> = [];
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (this.whisperMap.has(match[0])) {
        const pos = editor.document.positionAt(match.index);
        const range = new vscode.Range(pos, pos.translate(0, match[0].length));
        variables.push({ text: match[0], range });
      }
    }
    
    return variables;
  }
}
```

#### 9. Context-Aware Trigger System
**Purpose**: Detect keywords and trigger special effects

**Implementation**:
```typescript
interface TriggerKeyword {
  word: string;
  effect: () => Promise<void>;
  cooldown: number;
  lastTriggered: number;
}

class ContextTriggerManager {
  private keywords: TriggerKeyword[] = [
    {
      word: 'kill',
      effect: () => this.triggerBloodDrip(),
      cooldown: 20000,
      lastTriggered: 0
    },
    {
      word: 'dead',
      effect: () => this.triggerSkullFlash(),
      cooldown: 20000,
      lastTriggered: 0
    },
    {
      word: 'error',
      effect: () => this.triggerGlitchEffect(),
      cooldown: 20000,
      lastTriggered: 0
    },
    {
      word: 'fatal',
      effect: () => this.triggerScreenShake(),
      cooldown: 20000,
      lastTriggered: 0
    }
  ];
  
  onTextChange(change: vscode.TextDocumentChangeEvent): void {
    const text = change.document.getText();
    const recentText = text.slice(-20); // Last 20 characters
    
    for (const trigger of this.keywords) {
      if (recentText.includes(trigger.word)) {
        this.attemptTrigger(trigger);
      }
    }
  }
  
  private async attemptTrigger(trigger: TriggerKeyword): Promise<void> {
    const now = Date.now();
    
    // Check cooldown
    if (now - trigger.lastTriggered < trigger.cooldown) {
      return;
    }
    
    // 30% chance to trigger
    if (Math.random() > 0.3) {
      return;
    }
    
    // Trigger effect
    trigger.lastTriggered = now;
    await trigger.effect();
  }
}
```

#### 10. Easter Egg System
**Purpose**: Hidden horror elements for discovery

**Easter Eggs**:

1. **Nightmare Constant**
   ```typescript
   // Trigger: User types "const nightmare = true;"
   if (text.includes('const nightmare = true')) {
     await showSpecialJumpscare('nightmare-mode');
     enableMaxHorror();
   }
   ```

2. **Witching Hour**
   ```typescript
   // Trigger: Opening file at exactly midnight
   function checkWitchingHour(): void {
     const now = new Date();
     if (now.getHours() === 0 && now.getMinutes() === 0) {
       showWitchingHourEffect();
     }
   }
   ```

3. **Cumulative Time Secret**
   ```typescript
   // Trigger: 6 hours of coding time
   if (getTotalCodingTime() >= 6 * 60 * 60 * 1000) {
     unlockSecretJumpscare();
   }
   ```

4. **Konami Code**
   ```typescript
   // Sequence: Up, Up, Down, Down, Left, Right, Left, Right, B, A
   class KonamiDetector {
     private sequence = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
     private current: string[] = [];
     
     onKeyPress(key: string): void {
       this.current.push(key);
       if (this.current.length > this.sequence.length) {
         this.current.shift();
       }
       
       if (this.sequenceMatches()) {
         activateMaxHorrorMode();
       }
     }
   }
   ```

5. **Cryptic Tooltips**
   ```typescript
   // 1% chance on hover
   function getHoverMessage(symbol: string): string {
     if (Math.random() < 0.01) {
       return getCreepyMessage();
     }
     return getNormalMessage(symbol);
   }
   
   function getCreepyMessage(): string {
     const messages = [
       'They are watching through your screen',
       'The code knows your name',
       'You cannot escape the loop',
       'Error 666: Soul not found',
       'Your debugger cannot save you'
     ];
     return messages[Math.floor(Math.random() * messages.length)];
   }
   ```

## Data Models

### Horror Configuration
```typescript
interface HorrorConfig {
  enabled: boolean;
  intensity: number;              // 0-100
  safeMode: boolean;
  
  // Feature toggles
  enableJumpscares: boolean;
  enableScreenEffects: boolean;
  enablePhantomEvents: boolean;
  enableEntityPresence: boolean;
  enableEasterEggs: boolean;
  
  // Accessibility
  respectReduceMotion: boolean;
  maxFlashFrequency: number;      // Flashes per second
  panicButtonKey: string;         // Default: 'Ctrl+Shift+Escape'
  
  // Advanced
  jumpscareCooldownMin: number;   // Seconds
  jumpscareCooldownMax: number;   // Seconds
  escalationRate: number;         // Intensity increase per minute
}
```

### Event History
```typescript
interface EventRecord {
  type: EventType;
  timestamp: number;
  intensity: number;
  variant?: string;
}

enum EventType {
  Jumpscare = 'jumpscare',
  ScreenShake = 'screen_shake',
  PhantomTyping = 'phantom_typing',
  EntitySpawn = 'entity_spawn',
  Whisper = 'whisper',
  ContextTrigger = 'context_trigger',
  EasterEgg = 'easter_egg'
}
```

## Error Handling

### Phantom Event Failures
```typescript
class PhantomEventError extends Error {
  constructor(
    message: string,
    public readonly state: PhantomState
  ) {
    super(message);
  }
}

async function safePhantomEvent(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    console.error('[Horror] Phantom event failed:', error);
    
    // Attempt restoration
    if (error instanceof PhantomEventError) {
      await restorePhantomState(error.state);
    }
    
    // Disable phantom events for session
    disablePhantomEventsForSession();
    
    // Notify user
    vscode.window.showWarningMessage(
      'CodeChroma: Phantom events disabled due to error. Your code is safe.'
    );
  }
}
```

### Webview Failures
```typescript
function createSafeWebview(): vscode.WebviewPanel | undefined {
  try {
    return vscode.window.createWebviewPanel(/*...*/);
  } catch (error) {
    console.error('[Horror] Webview creation failed:', error);
    
    // Fallback to simpler effects
    useFallbackEffects();
    return undefined;
  }
}
```

## Testing Strategy

### Unit Tests
- Random event probability calculations
- Event history tracking and repetition prevention
- Cooldown management
- Phantom state restoration
- Configuration validation

### Integration Tests
- Safety manager panic button
- Accessibility setting detection
- Screen sharing detection
- Theme compatibility
- Effect coordination

### Manual Testing
- Photosensitivity compliance (flash frequency)
- User experience flow (warnings, onboarding)
- Easter egg discovery
- Performance impact
- Cross-theme compatibility

### Accessibility Testing
- Reduce Motion compliance
- High contrast mode
- Screen reader compatibility
- Keyboard navigation

## Performance Considerations

### Resource Management
- Limit active webviews to 2 maximum
- Dispose decorations after use
- Throttle event calculations to 100ms intervals
- Use requestAnimationFrame for animations
- Lazy-load jumpscare assets

### Memory Management
```typescript
class ResourceManager {
  private activeWebviews: vscode.WebviewPanel[] = [];
  private activeDecorations: vscode.TextEditorDecorationType[] = [];
  
  registerWebview(panel: vscode.WebviewPanel): void {
    this.activeWebviews.push(panel);
    
    // Enforce limit
    if (this.activeWebviews.length > 2) {
      const oldest = this.activeWebviews.shift();
      oldest?.dispose();
    }
  }
  
  cleanup(): void {
    this.activeWebviews.forEach(w => w.dispose());
    this.activeDecorations.forEach(d => d.dispose());
    this.activeWebviews = [];
    this.activeDecorations = [];
  }
}
```

## Security Considerations

### Code Safety
- Never modify saved files on disk
- All phantom events are in-memory only
- Automatic restoration within 2 seconds
- Emergency restore command available
- Validation before any document edit

### User Privacy
- No telemetry or tracking
- No external network requests
- All effects are local
- Configuration stored locally only

## Migration from Current Implementation

### Backward Compatibility
- Existing horror popup system remains functional
- New random system runs in parallel initially
- Configuration migration for existing users
- Gradual feature rollout

### Deprecation Plan
1. Add new random jumpscare system alongside existing
2. Make error-based popups optional (default: off)
3. After 2 releases, fully transition to random system
4. Remove error-based trigger code

## Future Enhancements

### Potential Additions
- Multiplayer horror (shared effects across team)
- Custom jumpscare uploads
- Horror intensity learning (adapts to user reactions)
- Seasonal events (Halloween special effects)
- Achievement system for easter eggs
- Horror sound design workshop
