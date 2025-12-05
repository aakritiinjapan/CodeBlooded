/**
 * Whispering Variables Manager - Overlays creepy alternative names on variables
 * 
 * Creates unsettling decorations that temporarily replace variable names with
 * disturbing alternatives, making the code feel "corrupted" or "possessed".
 */

import * as vscode from 'vscode';

/**
 * Whisper mapping for tracking active whispers
 */
export interface WhisperMapping {
  original: string;
  whisper: string;
  position: vscode.Range;
  expiresAt: number;
  decoration: vscode.TextEditorDecorationType;
}

/**
 * Variable match in document
 */
interface VariableMatch {
  text: string;
  range: vscode.Range;
}

/**
 * Whispering Variables Manager
 */
export class WhisperingVariablesManager {
  private enabled: boolean = false;
  private activeWhispers: WhisperMapping[] = [];
  private maxSimultaneousWhispers: number = 2;
  private minDuration: number = 1000; // 1 second
  private maxDuration: number = 3000; // 3 seconds
  private lastTriggerTime: number = 0;
  private cooldownMs: number = 30000; // 30 seconds between whisper events
  private themeCompatibilityManager: any; // Reference to ThemeCompatibilityManager

  // Whisper mapping dictionary
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
    ['index', 'marked'],
    ['item', 'sacrifice'],
    ['list', 'condemned'],
    ['array', 'trapped'],
    ['object', 'vessel'],
    ['string', 'whisper'],
    ['number', 'curse'],
    ['boolean', 'lie'],
    ['function', 'ritual'],
    ['method', 'spell'],
    ['class', 'coven'],
    ['variable', 'haunted'],
    ['parameter', 'offering'],
    ['argument', 'plea'],
    ['return', 'escape'],
    ['callback', 'summon'],
    ['promise', 'pact'],
    ['async', 'eternal'],
    ['await', 'trapped'],
    ['response', 'echo'],
    ['request', 'prayer'],
    ['message', 'warning'],
    ['status', 'omen'],
    ['code', 'hex'],
    ['key', 'lock'],
    ['token', 'mark'],
    ['session', 'possession'],
    ['state', 'limbo'],
    ['context', 'void'],
    ['config', 'grimoire'],
    ['options', 'choices'],
    ['settings', 'bindings']
  ]);

  constructor(_context: vscode.ExtensionContext) {
    console.log('[WhisperingVariablesManager] Initialized');
  }

  /**
   * Set theme compatibility manager reference
   */
  setThemeCompatibilityManager(themeCompatibilityManager: any): void {
    this.themeCompatibilityManager = themeCompatibilityManager;
  }

  /**
   * Initialize the whispering variables manager
   */
  async initialize(): Promise<void> {
    console.log('[WhisperingVariablesManager] Starting initialization...');
    this.enabled = true;
    console.log('[WhisperingVariablesManager] Initialization complete');
  }

  /**
   * Check if whispering is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable/disable whispering
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log('[WhisperingVariablesManager] Enabled:', enabled);
    
    if (!enabled) {
      // Clean up any active whispers
      this.clearAllWhispers();
    }
  }

  /**
   * Check if whisper can be triggered based on intensity
   */
  canTrigger(intensity: number): boolean {
    // Check if enabled
    if (!this.isEnabled()) {
      return false;
    }

    // Check intensity threshold (must be > 60%)
    if (intensity <= 60) {
      return false;
    }

    // Check if we're at max simultaneous whispers
    if (this.activeWhispers.length >= this.maxSimultaneousWhispers) {
      return false;
    }

    // Check cooldown
    const timeSinceLastTrigger = Date.now() - this.lastTriggerTime;
    if (timeSinceLastTrigger < this.cooldownMs) {
      return false;
    }

    // Random probability (30% chance)
    if (Math.random() > 0.3) {
      return false;
    }

    return true;
  }

  /**
   * Trigger a whisper effect
   */
  async applyWhisper(): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.log('[WhisperingVariablesManager] No active editor');
      return false;
    }

    try {
      console.log('[WhisperingVariablesManager] Applying whisper effect');

      // Find variables in current view
      const variables = this.findVariablesInView(editor);
      if (variables.length === 0) {
        console.log('[WhisperingVariablesManager] No matching variables found');
        return false;
      }

      // Select random variable
      const target = variables[Math.floor(Math.random() * variables.length)];
      const whisper = this.whisperMap.get(target.text) || 'unknown';

      console.log('[WhisperingVariablesManager] Whispering:', target.text, '->', whisper);

      // Create decoration overlay
      const decoration = this.createWhisperDecoration(whisper, target.text);
      editor.setDecorations(decoration, [target.range]);

      // Calculate expiration time (1-3 seconds)
      const duration = Math.random() * (this.maxDuration - this.minDuration) + this.minDuration;
      const expiresAt = Date.now() + duration;

      // Store mapping
      const mapping: WhisperMapping = {
        original: target.text,
        whisper,
        position: target.range,
        expiresAt,
        decoration
      };
      this.activeWhispers.push(mapping);

      // Update last trigger time
      this.lastTriggerTime = Date.now();

      // Schedule removal
      setTimeout(() => {
        this.removeWhisper(mapping);
      }, duration);

      return true;
    } catch (error) {
      console.error('[WhisperingVariablesManager] Error applying whisper:', error);
      return false;
    }
  }

  /**
   * Find variables in visible editor range
   */
  private findVariablesInView(editor: vscode.TextEditor): VariableMatch[] {
    const variables: VariableMatch[] = [];
    const document = editor.document;
    
    // Get visible range
    const visibleRanges = editor.visibleRanges;
    if (visibleRanges.length === 0) {
      return variables;
    }

    // Use regex to find variable-like identifiers
    // Matches: lowercase start, followed by alphanumeric (camelCase, snake_case)
    const regex = /\b[a-z][a-zA-Z0-9_]*\b/g;

    // Search in each visible range
    for (const visibleRange of visibleRanges) {
      const text = document.getText(visibleRange);
      let match;

      while ((match = regex.exec(text)) !== null) {
        const matchedText = match[0];
        
        // Check if this variable is in our whisper map
        if (this.whisperMap.has(matchedText)) {
          // Calculate position in document
          const startPos = document.positionAt(
            document.offsetAt(visibleRange.start) + match.index
          );
          const endPos = startPos.translate(0, matchedText.length);
          const range = new vscode.Range(startPos, endPos);

          variables.push({ text: matchedText, range });
        }
      }
    }

    return variables;
  }

  /**
   * Create whisper decoration with creepy styling
   */
  private createWhisperDecoration(
    whisperText: string,
    _originalText: string
  ): vscode.TextEditorDecorationType {
    // Get theme-adjusted colors
    const adjustments = this.themeCompatibilityManager 
      ? this.themeCompatibilityManager.getHorrorColorAdjustments()
      : { whisperColor: '#DC143C', bloodColor: '#8B0000' };
    
    const opacity = this.themeCompatibilityManager
      ? this.themeCompatibilityManager.getAdjustedOpacity(0.8)
      : 0.8;
    
    // Convert hex to rgba
    const whisperColorRgba = this.hexToRgba(adjustments.whisperColor, opacity);
    const bloodColorRgba = this.hexToRgba(adjustments.bloodColor, 0.1);
    const borderColorRgba = this.hexToRgba(adjustments.whisperColor, 0.2);
    
    return vscode.window.createTextEditorDecorationType({
      // Overlay whisper text before the original
      before: {
        contentText: whisperText,
        color: whisperColorRgba,
        fontStyle: 'italic',
        fontWeight: 'bold',
        textDecoration: `none; position: absolute; margin-left: 0; animation: whisperFade 0.3s ease-in;`
      },
      // Fade out the original text
      textDecoration: 'none;',
      opacity: '0.2',
      // Add subtle glow effect
      backgroundColor: bloodColorRgba,
      border: `1px solid ${borderColorRgba}`,
      borderRadius: '2px'
    });
  }

  /**
   * Convert hex color to rgba
   */
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Remove a whisper decoration
   */
  private removeWhisper(mapping: WhisperMapping): void {
    try {
      // Dispose the decoration
      mapping.decoration.dispose();

      // Remove from active list
      const index = this.activeWhispers.indexOf(mapping);
      if (index > -1) {
        this.activeWhispers.splice(index, 1);
      }

      console.log('[WhisperingVariablesManager] Removed whisper:', mapping.original);
    } catch (error) {
      console.error('[WhisperingVariablesManager] Error removing whisper:', error);
    }
  }

  /**
   * Clear all active whispers
   */
  clearAllWhispers(): void {
    console.log('[WhisperingVariablesManager] Clearing all whispers');

    for (const mapping of this.activeWhispers) {
      try {
        mapping.decoration.dispose();
      } catch (error) {
        console.error('[WhisperingVariablesManager] Error disposing decoration:', error);
      }
    }

    this.activeWhispers = [];
  }

  /**
   * Get current state for debugging
   */
  getState(): {
    enabled: boolean;
    activeWhispers: number;
    lastTriggerTime: number;
  } {
    return {
      enabled: this.enabled,
      activeWhispers: this.activeWhispers.length,
      lastTriggerTime: this.lastTriggerTime
    };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    console.log('[WhisperingVariablesManager] Disposing...');
    this.clearAllWhispers();
    this.enabled = false;
    console.log('[WhisperingVariablesManager] Disposed');
  }
}
