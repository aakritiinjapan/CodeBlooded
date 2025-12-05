/**
 * Phantom Typing Manager - Creates unsettling phantom typing events
 * 
 * Safely inserts and removes text to simulate external typing, creating
 * genuine unease about control over code. All changes are temporary and
 * automatically restored.
 */

import * as vscode from 'vscode';

/**
 * Phantom state for tracking changes
 */
export interface PhantomState {
  originalText: string;
  position: vscode.Position;
  insertedText: string;
  timestamp: number;
  documentUri: string;
  documentVersion: number;
}

/**
 * Phantom Typing Manager
 */
export class PhantomTypingManager {
  private enabled: boolean = false;
  private activePhantoms: PhantomState[] = [];
  private maxDuration = 1500; // 1.5 seconds max
  private minDuration = 500; // 0.5 seconds min
  private lastTriggerTime: number = 0;
  private cooldownMs: number = 60000; // 60 seconds
  private failureCount: number = 0;
  private maxFailures: number = 3;
  private sessionDisabled: boolean = false;
  
  // Red text decoration for phantom typing
  private phantomDecorationType: vscode.TextEditorDecorationType;

  // Creepy phantom texts - psychological horror themed
  private phantomTexts: string[] = [
    '...',
    'behind you',
    'watching',
    'don\'t turn around',
    'it sees you',
    'run',
    'too late',
    'help',
    'trapped',
    'not alone',
    'in the mirror',
    'look closer',
    'do you see it',
    'it\'s here',
    'can\'t escape',
    '👁️',
    'why did you look',
    'wrong reality',
    'let me in',
    'almost through',
    'don\'t blink',
    'we see you',
    'look behind',
    'it follows',
    'no way out'
  ];

  constructor(_context: vscode.ExtensionContext) {
    console.log('[PhantomTypingManager] Initialized');
    
    // Create red text decoration for phantom typing
    this.phantomDecorationType = vscode.window.createTextEditorDecorationType({
      color: '#FF0000', // Bright red
      fontWeight: 'bold',
      fontStyle: 'italic'
    });
  }

  /**
   * Initialize the phantom typing manager
   */
  async initialize(): Promise<void> {
    console.log('[PhantomTypingManager] Starting initialization...');
    this.enabled = true;
    console.log('[PhantomTypingManager] Initialization complete');
  }

  /**
   * Check if phantom typing is enabled
   */
  isEnabled(): boolean {
    return this.enabled && !this.sessionDisabled;
  }

  /**
   * Enable phantom typing
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log('[PhantomTypingManager] Enabled:', enabled);
    
    if (!enabled) {
      // Clean up any active phantoms
      this.restoreAll().catch(err => {
        console.error('[PhantomTypingManager] Error during cleanup:', err);
      });
    }
  }

  /**
   * Check if phantom typing can be triggered
   */
  canTrigger(intensity: number): boolean {
    // Check if enabled
    if (!this.isEnabled()) {
      return false;
    }

    // Check if session is disabled due to failures
    if (this.sessionDisabled) {
      return false;
    }

    // Check intensity threshold (must be > 50%)
    if (intensity <= 50) {
      return false;
    }

    // Check cooldown (60 seconds between events)
    const timeSinceLastTrigger = Date.now() - this.lastTriggerTime;
    if (timeSinceLastTrigger < this.cooldownMs) {
      return false;
    }

    // Dynamic probability: 60% normally, but reduced to 20% if triggered in last 5 minutes
    const fiveMinutesMs = 5 * 60 * 1000;
    const recentlyTriggered = this.lastTriggerTime > 0 && timeSinceLastTrigger < fiveMinutesMs;
    const probability = recentlyTriggered ? 0.2 : 0.6;
    
    if (Math.random() > probability) {
      return false;
    }

    return true;
  }

