/**
 * Heartbeat Pulse Manager
 * 
 * Creates a pulsing red heartbeat effect on the line where the user is typing.
 * The pulse intensifies with faster typing.
 */

import * as vscode from 'vscode';
import { IEffectManager } from './horrorEngine';

interface PulseState {
  decoration: vscode.TextEditorDecorationType;
  line: number;
  pulsePhase: number;
  intensity: number;
}

export class HeartbeatPulseManager implements IEffectManager {
  private enabled: boolean = false;
  private disposed: boolean = false;
  private changeListener: vscode.Disposable | undefined;
  private cursorListener: vscode.Disposable | undefined;
  private pulseInterval: NodeJS.Timeout | undefined;
  private currentPulse: PulseState | null = null;
  private lastTypingTime: number = 0;
  private typingSpeed: number = 0; // Characters per second
  private recentKeystrokes: number[] = [];

  // Configuration
  private readonly PULSE_INTERVAL = 100; // Update every 100ms for smooth animation
  private readonly BASE_PULSE_SPEED = 1.0; // Base heartbeat speed (beats per second)
  private readonly MAX_PULSE_SPEED = 3.0; // Maximum heartbeat speed when typing fast
  private readonly PULSE_DECAY = 0.95; // How fast the intensity decays
  private readonly MIN_INTENSITY = 0.1; // Minimum pulse intensity
  private readonly MAX_INTENSITY = 0.8; // Maximum pulse intensity

  constructor(private context: vscode.ExtensionContext) {
    console.log('[HeartbeatPulseManager] Created');
  }

  /**
   * Initialize the heartbeat pulse manager
   */
  async initialize(): Promise<void> {
    if (this.disposed) {
      console.warn('[HeartbeatPulseManager] Cannot initialize - already disposed');
      return;
    }

    console.log('[HeartbeatPulseManager] Initializing...');
    
    // Listen to text document changes
    this.changeListener = vscode.workspace.onDidChangeTextDocument(
      this.onDidChangeTextDocument.bind(this)
    );

    // Listen to cursor position changes
    this.cursorListener = vscode.window.onDidChangeTextEditorSelection(
      this.onDidChangeSelection.bind(this)
    );
  }

