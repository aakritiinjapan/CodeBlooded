---
inclusion: fileMatch
fileMatchPattern: "**/*horror*.{ts,tsx,js,jsx}"
---

# Horror Effect Implementation Patterns

## Overview

This document defines reusable patterns for implementing psychological horror effects in CodeChroma. These patterns ensure consistency, safety, and maintainability.

## Pattern 1: Random Event Trigger

Use this pattern for unpredictable horror events (jumpscares, phantom typing, entity presence).

```typescript
interface RandomEventConfig {
  baseChance: number;        // 0-1 probability
  cooldownMin: number;       // seconds
  cooldownMax: number;       // seconds
  intensityMultiplier: number; // scales with horror intensity
}

class RandomEventTrigger {
  private lastTrigger: number = 0;
  private cooldown: number = 0;
  
  shouldTrigger(config: RandomEventConfig, intensity: number): boolean {
    const now = Date.now();
    if (now - this.lastTrigger < this.cooldown * 1000) {
      return false;
    }
    
    const adjustedChance = config.baseChance * (intensity / 100) * config.intensityMultiplier;
    const triggered = Math.random() < adjustedChance;
    
    if (triggered) {
      this.lastTrigger = now;
      this.cooldown = this.randomBetween(config.cooldownMin, config.cooldownMax);
    }
    
    return triggered;
  }
}
```

## Pattern 2: Safe State Modification

Use this pattern for phantom typing, whispering variables, or any effect that modifies editor state.

```typescript
interface StateSnapshot {
  content: string;
  selection: vscode.Selection;
  timestamp: number;
}

class SafeStateModifier {
  private snapshots: Map<string, StateSnapshot> = new Map();
  
  async modifyWithRestore(
    editor: vscode.TextEditor,
    modifier: (edit: vscode.TextEditorEdit) => void,
    restoreDelayMs: number
  ): Promise<void> {
    // 1. Capture original state
    const snapshot: StateSnapshot = {
      content: editor.document.getText(),
      selection: editor.selection,
      timestamp: Date.now()
    };
    this.snapshots.set(editor.document.uri.toString(), snapshot);
    
    try {
      // 2. Apply modification
      await editor.edit(modifier);
      
      // 3. Schedule restoration
      setTimeout(() => this.restore(editor, snapshot), restoreDelayMs);
    } catch (error) {
      // 4. Emergency restore on failure
      await this.restore(editor, snapshot);
      console.error('Horror effect failed, state restored:', error);
    }
  }
  
  private async restore(editor: vscode.TextEditor, snapshot: StateSnapshot): Promise<void> {
    const fullRange = new vscode.Range(
      editor.document.positionAt(0),
      editor.document.positionAt(editor.document.getText().length)
    );
    
    await editor.edit(edit => {
      edit.replace(fullRange, snapshot.content);
    });
    
    editor.selection = snapshot.selection;
    this.snapshots.delete(editor.document.uri.toString());
  }
}
```

## Pattern 3: Accessibility-Aware Animation

Use this pattern for screen shake, glitch effects, or any visual animation.

```typescript
class AccessibleAnimation {
  private reduceMotion: boolean = false;
  
  constructor() {
    this.checkAccessibilitySettings();
  }
  
  private checkAccessibilitySettings(): void {
    // Check VS Code settings
    const config = vscode.workspace.getConfiguration('codeblooded');
    this.reduceMotion = config.get('safety.respectReduceMotion', true);
    
    // Could also check system settings via OS APIs
  }
  
  applyAnimation(element: HTMLElement, animation: Animation): void {
    if (this.reduceMotion) {
      // Apply reduced or no animation
      this.applyReducedAnimation(element, animation);
    } else {
      // Apply full animation
      this.applyFullAnimation(element, animation);
    }
  }
  
  private applyReducedAnimation(element: HTMLElement, animation: Animation): void {
    // Reduce intensity, duration, or skip entirely
    if (animation.type === 'shake') {
      // Skip shake entirely
      return;
    }
    
    // Reduce other animations by 50%
    const reduced = { ...animation, intensity: animation.intensity * 0.5 };
    this.applyFullAnimation(element, reduced);
  }
}
```

## Pattern 4: Flash Frequency Limiter

Use this pattern for any effect that includes flashing or rapid visual changes.

```typescript
class FlashFrequencyLimiter {
  private flashTimestamps: number[] = [];
  private maxFlashesPerSecond: number = 3;
  
  canFlash(): boolean {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Remove flashes older than 1 second
    this.flashTimestamps = this.flashTimestamps.filter(t => t > oneSecondAgo);
    
    // Check if we're under the limit
    if (this.flashTimestamps.length >= this.maxFlashesPerSecond) {
      return false;
    }
    
    // Record this flash
    this.flashTimestamps.push(now);
    return true;
  }
  
  async flashWithLimit(flashFn: () => Promise<void>): Promise<void> {
    if (this.canFlash()) {
      await flashFn();
    } else {
      console.log('Flash skipped: frequency limit reached');
    }
  }
}
```

## Pattern 5: Panic Button Integration

Every horror effect MUST integrate with the panic button.

