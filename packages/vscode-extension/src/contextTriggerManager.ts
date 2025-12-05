/**
 * Context Trigger Manager - Detects keywords and triggers special horror effects
 * 
 * Monitors text changes in real-time to detect horror-related keywords and
 * triggers context-specific effects, making the IDE feel "aware" of what
 * the user is typing.
 */

import * as vscode from 'vscode';
import { IEffectManager } from './horrorEngine';
import { debounce } from './performanceOptimizer';

/**
 * Trigger keyword configuration
 */
export interface TriggerKeyword {
  word: string;
  effect: () => Promise<void>;
  cooldown: number;
  lastTriggered: number;
  probability: number; // 0-1 chance to trigger
}

/**
 * Context Trigger Manager
 */
export class ContextTriggerManager implements IEffectManager {
  private enabled: boolean = false;
  private keywords: TriggerKeyword[] = [];
  private textChangeListener: vscode.Disposable | undefined;
  private recentTextBuffer: string = '';
  private readonly bufferSize = 20; // Monitor last 20 characters
  private readonly defaultCooldown = 20000; // 20 seconds
  private readonly defaultProbability = 0.3; // 30% chance

  // Effect manager references (injected after construction)
  private screenDistortionManager: any;
  private horrorPopupManager: any;
  private editorEffectsManager: any;

  constructor(_context: vscode.ExtensionContext) {
    console.log('[ContextTriggerManager] Initialized');
  }

  /**
   * Initialize the context trigger manager
   */
  async initialize(): Promise<void> {
    console.log('[ContextTriggerManager] Starting initialization...');
    
    // Initialize keyword triggers (effects will be set later via setEffectManagers)
    this.initializeKeywords();
    
    // Register text change listener
    this.registerTextChangeListener();
    
    this.enabled = true;
    console.log('[ContextTriggerManager] Initialization complete');
  }

  /**
   * Initialize keyword triggers with placeholder effects
   */
  private initializeKeywords(): void {
    const keywords = [
      'kill',
      'dead',
      'death',
      'error',
      'fatal',
      'crash',
      'destroy'
    ];

    this.keywords = keywords.map(word => ({
      word,
      effect: async () => {
        console.log(`[ContextTriggerManager] Placeholder effect for: ${word}`);
      },
      cooldown: this.defaultCooldown,
      lastTriggered: 0,
      probability: this.defaultProbability
    }));

    console.log('[ContextTriggerManager] Initialized keywords:', keywords);
  }

  /**
   * Set effect manager references for triggering effects
   */
  setEffectManagers(
    screenDistortionManager: any,
    horrorPopupManager: any,
    editorEffectsManager: any
  ): void {
    this.screenDistortionManager = screenDistortionManager;
    this.horrorPopupManager = horrorPopupManager;
    this.editorEffectsManager = editorEffectsManager;

    // Now bind actual effects to keywords
    this.bindKeywordEffects();

    console.log('[ContextTriggerManager] Effect managers set and effects bound');
  }

  /**
   * Bind keyword-specific effects
   */
  private bindKeywordEffects(): void {
    const keywordEffectMap: { [key: string]: () => Promise<void> } = {
      'kill': () => this.triggerBloodDrip(),
      'dead': () => this.triggerSkullFlash(),
      'death': () => this.triggerScreenShake(),
      'error': () => this.triggerGlitchEffect(),
      'fatal': () => this.triggerChromaticAberration(),
      'crash': () => this.triggerVHSDistortion(),
      'destroy': () => this.triggerShadowFigure()
    };

    this.keywords.forEach(keyword => {
      const effect = keywordEffectMap[keyword.word];
      if (effect) {
        keyword.effect = effect;
      }
    });

    console.log('[ContextTriggerManager] Keyword effects bound');
  }

