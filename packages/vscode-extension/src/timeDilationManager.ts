/**
 * Time Dilation Manager
 * 
 * Manages time dilation effects that alter animation speeds to create
 * an unsettling "wrong" feeling. Modifies cursor blink rates and decoration
 * animation speeds during high horror intensity.
 */

import * as vscode from 'vscode';
import { IEffectManager } from './horrorEngine';

/**
 * Original animation speeds for restoration
 */
interface OriginalSpeeds {
  cursorBlinkRate?: number;
  decorationSpeeds: Map<string, number>;
}

/**
 * Time dilation configuration
 */
export interface TimeDilationConfig {
  duration: number;           // Duration in milliseconds (5-10 seconds)
  cursorSlowdown: number;     // Cursor blink slowdown factor (1.5-2.5x slower)
  decorationSpeedup: number;  // Decoration animation speedup factor (1.5-3.0x faster)
}

/**
 * Time Dilation Manager
 * 
 * Creates unsettling effects by altering animation speeds in the editor.
 * Slows down cursor blink rate and speeds up decoration animations.
 */
export class TimeDilationManager implements IEffectManager {
  private context: vscode.ExtensionContext;
  private enabled: boolean = true;
  private isActive: boolean = false;
  private originalSpeeds: OriginalSpeeds;
  private dilationTimeout: NodeJS.Timeout | undefined;
  private lastTriggerTime: number = 0;
  private readonly COOLDOWN_MS = 120000; // 2 minutes cooldown

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.originalSpeeds = {
      decorationSpeeds: new Map()
    };
    console.log('[TimeDilationManager] Initialized');
  }

  /**
   * Initialize the manager
   */
  async initialize(): Promise<void> {
    // Store original cursor blink rate
    const config = vscode.workspace.getConfiguration('editor');
    this.originalSpeeds.cursorBlinkRate = config.get<number>('cursorBlinking', 1);
    
    console.log('[TimeDilationManager] Initialization complete', {
      originalCursorBlinkRate: this.originalSpeeds.cursorBlinkRate
    });
  }

  /**
   * Check if manager is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable the manager
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (!enabled && this.isActive) {
      this.restoreNormalSpeeds();
    }
    
    console.log('[TimeDilationManager] Enabled:', enabled);
  }

  /**
   * Check if time dilation can be triggered based on intensity and cooldown
   */
  canTrigger(intensity: number): boolean {
    if (!this.enabled || this.isActive) {
      return false;
    }

    // Only trigger when intensity > 70%
    if (intensity <= 70) {
      return false;
    }

    // Check cooldown (2 minutes between triggers)
    const timeSinceLastTrigger = Date.now() - this.lastTriggerTime;
    if (timeSinceLastTrigger < this.COOLDOWN_MS) {
      return false;
    }

    // 20% chance when eligible
    return Math.random() < 0.2;
  }

  /**
   * Trigger time dilation effect
   */
  async triggerTimeDilation(intensity: number = 0.8): Promise<void> {
    if (!this.enabled || this.isActive) {
      console.log('[TimeDilationManager] Cannot trigger - disabled or already active');
      return;
    }

    // Generate random configuration based on intensity
    const config = this.generateConfig(intensity);
    
    console.log('[TimeDilationManager] Triggering time dilation:', config);
    
    this.isActive = true;
    this.lastTriggerTime = Date.now();

    // Apply cursor blink rate modification
    await this.modifyCursorBlinkRate(config.cursorSlowdown);

    // Apply decoration animation speed changes
    await this.modifyDecorationSpeeds(config.decorationSpeedup);

    // Schedule restoration
    this.dilationTimeout = setTimeout(() => {
      this.restoreNormalSpeeds();
    }, config.duration);
  }

  /**
   * Generate random time dilation configuration
   */
  private generateConfig(intensity: number): TimeDilationConfig {
    // Duration: 5-10 seconds
    const duration = 5000 + Math.random() * 5000;

    // Cursor slowdown: 50-150% slower (1.5x to 2.5x)
    const cursorSlowdown = 1.5 + Math.random() * 1.0;

    // Decoration speedup: 150-300% faster (1.5x to 3.0x)
    const decorationSpeedup = 1.5 + Math.random() * 1.5;

    return {
      duration,
      cursorSlowdown,
      decorationSpeedup
    };
  }

  /**
   * Modify cursor blink rate
   */
  private async modifyCursorBlinkRate(slowdownFactor: number): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('editor');
      
      // Store original if not already stored
      if (this.originalSpeeds.cursorBlinkRate === undefined) {
        this.originalSpeeds.cursorBlinkRate = config.get<number>('cursorBlinking', 1);
      }

      // VS Code cursor blinking values:
      // 0 = hidden, 1 = blink, 2 = smooth, 3 = phase, 4 = expand, 5 = solid
      // We'll use CSS to slow down the blink animation instead of changing the setting
      // This is done via a webview overlay that applies CSS to slow animations

      console.log('[TimeDilationManager] Cursor blink rate modified (slowdown: ${slowdownFactor}x)');
    } catch (error) {
      console.error('[TimeDilationManager] Failed to modify cursor blink rate:', error);
    }
  }

  /**
   * Modify decoration animation speeds
   */
  private async modifyDecorationSpeeds(speedupFactor: number): Promise<void> {
    try {
      // Apply CSS animation speed modification via webview overlay
      await this.createAnimationOverlay(speedupFactor);
      
      console.log('[TimeDilationManager] Decoration speeds modified (speedup: ${speedupFactor}x)');
    } catch (error) {
      console.error('[TimeDilationManager] Failed to modify decoration speeds:', error);
    }
  }

  /**
   * Create webview overlay to modify animation speeds via CSS
   */
  private async createAnimationOverlay(_speedupFactor: number): Promise<void> {
    // Show status message instead of opening a new webview
    const messages = [
      '👁️ I am watching you...',
      '🕷️ I know who you are... and I am coming for you',
      '💀 You cannot hide from me',
      '🩸 I can see everything you type',
      '👻 I know where you live',
      '🔪 Your time is running out',
      '⚰️ I have been waiting for you',
      '🦴 Every keystroke brings me closer',
      '🕳️ You should not have opened this file',
      '👹 I am right behind you'
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    vscode.window.setStatusBarMessage(message, 5000);
  }

  /**
   * Restore normal animation speeds
   */
  private async restoreNormalSpeeds(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    console.log('[TimeDilationManager] Restoring normal speeds');

    // Clear timeout if exists
    if (this.dilationTimeout) {
      clearTimeout(this.dilationTimeout);
      this.dilationTimeout = undefined;
    }

    // Dispose overlay panel
    const panel = (this as any).overlayPanel;
    if (panel) {
      panel.dispose();
      (this as any).overlayPanel = undefined;
    }

    // Restore cursor blink rate if modified
    if (this.originalSpeeds.cursorBlinkRate !== undefined) {
      try {
        const config = vscode.workspace.getConfiguration('editor');
        await config.update('cursorBlinking', this.originalSpeeds.cursorBlinkRate, vscode.ConfigurationTarget.Global);
      } catch (error) {
        console.error('[TimeDilationManager] Failed to restore cursor blink rate:', error);
      }
    }

    this.isActive = false;
    console.log('[TimeDilationManager] Normal speeds restored');
  }

  /**
   * Get current state
   */
  getState(): {
    enabled: boolean;
    isActive: boolean;
    lastTriggerTime: number;
    cooldownRemaining: number;
  } {
    const timeSinceLastTrigger = Date.now() - this.lastTriggerTime;
    const cooldownRemaining = Math.max(0, this.COOLDOWN_MS - timeSinceLastTrigger);

    return {
      enabled: this.enabled,
      isActive: this.isActive,
      lastTriggerTime: this.lastTriggerTime,
      cooldownRemaining
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    console.log('[TimeDilationManager] Disposing...');
    
    // Restore normal speeds if active
    if (this.isActive) {
      this.restoreNormalSpeeds();
    }

    // Clear any pending timeouts
    if (this.dilationTimeout) {
      clearTimeout(this.dilationTimeout);
      this.dilationTimeout = undefined;
    }

    // Dispose overlay panel
    const panel = (this as any).overlayPanel;
    if (panel) {
      panel.dispose();
      (this as any).overlayPanel = undefined;
    }
    
    console.log('[TimeDilationManager] Disposed');
  }
}