  /**
   * Trigger a phantom typing event
   */
  async triggerPhantomTyping(): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.log('[PhantomTypingManager] No active editor');
      return false;
    }

    try {
      console.log('[PhantomTypingManager] Triggering phantom typing event');

      // Store original state
      const position = editor.selection.active;
      const originalText = editor.document.getText();
      const documentUri = editor.document.uri.toString();
      const documentVersion = editor.document.version;

      // Generate phantom text
      const phantomText = this.getRandomPhantomText();

      // Type character by character for creepy effect
      let insertedLength = 0;
      const typingDelay = 80 + Math.random() * 120; // 80-200ms between characters

      for (let i = 0; i < phantomText.length; i++) {
        const char = phantomText[i];
        const currentEditor = vscode.window.activeTextEditor;
        
        // Check if editor is still valid and same document
        if (!currentEditor || currentEditor.document.uri.toString() !== documentUri) {
          console.log('[PhantomTypingManager] Editor changed, stopping phantom typing');
          break;
        }

        // Calculate position for this character (original position + characters typed so far)
        const insertPosition = position.translate(0, insertedLength);

        const success = await currentEditor.edit(editBuilder => {
          editBuilder.insert(insertPosition, char);
        });

        if (!success) {
          console.warn('[PhantomTypingManager] Failed to insert character:', char);
          break;
        }

        insertedLength++;

        // Wait before next character (variable delay for more realistic typing)
        if (i < phantomText.length - 1) {
          await new Promise(resolve => setTimeout(resolve, typingDelay + Math.random() * 50));
        }
      }

      if (insertedLength === 0) {
        console.warn('[PhantomTypingManager] No characters inserted');
        this.handleFailure();
        return false;
      }

      console.log('[PhantomTypingManager] Finished typing phantom text:', phantomText.substring(0, insertedLength));

      // Store state for restoration (only the characters we actually inserted)
      const state: PhantomState = {
        originalText,
        position,
        insertedText: phantomText.substring(0, insertedLength),
        timestamp: Date.now(),
        documentUri,
        documentVersion
      };
      this.activePhantoms.push(state);

      // Update last trigger time
      this.lastTriggerTime = Date.now();

      // Schedule removal (1-2 seconds after typing completes)
      const duration = 1000 + Math.random() * 1000;
      setTimeout(() => {
        this.removePhantomAnimated(state).catch(err => {
          console.error('[PhantomTypingManager] Error removing phantom:', err);
          this.handleFailure();
        });
      }, duration);

      return true;
    } catch (error) {
      console.error('[PhantomTypingManager] Error during phantom typing:', error);
      this.handleFailure();
      return false;
    }
  }

  /**
   * Remove phantom text with backspace animation
   */
  private async removePhantomAnimated(state: PhantomState): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.warn('[PhantomTypingManager] No active editor for removal');
      return;
    }

    // Check if we're still in the same document
    if (editor.document.uri.toString() !== state.documentUri) {
      console.log('[PhantomTypingManager] Document changed, skipping removal');
      this.removeFromActiveList(state);
      return;
    }

    try {
      const textLength = state.insertedText.length;
      const deleteDelay = 50 + Math.random() * 80; // 50-130ms between deletions (faster than typing)

      // Delete character by character from end to start (like backspace)
      for (let i = textLength - 1; i >= 0; i--) {
        const currentEditor = vscode.window.activeTextEditor;
        
        if (!currentEditor || currentEditor.document.uri.toString() !== state.documentUri) {
          console.log('[PhantomTypingManager] Editor changed, stopping removal');
          break;
        }

        // Calculate the position of the character to delete
        const charPosition = state.position.translate(0, i);
        const charEndPosition = state.position.translate(0, i + 1);
        const range = new vscode.Range(charPosition, charEndPosition);

        // Verify the character matches
        const currentChar = currentEditor.document.getText(range);
        if (currentChar !== state.insertedText[i]) {
          console.warn('[PhantomTypingManager] Character mismatch at position', i, 'expected:', state.insertedText[i], 'got:', currentChar);
          // Try to continue anyway with remaining characters
          continue;
        }

        const success = await currentEditor.edit(editBuilder => {
          editBuilder.delete(range);
        });

        if (!success) {
          console.warn('[PhantomTypingManager] Failed to delete character at position', i);
          break;
        }

        // Wait before next deletion
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, deleteDelay));
        }
      }

      console.log('[PhantomTypingManager] Successfully removed phantom text with animation');
      this.removeFromActiveList(state);
    } catch (error) {
      console.error('[PhantomTypingManager] Error removing phantom:', error);
      this.handleFailure();
      
      // Fallback: try to remove all at once
      await this.removePhantom(state);
    }
  }

  /**
   * Remove a phantom text (instant removal - fallback)
   */
  private async removePhantom(state: PhantomState): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.warn('[PhantomTypingManager] No active editor for removal');
      return;
    }

    // Check if we're still in the same document
    if (editor.document.uri.toString() !== state.documentUri) {
      console.log('[PhantomTypingManager] Document changed, skipping removal');
      this.removeFromActiveList(state);
      return;
    }

    try {
      // Calculate range to delete
      const endPosition = state.position.translate(0, state.insertedText.length);
      const range = new vscode.Range(state.position, endPosition);

      // Verify the text at the position matches what we inserted
      const currentText = editor.document.getText(range);
      if (currentText !== state.insertedText) {
        console.warn('[PhantomTypingManager] Text mismatch, user may have edited. Skipping removal.');
        this.removeFromActiveList(state);
        return;
      }

      // Remove phantom text
      const success = await editor.edit(editBuilder => {
        editBuilder.delete(range);
      });

      if (success) {
        console.log('[PhantomTypingManager] Successfully removed phantom text');
        this.removeFromActiveList(state);
      } else {
        console.warn('[PhantomTypingManager] Failed to remove phantom text');
        this.handleFailure();
        
        // Show notification to user
        vscode.window.showWarningMessage(
          'codeblooded: Failed to restore phantom text. Use "Emergency Restore" if needed.'
        );
      }
    } catch (error) {
      console.error('[PhantomTypingManager] Error removing phantom:', error);
      this.handleFailure();
      
      // Show notification to user
      vscode.window.showWarningMessage(
        'codeblooded: Phantom typing restoration failed. Your code is safe, but you may see extra characters.'
      );
    }
  }

  /**
   * Remove state from active list
   */
  private removeFromActiveList(state: PhantomState): void {
    const index = this.activePhantoms.indexOf(state);
    if (index > -1) {
      this.activePhantoms.splice(index, 1);
    }
  }

  /**
   * Get random phantom text
   */
  private getRandomPhantomText(): string {
    return this.phantomTexts[Math.floor(Math.random() * this.phantomTexts.length)];
  }

  /**
   * Type a specific custom message (for Easter eggs)
   * Unlike triggerPhantomTyping, this ignores cooldowns and can be called directly
   */
  async typeCustomMessage(message: string): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.log('[PhantomTypingManager] No active editor for custom message');
      return false;
    }

    if (!this.enabled) {
      console.log('[PhantomTypingManager] Not enabled, enabling temporarily for custom message');
    }

    try {
      console.log('[PhantomTypingManager] Typing custom message:', message);

      // Store original state
      const position = editor.selection.active;
      const originalText = editor.document.getText();
      const documentUri = editor.document.uri.toString();
      const documentVersion = editor.document.version;

      // Type character by character for creepy effect
      let insertedLength = 0;
      const typingDelay = 60 + Math.random() * 100; // Slightly faster for response messages

      for (let i = 0; i < message.length; i++) {
        const char = message[i];
        const currentEditor = vscode.window.activeTextEditor;
        
        if (!currentEditor || currentEditor.document.uri.toString() !== documentUri) {
          console.log('[PhantomTypingManager] Editor changed, stopping custom message');
          break;
        }

        const insertPosition = position.translate(0, insertedLength);

        const success = await currentEditor.edit(editBuilder => {
          editBuilder.insert(insertPosition, char);
        });

        if (!success) {
          console.warn('[PhantomTypingManager] Failed to insert character:', char);
          break;
        }

        insertedLength++;
        
        // Apply red decoration to the typed text so far
        const endPosition = position.translate(0, insertedLength);
        const range = new vscode.Range(position, endPosition);
        currentEditor.setDecorations(this.phantomDecorationType, [range]);

        if (i < message.length - 1) {
          await new Promise(resolve => setTimeout(resolve, typingDelay + Math.random() * 40));
        }
      }

      if (insertedLength === 0) {
        console.warn('[PhantomTypingManager] No characters inserted for custom message');
        return false;
      }

      console.log('[PhantomTypingManager] Finished typing custom message');

      // Store state for restoration
      const state: PhantomState = {
        originalText,
        position,
        insertedText: message.substring(0, insertedLength),
        timestamp: Date.now(),
        documentUri,
        documentVersion
      };
      this.activePhantoms.push(state);

      // Schedule removal (2-3 seconds for custom messages so user can read them)
      const duration = 2000 + Math.random() * 1000;
      setTimeout(() => {
        // Clear the red decoration before removing
        const currentEditor = vscode.window.activeTextEditor;
        if (currentEditor) {
          currentEditor.setDecorations(this.phantomDecorationType, []);
        }
        this.removePhantomAnimated(state).catch(err => {
          console.error('[PhantomTypingManager] Error removing custom message:', err);
        });
      }, duration);

      return true;
    } catch (error) {
      console.error('[PhantomTypingManager] Error typing custom message:', error);
      return false;
    }
  }

  /**
   * Handle failure - track and disable if too many failures
   */
  private handleFailure(): void {
    this.failureCount++;
    console.warn('[PhantomTypingManager] Failure count:', this.failureCount);

    if (this.failureCount >= this.maxFailures) {
      console.error('[PhantomTypingManager] Too many failures, disabling for session');
      this.sessionDisabled = true;
      
      vscode.window.showWarningMessage(
        'codeblooded: Phantom typing disabled due to repeated failures. Your code is safe.'
      );
    }
  }

  /**
   * Emergency restore all phantom texts
   */
  async restoreAll(): Promise<void> {
    console.log('[PhantomTypingManager] Emergency restore all phantoms');

    const phantomsToRestore = [...this.activePhantoms];
    this.activePhantoms = [];

    for (const state of phantomsToRestore) {
      try {
        await this.removePhantom(state);
      } catch (error) {
        console.error('[PhantomTypingManager] Error during emergency restore:', error);
      }
    }

    console.log('[PhantomTypingManager] Emergency restore complete');
  }

  /**
   * Get current state for debugging
   */
  getState(): {
    enabled: boolean;
    sessionDisabled: boolean;
    activePhantoms: number;
    failureCount: number;
    lastTriggerTime: number;
  } {
    return {
      enabled: this.enabled,
      sessionDisabled: this.sessionDisabled,
      activePhantoms: this.activePhantoms.length,
      failureCount: this.failureCount,
      lastTriggerTime: this.lastTriggerTime
    };
  }

  /**
   * Reset session state (for testing or after long inactivity)
   */
  resetSession(): void {
    console.log('[PhantomTypingManager] Resetting session');
    this.failureCount = 0;
    this.sessionDisabled = false;
    this.lastTriggerTime = 0;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    console.log('[PhantomTypingManager] Disposing...');
    
    // Restore all active phantoms
    this.restoreAll().catch(err => {
      console.error('[PhantomTypingManager] Error during disposal:', err);
    });
    
    this.enabled = false;
    this.activePhantoms = [];
    
    console.log('[PhantomTypingManager] Disposed');
  }
}