  /**
   * Enable heartbeat pulse effect
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[HeartbeatPulseManager] ${enabled ? 'Enabled' : 'Disabled'}`);
    
    if (enabled) {
      this.startPulseAnimation();
    } else {
      this.stopPulseAnimation();
    }
  }

  /**
   * Check if manager is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Handle text document changes
   */
  private onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent): void {
    if (!this.enabled || this.disposed) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== event.document) {
      return;
    }

    // Track typing speed
    const now = Date.now();
    this.recentKeystrokes.push(now);
    
    // Keep only keystrokes from last second
    this.recentKeystrokes = this.recentKeystrokes.filter(t => now - t < 1000);
    this.typingSpeed = this.recentKeystrokes.length;
    
    this.lastTypingTime = now;

    // Update intensity based on typing speed
    if (this.currentPulse) {
      const speedFactor = Math.min(this.typingSpeed / 10, 1); // Normalize to 0-1
      this.currentPulse.intensity = Math.min(
        this.MIN_INTENSITY + speedFactor * (this.MAX_INTENSITY - this.MIN_INTENSITY),
        this.MAX_INTENSITY
      );
    }

    // Update the line we're pulsing
    this.updatePulseLine(editor);
  }

  /**
   * Handle cursor selection changes
   */
  private onDidChangeSelection(event: vscode.TextEditorSelectionChangeEvent): void {
    if (!this.enabled || this.disposed) {
      return;
    }

    this.updatePulseLine(event.textEditor);
  }

  /**
   * Update the line that should be pulsing
   */
  private updatePulseLine(editor: vscode.TextEditor): void {
    const currentLine = editor.selection.active.line;

    if (!this.currentPulse || this.currentPulse.line !== currentLine) {
      // Clear old decoration
      if (this.currentPulse) {
        this.currentPulse.decoration.dispose();
      }

      // Create new pulse state
      this.currentPulse = {
        decoration: this.createPulseDecoration(0, this.MIN_INTENSITY),
        line: currentLine,
        pulsePhase: 0,
        intensity: this.MIN_INTENSITY,
      };
    }
  }

  /**
   * Start the pulse animation loop
   */
  private startPulseAnimation(): void {
    if (this.pulseInterval) {
      return;
    }

    this.pulseInterval = setInterval(() => {
      this.animatePulse();
    }, this.PULSE_INTERVAL);
  }

  /**
   * Stop the pulse animation loop
   */
  private stopPulseAnimation(): void {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = undefined;
    }

    if (this.currentPulse) {
      this.currentPulse.decoration.dispose();
      this.currentPulse = null;
    }
  }

  /**
   * Animate the pulse effect
   */
  private animatePulse(): void {
    if (!this.currentPulse || !this.enabled) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    // Calculate pulse speed based on typing speed
    const speedFactor = Math.min(this.typingSpeed / 10, 1);
    const pulseSpeed = this.BASE_PULSE_SPEED + speedFactor * (this.MAX_PULSE_SPEED - this.BASE_PULSE_SPEED);

    // Update pulse phase (0 to 2π for full heartbeat cycle)
    this.currentPulse.pulsePhase += (pulseSpeed * this.PULSE_INTERVAL / 1000) * Math.PI * 2;
    if (this.currentPulse.pulsePhase > Math.PI * 2) {
      this.currentPulse.pulsePhase -= Math.PI * 2;
    }

    // Decay intensity when not typing
    const timeSinceTyping = Date.now() - this.lastTypingTime;
    if (timeSinceTyping > 500) {
      this.currentPulse.intensity *= this.PULSE_DECAY;
      if (this.currentPulse.intensity < this.MIN_INTENSITY) {
        this.currentPulse.intensity = this.MIN_INTENSITY;
      }
    }

    // Calculate current brightness using heartbeat pattern (double bump)
    const heartbeatValue = this.calculateHeartbeatValue(this.currentPulse.pulsePhase);
    const brightness = heartbeatValue * this.currentPulse.intensity;

    // Update decoration
    this.currentPulse.decoration.dispose();
    this.currentPulse.decoration = this.createPulseDecoration(brightness, this.currentPulse.intensity);

    // Apply decoration to current line
    const line = this.currentPulse.line;
    
    // Validate line number before accessing
    if (line < 0 || line >= editor.document.lineCount) {
      return;
    }
    
    const lineLength = editor.document.lineAt(line).text.length;
    const range = new vscode.Range(line, 0, line, lineLength);
    
    editor.setDecorations(this.currentPulse.decoration, [range]);
  }

  /**
   * Calculate heartbeat waveform value (0-1)
   * Creates a double-bump pattern like a real heartbeat
   */
  private calculateHeartbeatValue(phase: number): number {
    // Normalize phase to 0-1
    const t = phase / (Math.PI * 2);
    
    // Create double bump pattern
    // First bump (main beat) at t=0.1
    const bump1 = Math.exp(-Math.pow((t - 0.1) * 15, 2));
    // Second bump (smaller) at t=0.25
    const bump2 = Math.exp(-Math.pow((t - 0.25) * 20, 2)) * 0.5;
    
    return Math.max(bump1, bump2);
  }

  /**
   * Create pulse decoration type
   */
  private createPulseDecoration(brightness: number, intensity: number): vscode.TextEditorDecorationType {
    // Red color with varying opacity based on brightness
    const redValue = Math.floor(100 + brightness * 155); // 100-255
    const alpha = 0.05 + brightness * 0.25; // 0.05-0.3

    // Add subtle glow effect
    const glowAlpha = brightness * 0.2;
    const borderAlpha = brightness * 0.4;

    return vscode.window.createTextEditorDecorationType({
      backgroundColor: `rgba(${redValue}, 0, 0, ${alpha})`,
      isWholeLine: true,
      // Add a subtle border glow
      outline: `1px solid rgba(255, 0, 0, ${borderAlpha})`,
      // Override text to have subtle red tint during intense pulses
      ...(intensity > 0.5 ? {
        color: `rgba(255, ${Math.floor(200 - brightness * 50)}, ${Math.floor(200 - brightness * 50)}, 1)`,
      } : {}),
    });
  }

  /**
   * Dispose the manager
   */
  dispose(): void {
    console.log('[HeartbeatPulseManager] Disposing...');
    
    this.disposed = true;
    this.enabled = false;
    
    this.stopPulseAnimation();
    
    if (this.changeListener) {
      this.changeListener.dispose();
    }
    
    if (this.cursorListener) {
      this.cursorListener.dispose();
    }
  }
}
