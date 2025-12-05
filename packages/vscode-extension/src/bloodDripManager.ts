/**
 * Blood Drip Manager
 * 
 * Creates blood dripping effect from cursor position as the user types.
 * Blood drops fall downward with gravity animation.
 */

import * as vscode from 'vscode';
import { IEffectManager } from './horrorEngine';

interface BloodDrop {
  decoration: vscode.TextEditorDecorationType;
  range: vscode.Range;
}

export class BloodDripManager implements IEffectManager {
  private enabled: boolean = false;
  private disposed: boolean = false;
  private initialized: boolean = false;
  private activeDecorations: BloodDrop[] = [];
  private keystrokeCounter = -1;
  private counterTimeout: NodeJS.Timeout | undefined;
  private changeListener: vscode.Disposable | undefined;

  // Configuration
  private readonly MAX_BLOOD_DROPS = 25;
  private readonly DRIP_FREQUENCY = 1; // Every keystroke
  private readonly DRIP_DURATION = 700; // 0.7 seconds (faster cleanup)
  private readonly DRIP_SIZE = 1.5; // Smaller for consistency

  constructor(private context: vscode.ExtensionContext) {
    console.log('[BloodDripManager] Created');
  }

  /**
   * Initialize the blood drip manager
   */
  async initialize(): Promise<void> {
    if (this.disposed) {
      console.warn('[BloodDripManager] Cannot initialize - already disposed');
      return;
    }
    
    if (this.initialized) {
      console.log('[BloodDripManager] Already initialized, skipping');
      return;
    }
    this.initialized = true;

    console.log('[BloodDripManager] Initializing...');
    
    // Listen to text document changes
    this.changeListener = vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument);
  }

  /**
   * Enable blood drip effect
   */
  setEnabled(enabled: boolean): void {
    console.log('[BloodDripManager] setEnabled:', enabled);
    this.enabled = enabled;

    if (!enabled) {
      this.clearAllDrops();
    }
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Handle text document changes
   */
  private onDidChangeTextDocument = (event: vscode.TextDocumentChangeEvent) => {
    console.log('[BloodDripManager] Document changed, enabled:', this.enabled, 'disposed:', this.disposed);
    
    if (!this.enabled || this.disposed) {
      console.log('[BloodDripManager] Skipping - not enabled or disposed');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor || event.document !== editor.document) {
      console.log('[BloodDripManager] Skipping - no editor or different document');
      return;
    }

    // Only trigger on actual content changes (not just cursor movement)
    if (event.contentChanges.length === 0) {
      console.log('[BloodDripManager] Skipping - no content changes');
      return;
    }

    const changes = event.contentChanges[0];
    console.log('[BloodDripManager] Content changed:', changes.text);
    
    // If the content change is empty then it was likely a delete
    // This means there may not be text after the cursor, so do the
    // drip before instead.
    const left = changes && changes.text.length === 0;
    
    this.triggerBloodDrip(editor, left);
  }

  /**
   * Trigger blood drip at cursor position
   */
  private triggerBloodDrip(editor: vscode.TextEditor, left = false): void {
    const cursorPosition = editor.selection.active;
    
    // When typing, cursor is AFTER the character. For blood, we want it ON the character just typed.
    // So we need to go back one character when inserting (left=false)
    let targetChar = cursorPosition.character;
    if (!left && targetChar > 0) {
      // Move back one character to the one we just typed
      targetChar = targetChar - 1;
    }
    
    const targetPosition = cursorPosition.with(cursorPosition.line, targetChar);
    const newRange = new vscode.Range(
      targetPosition,
      targetPosition.with(targetPosition.line, targetChar + 1)
    );

    console.log('[BloodDripManager] Blood drip at line', targetPosition.line, 'char', targetChar);

    // Dispose excess blood drops
    while (this.activeDecorations.length >= this.MAX_BLOOD_DROPS) {
      const oldDrop = this.activeDecorations.shift();
      if (oldDrop) {
        oldDrop.decoration.dispose();
      }
    }

    // Create blood drip decoration
    const decoration = this.createBloodDripDecoration();
    if (!decoration) {
      console.error('[BloodDripManager] Failed to create decoration!');
      return;
    }

    const bloodDrop: BloodDrop = { decoration, range: newRange };
    this.activeDecorations.push(bloodDrop);

    // Remove after duration
    setTimeout(() => {
      decoration.dispose();
      const index = this.activeDecorations.findIndex(d => d.decoration === decoration);
      if (index > -1) {
        this.activeDecorations.splice(index, 1);
      }
    }, this.DRIP_DURATION);

    editor.setDecorations(decoration, [newRange]);
  }

  /**
   * Create blood drip decoration type
   */
  private createBloodDripDecoration(): vscode.TextEditorDecorationType {
    // Use a unique ID for the gradient to avoid conflicts
    const gradientId = `bloodGrad${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    // Blood drop SVG with embedded CSS animation
    const bloodDropSvg = `data:image/svg+xml;base64,${Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="32" viewBox="0 0 16 32">
        <style>
          @keyframes fall {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(24px); opacity: 0; }
          }
          .drop { animation: fall 0.6s ease-in forwards; }
        </style>
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#8B0000;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#DC143C;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8B0000;stop-opacity:0.8" />
          </linearGradient>
        </defs>
        <g class="drop">
          <ellipse cx="8" cy="4" rx="3" ry="4" fill="url(#${gradientId})"/>
          <ellipse cx="8" cy="2" rx="1.5" ry="2" fill="#DC143C" opacity="0.6"/>
        </g>
      </svg>
    `).toString('base64')}`;

    // Use 'after' decoration which renders AFTER the character
    // This makes it appear at each character position naturally
    return vscode.window.createTextEditorDecorationType({
      after: {
        contentText: '',
        textDecoration: `none; 
          display: inline-block;
          width: 1ch;
          height: 2em;
          margin-left: -1ch;
          vertical-align: top;
          background-image: url("${bloodDropSvg}");
          background-repeat: no-repeat;
          background-position: center top;
          background-size: 1ch 2em;
          pointer-events: none;
          z-index: 100;`,
      },
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
    });
  }

  /**
   * Convert CSS object to string
   */
  private objectToCssString(settings: { [key: string]: string | number }): string {
    return Object.keys(settings)
      .map(setting => {
        const value = settings[setting];
        if (typeof value === 'string' || typeof value === 'number') {
          return `${setting}: ${value};`;
        }
        return '';
      })
      .join(' ');
  }

  /**
   * Clear all blood drops
   */
  private clearAllDrops(): void {
    console.log('[BloodDripManager] Clearing all blood drops');
    
    while (this.activeDecorations.length > 0) {
      const bloodDrop = this.activeDecorations.shift();
      if (bloodDrop) {
        bloodDrop.decoration.dispose();
      }
    }
  }

  /**
   * Dispose the manager
   */
  dispose(): void {
    console.log('[BloodDripManager] Disposing...');
    
    this.disposed = true;
    this.enabled = false;
    
    if (this.counterTimeout) {
      clearTimeout(this.counterTimeout);
    }
    
    if (this.changeListener) {
      this.changeListener.dispose();
    }
    
    this.clearAllDrops();
  }
}
