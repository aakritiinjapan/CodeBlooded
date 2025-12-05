/**
 * Entity Presence Manager
 * 
 * Creates subtle "watching" indicators through eye icons in the editor gutter.
 * Eyes spawn randomly, move to avoid cursor, and create persistent unease.
 */

import * as vscode from 'vscode';
import { IEffectManager } from './horrorEngine';

/**
 * Represents a single eye entity in the editor
 */
interface EyeEntity {
  id: string;
  line: number;
  column: number;
  createdAt: number;
  lastMoveTime: number;
  despawnAt: number;
  decoration: vscode.TextEditorDecorationType;
}

/**
 * Entity Presence Manager - manages watching eye entities in the editor
 */
export class EntityPresenceManager implements IEffectManager {
  private eyes: EyeEntity[] = [];
  private readonly MAX_EYES = 3;
  private readonly MIN_EYE_LIFETIME_MS = 12000;
  private readonly MAX_EYE_LIFETIME_MS = 26000;
  private enabled: boolean = false;
  private disposed: boolean = false;
  
  // Timers
  private spawnTimer: NodeJS.Timeout | undefined;
  private cursorCheckTimer: NodeJS.Timeout | undefined;
  
  // Listeners
  private cursorListener: vscode.Disposable | undefined;
  
  // Eye icon URI
  private eyeIconUri: vscode.Uri | undefined;

  constructor(_context: vscode.ExtensionContext) {
    console.log('[EntityPresenceManager] Created');
  }

  /**
   * Initialize the entity presence manager
   */
  async initialize(): Promise<void> {
    if (this.disposed) {
      console.warn('[EntityPresenceManager] Cannot initialize - already disposed');
      return;
    }

    console.log('[EntityPresenceManager] Initializing...');
    
    // Create eye icon
    this.createEyeIcon();
    
    // Start cursor tracking
    this.startCursorTracking();
    
    console.log('[EntityPresenceManager] Initialized');
  }