  /**
   * Register text change listener
   */
  private registerTextChangeListener(): void {
    if (this.textChangeListener) {
      this.textChangeListener.dispose();
    }

    // Debounce text change handling to reduce overhead
    const debouncedOnTextChange = debounce(this.onTextChange.bind(this), 50);

    this.textChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
      debouncedOnTextChange(event);
    });

    console.log('[ContextTriggerManager] Text change listener registered with debouncing');
  }

  /**
   * Handle text change events
   */
  private onTextChange(event: vscode.TextDocumentChangeEvent): void {
    if (!this.enabled) {
      return;
    }

    // Only monitor active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || activeEditor.document !== event.document) {
      return;
    }

    // Update recent text buffer with changes
    event.contentChanges.forEach(change => {
      if (change.text) {
        this.recentTextBuffer += change.text;
        
        // Keep buffer at max size
        if (this.recentTextBuffer.length > this.bufferSize) {
          this.recentTextBuffer = this.recentTextBuffer.slice(-this.bufferSize);
        }
      }
    });

    // Check for keyword matches
    this.checkForKeywords();
  }

  /**
   * Check recent text for keyword matches
   */
  private checkForKeywords(): void {
    const recentText = this.recentTextBuffer.toLowerCase();

    for (const trigger of this.keywords) {
      if (recentText.includes(trigger.word)) {
        this.attemptTrigger(trigger);
      }
    }
  }

  /**
   * Attempt to trigger a keyword effect
   */
  private async attemptTrigger(trigger: TriggerKeyword): Promise<void> {
    const now = Date.now();

    // Check cooldown
    const timeSinceLastTrigger = now - trigger.lastTriggered;
    if (timeSinceLastTrigger < trigger.cooldown) {
      console.log(`[ContextTriggerManager] Keyword "${trigger.word}" on cooldown`);
      return;
    }

    // Probability check (30% chance)
    if (Math.random() > trigger.probability) {
      console.log(`[ContextTriggerManager] Keyword "${trigger.word}" failed probability check`);
      return;
    }

    // Trigger effect
    console.log(`[ContextTriggerManager] Triggering effect for keyword: ${trigger.word}`);
    trigger.lastTriggered = now;

    try {
      await trigger.effect();
    } catch (error) {
      console.error(`[ContextTriggerManager] Error triggering effect for "${trigger.word}":`, error);
    }
  }

  /**
   * Trigger blood drip effect (for "kill")
   */
  private async triggerBloodDrip(): Promise<void> {
    console.log('[ContextTriggerManager] Triggering blood drip effect');
    
    if (!this.editorEffectsManager) {
      console.warn('[ContextTriggerManager] Editor effects manager not available');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    // Trigger blood drip at current cursor position
    const cursorLine = editor.selection.active.line;
    
    try {
      // Show blood drip effect
      this.editorEffectsManager.showEffects(editor, {
        cobweb: false,
        bloodDrip: true,
        fog: false,
        intensity: 0.8,
        functionsWithErrors: [{
          startLine: cursorLine,
          endLine: cursorLine,
          hasError: true
        }]
      });

      // Clear after 3 seconds
      setTimeout(() => {
        this.editorEffectsManager.clearEffects(editor);
      }, 3000);
    } catch (error) {
      console.error('[ContextTriggerManager] Error showing blood drip:', error);
    }
  }

  /**
   * Trigger skull flash popup (for "dead")
   */
  private async triggerSkullFlash(): Promise<void> {
    console.log('[ContextTriggerManager] Triggering skull flash popup');
    
    if (!this.horrorPopupManager) {
      console.warn('[ContextTriggerManager] Horror popup manager not available');
      return;
    }

    try {
      // Show a brief skull-themed jumpscare
      await this.horrorPopupManager.showRandomJumpscare();
    } catch (error) {
      console.error('[ContextTriggerManager] Error showing skull flash:', error);
    }
  }

  /**
   * Trigger screen shake (for "death")
   */
  private async triggerScreenShake(): Promise<void> {
    console.log('[ContextTriggerManager] Triggering screen shake');
    
    if (!this.screenDistortionManager) {
      console.warn('[ContextTriggerManager] Screen distortion manager not available');
      return;
    }

    try {
      await this.screenDistortionManager.triggerShake(0.6);
    } catch (error) {
      console.error('[ContextTriggerManager] Error triggering screen shake:', error);
    }
  }

  /**
   * Trigger glitch effect (for "error")
   */
  private async triggerGlitchEffect(): Promise<void> {
    console.log('[ContextTriggerManager] Triggering glitch effect');
    
    if (!this.screenDistortionManager) {
      console.warn('[ContextTriggerManager] Screen distortion manager not available');
      return;
    }

    try {
      await this.screenDistortionManager.triggerRandomGlitch();
    } catch (error) {
      console.error('[ContextTriggerManager] Error triggering glitch:', error);
    }
  }

  /**
   * Trigger chromatic aberration (for "fatal")
   */
  private async triggerChromaticAberration(): Promise<void> {
    console.log('[ContextTriggerManager] Triggering chromatic aberration');
    
    if (!this.screenDistortionManager) {
      console.warn('[ContextTriggerManager] Screen distortion manager not available');
      return;
    }

    try {
      await this.screenDistortionManager.triggerChromaticAberration(false);
    } catch (error) {
      console.error('[ContextTriggerManager] Error triggering chromatic aberration:', error);
    }
  }

  /**
   * Trigger VHS distortion (for "crash")
   */
  private async triggerVHSDistortion(): Promise<void> {
    console.log('[ContextTriggerManager] Triggering VHS distortion');
    
    if (!this.screenDistortionManager) {
      console.warn('[ContextTriggerManager] Screen distortion manager not available');
      return;
    }

    try {
      await this.screenDistortionManager.applyVHS(3000);
    } catch (error) {
      console.error('[ContextTriggerManager] Error triggering VHS distortion:', error);
    }
  }

  /**
   * Trigger shadow figure jumpscare (for "destroy")
   */
  private async triggerShadowFigure(): Promise<void> {
    console.log('[ContextTriggerManager] Triggering shadow figure');
    
    if (!this.horrorPopupManager) {
      console.warn('[ContextTriggerManager] Horror popup manager not available');
      return;
    }

    try {
      // Show shadow figure variant specifically
      await this.horrorPopupManager.showRandomJumpscare();
    } catch (error) {
      console.error('[ContextTriggerManager] Error showing shadow figure:', error);
    }
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
    
    if (!enabled) {
      // Clear text buffer when disabled
      this.recentTextBuffer = '';
    }
    
    console.log('[ContextTriggerManager] Enabled:', enabled);
  }

  /**
   * Reset cooldowns (useful for session restart)
   */
  resetCooldowns(): void {
    console.log('[ContextTriggerManager] Resetting all cooldowns');
    
    this.keywords.forEach(keyword => {
      keyword.lastTriggered = 0;
    });
  }

  /**
   * Get current state for debugging
   */
  getState(): {
    enabled: boolean;
    keywords: Array<{ word: string; lastTriggered: number; cooldownRemaining: number }>;
    recentText: string;
  } {
    const now = Date.now();
    
    return {
      enabled: this.enabled,
      keywords: this.keywords.map(k => ({
        word: k.word,
        lastTriggered: k.lastTriggered,
        cooldownRemaining: Math.max(0, k.cooldown - (now - k.lastTriggered))
      })),
      recentText: this.recentTextBuffer
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    console.log('[ContextTriggerManager] Disposing...');
    
    if (this.textChangeListener) {
      this.textChangeListener.dispose();
      this.textChangeListener = undefined;
    }
    
    this.enabled = false;
    this.recentTextBuffer = '';
    this.keywords = [];
    
    console.log('[ContextTriggerManager] Disposed');
  }
}