```typescript
class HorrorEffect {
  private isEnabled: boolean = true;
  private activeEffects: Set<string> = new Set();
  
  constructor(private panicButton: PanicButton) {
    // Subscribe to panic button
    panicButton.onPanic(() => this.emergencyDisable());
  }
  
  async triggerEffect(effectId: string): Promise<void> {
    if (!this.isEnabled) {
      return;
    }
    
    this.activeEffects.add(effectId);
    
    try {
      // Effect implementation
      await this.doEffect(effectId);
    } finally {
      this.activeEffects.delete(effectId);
    }
  }
  
  private emergencyDisable(): void {
    this.isEnabled = false;
    
    // Cancel all active effects immediately
    for (const effectId of this.activeEffects) {
      this.cancelEffect(effectId);
    }
    
    this.activeEffects.clear();
  }
}
```

## Pattern 6: Context-Aware Triggers

Use this pattern for keyword-based triggers (typing "kill", "dead", etc.).

```typescript
class ContextAwareTrigger {
  private readonly triggerKeywords = new Map<string, HorrorEffect>([
    ['kill', 'bloodDrip'],
    ['dead', 'skullFlash'],
    ['error', 'glitchEffect'],
    ['fatal', 'screenShake']
  ]);
  
  private lastTrigger: number = 0;
  private cooldownMs: number = 20000; // 20 seconds
  
  onTextChange(change: vscode.TextDocumentChangeEvent): void {
    const now = Date.now();
    if (now - this.lastTrigger < this.cooldownMs) {
      return;
    }
    
    for (const [keyword, effect] of this.triggerKeywords) {
      if (this.containsKeyword(change, keyword)) {
        if (Math.random() < 0.3) { // 30% chance
          this.triggerEffect(effect);
          this.lastTrigger = now;
          break; // Only one trigger per change
        }
      }
    }
  }
  
  private containsKeyword(change: vscode.TextDocumentChangeEvent, keyword: string): boolean {
    return change.contentChanges.some(c => 
      c.text.toLowerCase().includes(keyword)
    );
  }
}
```

## Pattern 7: Progressive Intensity Scaling

Use this pattern to gradually increase horror over time.

```typescript
class IntensityScaler {
  private sessionStart: number = Date.now();
  private baseIntensity: number = 20; // Start at 20%
  private maxIntensity: number = 100;
  private escalationRate: number = 5; // 5% per 2 minutes
  private lastActivity: number = Date.now();
  
  getCurrentIntensity(): number {
    const now = Date.now();
    const inactiveTime = now - this.lastActivity;
    
    // Reset if inactive for 5 minutes
    if (inactiveTime > 5 * 60 * 1000) {
      this.sessionStart = now;
      return this.baseIntensity;
    }
    
    // Calculate intensity based on session duration
    const sessionDuration = now - this.sessionStart;
    const twoMinuteIntervals = Math.floor(sessionDuration / (2 * 60 * 1000));
    const intensity = this.baseIntensity + (twoMinuteIntervals * this.escalationRate);
    
    return Math.min(intensity, this.maxIntensity);
  }
  
  recordActivity(): void {
    this.lastActivity = Date.now();
  }
}
```

## Best Practices

1. **Always use SafeStateModifier** for any editor modifications
2. **Always check FlashFrequencyLimiter** before flashing effects
3. **Always integrate with PanicButton** for emergency disable
4. **Always respect accessibility settings** via AccessibleAnimation
5. **Always use RandomEventTrigger** for unpredictable timing
6. **Always test with property-based tests** for safety properties

## Anti-Patterns (Don't Do This)

❌ **Direct editor modification without state capture**
```typescript
// BAD: No way to restore
editor.edit(edit => edit.insert(position, 'phantom text'));
```

✅ **Use SafeStateModifier instead**
```typescript
// GOOD: Automatic restoration
safeModifier.modifyWithRestore(editor, edit => {
  edit.insert(position, 'phantom text');
}, 1000);
```

❌ **Synchronous blocking operations**
```typescript
// BAD: Blocks UI thread
function triggerEffect() {
  sleep(3000); // Blocks everything!
  showJumpscare();
}
```

✅ **Use async/await**
```typescript
// GOOD: Non-blocking
async function triggerEffect() {
  await delay(3000);
  await showJumpscare();
}
```

❌ **Ignoring panic button**
```typescript
// BAD: Effect continues even after panic
function longRunningEffect() {
  for (let i = 0; i < 100; i++) {
    applyEffect(i);
  }
}
```

✅ **Check panic state in loops**
```typescript
// GOOD: Respects panic button
function longRunningEffect() {
  for (let i = 0; i < 100; i++) {
    if (!this.isEnabled) break;
    applyEffect(i);
  }
}
```

## Testing Patterns

Every horror effect should have:

1. **Unit test**: Core logic works correctly
2. **Property test**: Safety properties hold (flash frequency, restoration time)
3. **Integration test**: Panic button cancels effect
4. **Accessibility test**: Respects Reduce Motion setting

Example property test:
```typescript
test('phantom typing always restores within 2 seconds', async () => {
  await fc.assert(
    fc.asyncProperty(fc.string(), async (text) => {
      const start = Date.now();
      await phantomTyping.insert(text);
      const restored = await waitForRestore();
      const duration = Date.now() - start;
      
      expect(restored).toBe(true);
      expect(duration).toBeLessThan(2000);
    })
  );
});
```