  /**
   * Create the eye icon for gutter decorations
   * Creates an animated SVG with fade-in effect and subtle movement
   */
  private createEyeIcon(): void {
    // Create an animated SVG with the eye emoji
    // Includes fade-in animation and subtle pulsing effect
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
        <style>
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
          .eye {
            animation: fadeIn 1s ease-in, pulse 3s ease-in-out infinite;
            animation-delay: 0s, 1s;
          }
        </style>
        <text x="0" y="14" font-size="14" font-family="Arial" class="eye">👁️</text>
      </svg>
    `;
    
    const base64 = Buffer.from(svgContent).toString('base64');
    this.eyeIconUri = vscode.Uri.parse(`data:image/svg+xml;base64,${base64}`);
  }

  /**
   * Start tracking cursor position to implement avoidance behavior
   */
  private startCursorTracking(): void {
    // Listen for cursor position changes
    this.cursorListener = vscode.window.onDidChangeTextEditorSelection(event => {
      if (!this.enabled || this.disposed) {
        return;
      }
      
      this.pruneExpiredEyes();

      const cursorLine = event.selections[0].active.line;
      this.checkCursorProximity(cursorLine);
    });
    
    // Periodically check cursor proximity (backup for when selection doesn't change)
    this.cursorCheckTimer = setInterval(() => {
      if (!this.enabled || this.disposed) {
        return;
      }
      
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        this.pruneExpiredEyes();

        const cursorLine = editor.selection.active.line;
        this.checkCursorProximity(cursorLine);
      }
    }, 500); // Check every 500ms
  }

  /**
   * Dispose any eyes that have exceeded their lifespan
   */
  private pruneExpiredEyes(): void {
    if (this.eyes.length === 0) {
      return;
    }

    const now = Date.now();
    const activeEyes: EyeEntity[] = [];

    for (const eye of this.eyes) {
      if (now >= eye.despawnAt) {
        eye.decoration.dispose();
      } else {
        activeEyes.push(eye);
      }
    }

    if (activeEyes.length !== this.eyes.length) {
      this.eyes = activeEyes;
    }
  }

  /**
   * Check if cursor is near any eyes and move them if needed
   */
  private checkCursorProximity(cursorLine: number): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || this.eyes.length === 0) {
      return;
    }

    for (const eye of this.eyes) {
      const distance = Math.abs(eye.line - cursorLine);
      
      // If cursor is within 3 lines, move the eye
      if (distance <= 3) {
        this.moveEyeAwayFromCursor(eye, cursorLine, editor);
      }
    }
  }

  /**
   * Move an eye to a new location away from the cursor
   */
  private moveEyeAwayFromCursor(
    eye: EyeEntity,
    cursorLine: number,
    editor: vscode.TextEditor
  ): void {
    const now = Date.now();
    
    // Don't move too frequently (minimum 1 second between moves)
    if (now - eye.lastMoveTime < 1000) {
      return;
    }

    // Find a new line that's far from the cursor
    const newLine = this.findDistantLine(cursorLine, editor);
    
    if (newLine !== eye.line) {
      console.log('[EntityPresenceManager] Moving eye from line', eye.line, 'to', newLine, '(avoiding cursor at', cursorLine, ')');
      
      // Clear old decoration
      eye.decoration.dispose();
      
      // Update eye position
      eye.line = newLine;
      eye.lastMoveTime = now;
      
      // Create new decoration at new position (with fade-in animation from createEyeIcon)
      eye.decoration = this.createEyeDecoration();
      this.renderEye(eye, editor);
    }
  }

  /**
   * Find a line near cursor to spawn eye (within visible range)
   */
  private findDistantLine(cursorLine: number, editor: vscode.TextEditor): number {
    const lineCount = editor.document.lineCount;
    const minDistance = 2; // At least 2 lines away
    const maxDistance = 15; // Within 15 lines
    
    // Try to find a line within visible distance
    const attempts = 10;
    for (let i = 0; i < attempts; i++) {
      // Random offset within range
      const offset = (Math.random() * maxDistance * 2) - maxDistance;
      let targetLine = Math.floor(cursorLine + offset);
      
      // Clamp to valid range
      targetLine = Math.max(0, Math.min(lineCount - 1, targetLine));
      
      const distance = Math.abs(targetLine - cursorLine);
      
      if (distance >= minDistance && distance <= maxDistance) {
        // Also check it's not too close to other eyes
        const tooCloseToOtherEyes = this.eyes.some(otherEye => 
          Math.abs(otherEye.line - targetLine) < 3
        );
        
        if (!tooCloseToOtherEyes) {
          return targetLine;
        }
      }
    }
    
    // Fallback: spawn 5 lines above or below cursor
    const fallbackOffset = Math.random() > 0.5 ? 5 : -5;
    return Math.max(0, Math.min(lineCount - 1, cursorLine + fallbackOffset));
  }

  /**
   * Spawn a new eye entity
   */
  spawnEye(intensity: number): void {
    if (!this.enabled || this.disposed) {
      return;
    }

    // Check intensity threshold (only spawn when intensity > 20%)
    if (intensity <= 20) {
      return;
    }

    // Check if we've reached max eyes
    if (this.eyes.length >= this.MAX_EYES) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    // Get cursor position to avoid spawning near it
    const cursorLine = editor.selection.active.line;
    const spawnLine = this.findDistantLine(cursorLine, editor);

    const now = Date.now();

    const eye: EyeEntity = {
      id: `eye_${now}_${Math.random()}`,
      line: spawnLine,
      column: 0,
      createdAt: now,
      lastMoveTime: now,
      despawnAt: now + this.MIN_EYE_LIFETIME_MS + Math.random() * (this.MAX_EYE_LIFETIME_MS - this.MIN_EYE_LIFETIME_MS),
      decoration: this.createEyeDecoration()
    };

    this.eyes.push(eye);
    this.renderEye(eye, editor);

    console.log('[EntityPresenceManager] Spawned eye at line', spawnLine, '(intensity:', intensity, '%, total eyes:', this.eyes.length, ')');
  }

  /**
   * Create a decoration type for an eye
   */
  private createEyeDecoration(): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
      gutterIconPath: this.eyeIconUri,
      gutterIconSize: 'contain',
      // Make it more visible with a background
      backgroundColor: 'rgba(255, 0, 0, 0.05)',
      // Add before content to make it stand out
      before: {
        contentText: '👁️ ',
        color: 'red',
        fontWeight: 'bold'
      },
      // Add hover message
      hoverMessage: '**Something is watching you...**'
    });
  }

  /**
   * Render an eye at its current position
   */
  private renderEye(eye: EyeEntity, editor: vscode.TextEditor): void {
    const range = new vscode.Range(eye.line, 0, eye.line, 0);
    editor.setDecorations(eye.decoration, [range]);
  }



  /**
   * Start automatic eye spawning based on intensity
   */
  startSpawning(intensity: number): void {
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
    }

    // Calculate spawn interval based on intensity
    // At 20% intensity: spawn every 30 seconds
    // At 50% intensity: spawn every 15 seconds
    // At 80% intensity: spawn every 10 seconds
    let spawnInterval: number;
    
    if (intensity >= 80) {
      spawnInterval = 10000 + Math.random() * 5000; // 10-15 seconds
    } else if (intensity >= 50) {
      spawnInterval = 15000 + Math.random() * 10000; // 15-25 seconds
    } else if (intensity >= 20) {
      spawnInterval = 30000 + Math.random() * 10000; // 30-40 seconds
    } else {
      // Below 20%, don't spawn
      return;
    }

    console.log('[EntityPresenceManager] Starting spawn timer with interval:', spawnInterval / 1000, 'seconds');

    this.spawnTimer = setInterval(() => {
      this.spawnEye(intensity);
    }, spawnInterval);

    // Spawn one immediately if we're above threshold
    if (intensity > 20 && this.eyes.length === 0) {
      setTimeout(() => this.spawnEye(intensity), 1000); // Spawn quickly
    }
  }

  /**
   * Stop automatic eye spawning
   */
  stopSpawning(): void {
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
      this.spawnTimer = undefined;
    }
  }

  /**
   * Clear all eyes
   */
  clearAllEyes(): void {
    console.log('[EntityPresenceManager] Clearing all eyes');
    
    for (const eye of this.eyes) {
      eye.decoration.dispose();
    }
    
    this.eyes = [];
  }

  /**
   * Update eye spawning based on new intensity
   */
  updateIntensity(intensity: number): void {
    if (!this.enabled || this.disposed) {
      return;
    }

    console.log('[EntityPresenceManager] Intensity updated:', intensity);

    // Restart spawning with new intensity
    this.stopSpawning();
    
    if (intensity > 40) {
      this.startSpawning(intensity);
    } else {
      // Below threshold, clear existing eyes
      this.clearAllEyes();
    }
  }

  /**
   * Check if manager is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable the entity presence manager
   */
  setEnabled(enabled: boolean): void {
    if (this.disposed) {
      console.warn('[EntityPresenceManager] Cannot set enabled - already disposed');
      return;
    }

    console.log('[EntityPresenceManager] Setting enabled:', enabled);
    this.enabled = enabled;

    if (!enabled) {
      this.stopSpawning();
      this.clearAllEyes();
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.disposed) {
      return;
    }

    console.log('[EntityPresenceManager] Disposing...');
    
    this.disposed = true;
    this.enabled = false;
    
    // Stop timers
    this.stopSpawning();
    
    if (this.cursorCheckTimer) {
      clearInterval(this.cursorCheckTimer);
      this.cursorCheckTimer = undefined;
    }
    
    // Dispose listeners
    if (this.cursorListener) {
      this.cursorListener.dispose();
      this.cursorListener = undefined;
    }
    
    // Clear all eyes
    this.clearAllEyes();
    
    console.log('[EntityPresenceManager] Disposed');
  }
}
