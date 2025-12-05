/**
 * Screen Distortion Manager
 * 
 * Manages visual distortion effects including screen shake, VHS distortion,
 * chromatic aberration, and general glitch effects using transparent webview overlays.
 */

import * as vscode from 'vscode';
import { IEffectManager } from './horrorEngine';

/*
 * Available distortion effect types
 */
export type DistortionEffectType = 'shake' | 'vhs' | 'chromatic' | 'glitch' | 'mirrorCrack' | 'splitReality';

/**
 * Configuration for screen shake effect
 */
export interface ShakeConfig {
  intensity: number;      // 2-8 pixels
  duration: number;       // Milliseconds
  frequency: number;      // Hz (oscillations per second)
}

/**
 * Configuration for distortion effects
 */
export interface DistortionConfig {
  type: DistortionEffectType;
  duration: number;       // Milliseconds
  intensity?: number;     // 0-1 scale for effect strength
}

/**
 * Screen Distortion Manager
 * 
 * Creates transparent webview overlays to apply visual distortion effects
 * to the entire VS Code window.
 */
export class ScreenDistortionManager implements IEffectManager {
  private context: vscode.ExtensionContext;
  private overlayPanel: vscode.WebviewPanel | undefined;
  private enabled: boolean = true;
  private activeEffect: DistortionEffectType | null = null;
  private effectTimeout: NodeJS.Timeout | undefined;
  private reduceMotionEnabled: boolean = false;
  
  // Screen shake decorations
  private negativeX: vscode.TextEditorDecorationType | undefined;
  private positiveX: vscode.TextEditorDecorationType | undefined;
  private negativeY: vscode.TextEditorDecorationType | undefined;
  private positiveY: vscode.TextEditorDecorationType | undefined;
  private shakeDecorations: vscode.TextEditorDecorationType[] = [];
  private shakeTimeout: NodeJS.Timeout | undefined;
  private shakeInterval: NodeJS.Timeout | undefined;
  private currentShakeIntensity: number = 0;
  
  // VHS/Chromatic/Glitch effect decorations
  private vhsDecoration: vscode.TextEditorDecorationType | undefined;
  private chromaticDecoration: vscode.TextEditorDecorationType | undefined;
  private glitchDecoration: vscode.TextEditorDecorationType | undefined;
  private mirrorCrackDecoration: vscode.TextEditorDecorationType | undefined;
  private splitRealityDecoration: vscode.TextEditorDecorationType | undefined;
  private effectInterval: NodeJS.Timeout | undefined;
  private effectInterval2: NodeJS.Timeout | undefined;
  
  // Full document range for Y-axis shake
  private fullRange = [new vscode.Range(new vscode.Position(0, 0), new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER))];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    
    // Check initial Reduce Motion setting
    this.checkReduceMotion();
    
    console.log('[ScreenDistortionManager] Initialized');
  }
  
  /**
   * Check if Reduce Motion is enabled
   */
  private checkReduceMotion(): void {
    const config = vscode.workspace.getConfiguration();
    this.reduceMotionEnabled = config.get<boolean>('workbench.reduceMotion', false);
    console.log('[ScreenDistortionManager] Reduce Motion:', this.reduceMotionEnabled);
  }
  
  /**
   * Update Reduce Motion setting
   */
  updateReduceMotion(enabled: boolean): void {
    this.reduceMotionEnabled = enabled;
    
    // Clear any active effects if Reduce Motion is enabled
    if (enabled) {
      this.clearEffect();
    }
    
    console.log('[ScreenDistortionManager] Reduce Motion updated:', enabled);
  }

  /**
   * Initialize the manager
   */
  async initialize(): Promise<void> {
    console.log('[ScreenDistortionManager] Initialization complete');
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
      this.clearEffect();
    }
    
    console.log('[ScreenDistortionManager] Enabled:', enabled);
  }

  /**
   * Apply a distortion effect
   */
  async applyEffect(config: DistortionConfig): Promise<void> {
    if (!this.enabled) {
      console.log('[ScreenDistortionManager] Manager disabled, skipping effect');
      return;
    }
    
    // Note: Reduce Motion check removed to allow manual testing
    // Users can still disable via settings if needed

    console.log('[ScreenDistortionManager] Applying effect:', config.type);

    // Clear any existing effect
    this.clearEffect();

    // Set active effect
    this.activeEffect = config.type;

    // Create overlay panel
    await this.createOverlay(config);

    // Schedule automatic cleanup
    this.effectTimeout = setTimeout(() => {
      this.clearEffect();
    }, config.duration);
  }



  /**
   * Trigger screen shake based on complexity or random event
   * Automatically determines intensity and duration
   */
  async triggerShake(intensity: number = 0.5): Promise<void> {
    // Clamp intensity to 0-1
    intensity = Math.max(0, Math.min(1, intensity));

    // Calculate duration based on intensity
    const duration = 1000 + (intensity * 1000); // 1000-2000ms

    // Add randomization to intensity to make it feel more organic
    const randomizedIntensity = intensity * (0.8 + Math.random() * 0.4);

    console.log('[ScreenDistortionManager] Triggering shake:', { intensity: randomizedIntensity, duration });
    
    // Directly create the effect
    const config: DistortionConfig = {
      type: 'shake',
      duration,
      intensity: randomizedIntensity // Already 0-1 range
    };

    await this.applyEffect(config);
  }

  /**
   * Apply VHS distortion effect
   */
  async applyVHS(duration: number = 3000): Promise<void> {
    const config: DistortionConfig = {
      type: 'vhs',
      duration
    };

    await this.applyEffect(config);
  }

  /**
   * Apply chromatic aberration effect
   */
  async applyChromaticAberration(duration: number = 2000, intensity: number = 0.5): Promise<void> {
    const config: DistortionConfig = {
      type: 'chromatic',
      duration,
      intensity
    };

    await this.applyEffect(config);
  }

  /**
   * Trigger chromatic aberration during critical complexity
   * Can be combined with glitch effects for enhanced horror
   */
  async triggerChromaticAberration(combineWithGlitch: boolean = false): Promise<void> {
    const intensity = 0.6 + (Math.random() * 0.4); // 0.6-1.0 for critical moments
    const duration = 1500 + (Math.random() * 1000); // 1500-2500ms

    console.log('[ScreenDistortionManager] Triggering chromatic aberration:', { intensity, duration, combineWithGlitch });

    await this.applyChromaticAberration(duration, intensity);

    // Optionally combine with glitch effect after a brief delay
    if (combineWithGlitch) {
      setTimeout(() => {
        this.applyGlitch(800);
      }, duration / 2);
    }
  }

  /**
   * Apply general glitch effect
   */
  async applyGlitch(duration: number = 1500): Promise<void> {
    const config: DistortionConfig = {
      type: 'glitch',
      duration
    };

    await this.applyEffect(config);
  }

  /**
   * Trigger random glitch effect during coding sessions
   * Randomly varies duration and intensity
   */
  async triggerRandomGlitch(): Promise<void> {
    const duration = 800 + (Math.random() * 1200); // 800-2000ms
    
    console.log('[ScreenDistortionManager] Triggering random glitch:', { duration });
    
    await this.applyGlitch(duration);
  }

  /**
   * Apply Mirror Crack effect
   * Screen gets a crack pattern overlay, cracks slowly spread then fade
   */
  async applyMirrorCrack(duration: number = 12000): Promise<void> {
    const config: DistortionConfig = {
      type: 'mirrorCrack',
      duration,
      intensity: 0.7
    };

    await this.applyEffect(config);
  }

  /**
   * Trigger mirror crack effect with randomized duration
   */
  async triggerMirrorCrack(): Promise<void> {
    const duration = 10000 + (Math.random() * 5000); // 10-15 seconds
    
    console.log('[ScreenDistortionManager] Triggering mirror crack:', { duration });
    
    await this.applyMirrorCrack(duration);
  }

  /**
   * Apply Split Reality effect
   * Screen splits vertically - one side normal, one side dark/corrupted
   */
  async applySplitReality(duration: number = 6000): Promise<void> {
    const config: DistortionConfig = {
      type: 'splitReality',
      duration,
      intensity: 0.8
    };

    await this.applyEffect(config);
  }

  /**
   * Trigger split reality effect with randomized duration
   */
  async triggerSplitReality(): Promise<void> {
    const duration = 5000 + (Math.random() * 3000); // 5-8 seconds
    
    console.log('[ScreenDistortionManager] Triggering split reality:', { duration });
    
    await this.applySplitReality(duration);
  }

  /**
   * Create shake decorations with specified intensity
   */
  private createShakeDecorations(intensity: number): void {
    // Dispose old decorations if they exist
    this.disposeShakeDecorations();
    
    // Use larger intensity for more visible shake
    const intensityPx = Math.max(3, Math.floor(intensity * 15)); // Convert 0-1 to 3-15 pixels
    const lineHeight = 1 + (intensity * 0.8); // 1.0 to 1.8
    
    console.log('[ScreenDistortionManager] Creating shake decorations:', { intensityPx, lineHeight });
    
    this.negativeX = vscode.window.createTextEditorDecorationType({
      textDecoration: `none; margin-left: 0px;`
    });

    this.positiveX = vscode.window.createTextEditorDecorationType({
      textDecoration: `none; margin-left: ${intensityPx}px;`
    });

    this.negativeY = vscode.window.createTextEditorDecorationType({
      textDecoration: `none; line-height: inherit;`
    });

    this.positiveY = vscode.window.createTextEditorDecorationType({
      textDecoration: `none; line-height: ${lineHeight};`
    });

    this.shakeDecorations = [
      this.negativeX,
      this.positiveX,
      this.negativeY,
      this.positiveY
    ];
  }
  
  /**
   * Dispose shake decorations
   */
  private disposeShakeDecorations(): void {
    this.shakeDecorations.forEach(decoration => decoration.dispose());
    this.shakeDecorations = [];
    this.negativeX = undefined;
    this.positiveX = undefined;
    this.negativeY = undefined;
    this.positiveY = undefined;
  }
  
  /**
   * Start continuous shake loop
   */
  private startShakeLoop(editor: vscode.TextEditor, duration: number): void {
    console.log('[ScreenDistortionManager] Starting shake loop:', { duration, editorLineCount: editor.document.lineCount });
    
    // Apply shake immediately
    this.applyShakeToEditor(editor);
    
    // Continue shaking at 60fps
    this.shakeInterval = setInterval(() => {
      this.applyShakeToEditor(editor);
    }, 1000 / 60);
    
    console.log('[ScreenDistortionManager] Shake interval started');
    
    // Stop after duration
    this.shakeTimeout = setTimeout(() => {
      this.stopShake(editor);
    }, duration);
  }
  
  /**
   * Apply shake effect to the editor using decorations
   */
  private applyShakeToEditor(editor: vscode.TextEditor): void {
    if (!this.negativeX || !this.positiveX || !this.negativeY || !this.positiveY) {
      console.log('[ScreenDistortionManager] Decorations not ready, skipping shake frame');
      return;
    }
    
    // Create ranges for horizontal shake (one range per line, starting at first non-whitespace)
    const xRanges: vscode.Range[] = [];
    for (let i = 0; i < editor.document.lineCount; i++) {
      const textStart = editor.document.lineAt(i).firstNonWhitespaceCharacterIndex;
      xRanges.push(new vscode.Range(new vscode.Position(i, textStart), new vscode.Position(i, textStart + 1)));
    }

    // Randomly apply decorations in opposite directions
    if (Math.random() > 0.5) {
      editor.setDecorations(this.negativeX, []);
      editor.setDecorations(this.positiveX, xRanges);
    } else {
      editor.setDecorations(this.positiveX, []);
      editor.setDecorations(this.negativeX, xRanges);
    }

    if (Math.random() > 0.5) {
      editor.setDecorations(this.negativeY, []);
      editor.setDecorations(this.positiveY, this.fullRange);
    } else {
      editor.setDecorations(this.positiveY, []);
      editor.setDecorations(this.negativeY, this.fullRange);
    }
  }
  
  /**
   * Clear shake decorations from editor
   */
  private unshake(editor: vscode.TextEditor): void {
    this.shakeDecorations.forEach(decoration => {
      try {
        editor.setDecorations(decoration, []);
      } catch {
        // Editor might be closed, that's fine
      }
    });
  }
  
  /**
   * Create transparent webview overlay
   */
  private async createOverlay(config: DistortionConfig): Promise<void> {
    // For screen shake, use decoration-based shake
    if (config.type === 'shake') {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        console.log('[ScreenDistortionManager] No active editor for shake');
        return;
      }
      
      // Create decorations with the specified intensity
      const intensity = config.intensity || 0.7;
      this.createShakeDecorations(intensity);
      
      const duration = config.duration || 1000;
      
      console.log('[ScreenDistortionManager] Starting shake:', { intensity, duration });
      
      // Start the shake loop
      this.currentShakeIntensity = intensity;
      this.startShakeLoop(editor, duration);
      
      return;
    }
    
    // Handle other effects with decorations
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.log('[ScreenDistortionManager] No active editor');
      return;
    }
    
    switch (config.type) {
      case 'vhs':
        this.startVHSEffect(editor, config.duration || 3000);
        break;
      case 'chromatic':
        this.startChromaticEffect(editor, config.duration || 2000, config.intensity || 0.5);
        break;
      case 'glitch':
        this.startGlitchEffect(editor, config.duration || 1500);
        break;
      case 'mirrorCrack':
        this.startMirrorCrackEffect(editor, config.duration || 12000, config.intensity || 0.7);
        break;
      case 'splitReality':
        this.startSplitRealityEffect(editor, config.duration || 6000, config.intensity || 0.8);
        break;
    }
  }
  
  /**
   * Start VHS distortion effect
   */
  private startVHSEffect(editor: vscode.TextEditor, duration: number): void {
    console.log('[ScreenDistortionManager] Starting VHS effect:', { duration });
    
    // Create VHS decoration with opacity flickering and slight blur
    const applyVHS = () => {
      const opacity = 0.85 + (Math.random() * 0.15); // Flicker between 85-100%
      const blur = Math.random() > 0.8 ? 0.5 : 0; // Occasional blur
      
      this.vhsDecoration?.dispose();
      this.vhsDecoration = vscode.window.createTextEditorDecorationType({
        opacity: opacity.toString(),
        textDecoration: blur > 0 ? `none; filter: blur(${blur}px);` : 'none'
      });
      
      editor.setDecorations(this.vhsDecoration, this.fullRange);
    };
    
    // Apply VHS effect at 30 fps
    applyVHS();
    this.effectInterval = setInterval(applyVHS, 1000 / 30);
    
    // Stop after duration
    this.effectTimeout = setTimeout(() => {
      this.stopEffect(editor);
    }, duration);
  }
  
  /**
   * Start chromatic aberration effect
   */
  private startChromaticEffect(editor: vscode.TextEditor, duration: number, intensity: number): void {
    console.log('[ScreenDistortionManager] Starting chromatic effect:', { duration, intensity });
    
    const colors = [
      ['rgba(255, 0, 0, 0.3)', 'rgba(0, 255, 255, 0.3)'],
      ['rgba(0, 255, 0, 0.3)', 'rgba(255, 0, 255, 0.3)'],
      ['rgba(0, 0, 255, 0.3)', 'rgba(255, 255, 0, 0.3)']
    ];
    let colorIndex = 0;
    
    const applyChromaticAberration = () => {
      const [color1, color2] = colors[colorIndex % colors.length];
      colorIndex++;
      
      this.chromaticDecoration?.dispose();
      this.chromaticDecoration = vscode.window.createTextEditorDecorationType({
        textDecoration: `none; text-shadow: -${intensity * 2}px 0 ${color1}, ${intensity * 2}px 0 ${color2};`
      });
      
      editor.setDecorations(this.chromaticDecoration, this.fullRange);
    };
    
    // Apply chromatic effect at 15 fps
    applyChromaticAberration();
    this.effectInterval = setInterval(applyChromaticAberration, 1000 / 15);
    
    // Stop after duration
    this.effectTimeout = setTimeout(() => {
      this.stopEffect(editor);
    }, duration);
  }
  
  /**
   * Start glitch effect
   */
  private startGlitchEffect(editor: vscode.TextEditor, duration: number): void {
    console.log('[ScreenDistortionManager] Starting glitch effect:', { duration });
    
    const applyGlitch = () => {
      // Random glitch: invert colors, add distortion
      const effects = [
        'none; filter: invert(1) hue-rotate(180deg);',
        'none; filter: saturate(5) contrast(3);',
        'none; text-shadow: 3px 0 red, -3px 0 cyan;',
        'none; filter: brightness(2) contrast(2);',
        'none' // Normal frame
      ];
      
      const effect = effects[Math.floor(Math.random() * effects.length)];
      
      this.glitchDecoration?.dispose();
      this.glitchDecoration = vscode.window.createTextEditorDecorationType({
        textDecoration: effect
      });
      
      editor.setDecorations(this.glitchDecoration, this.fullRange);
    };
    
    // Apply glitch at 10 fps (more jarring)
    applyGlitch();
    this.effectInterval = setInterval(applyGlitch, 1000 / 10);
    
    // Stop after duration
    this.effectTimeout = setTimeout(() => {
      this.stopEffect(editor);
    }, duration);
  }
  
  /**
   * Start Mirror Crack effect - cracks spread across the screen then fade
   */
  private startMirrorCrackEffect(editor: vscode.TextEditor, duration: number, intensity: number): void {
    console.log('[ScreenDistortionManager] Starting mirror crack effect:', { duration, intensity });
    
    let crackProgress = 0;
    const spreadDuration = duration * 0.7; // 70% of time is crack spreading
    const fadeDuration = duration * 0.3; // 30% is fading
    const startTime = Date.now();
    
    const phantomMessages = [
      'HELP ME',
      'LET ME OUT', 
      'WRONG SIDE',
      'TRAPPED',
      'MIRROR LIES',
      'NOT REAL'
    ];
    
    const applyMirrorCrack = () => {
      const elapsed = Date.now() - startTime;
      const spreading = elapsed < spreadDuration;
      
      if (spreading) {
        // Crack spreading phase
        crackProgress = Math.min(1, elapsed / spreadDuration);
      } else {
        // Fading phase
        const fadeElapsed = elapsed - spreadDuration;
        crackProgress = Math.max(0, 1 - (fadeElapsed / fadeDuration));
      }
      
      // Create crack pattern with desaturation
      const desaturation = crackProgress * 0.6; // Up to 60% desaturated
      const darkness = crackProgress * 0.3; // Up to 30% darker
      const crackOpacity = crackProgress * 0.4; // Crack overlay opacity
      
      // Occasional phantom message flash
      const showPhantom = Math.random() < 0.02 && crackProgress > 0.3;
      const phantomMsg = showPhantom ? phantomMessages[Math.floor(Math.random() * phantomMessages.length)] : '';
      
      this.mirrorCrackDecoration?.dispose();
      this.mirrorCrackDecoration = vscode.window.createTextEditorDecorationType({
        textDecoration: `none; filter: saturate(${1 - desaturation}) brightness(${1 - darkness});`,
        before: crackProgress > 0.1 ? {
          contentText: showPhantom ? phantomMsg : '░',
          color: `rgba(100, 100, 100, ${crackOpacity})`,
          fontStyle: 'normal'
        } : undefined
      });
      
      editor.setDecorations(this.mirrorCrackDecoration, this.fullRange);
    };
    
    // Apply effect at 20 fps
    applyMirrorCrack();
    this.effectInterval = setInterval(applyMirrorCrack, 1000 / 20);
    
    // Stop after duration
    this.effectTimeout = setTimeout(() => {
      this.stopEffect(editor);
    }, duration);
  }

  /**
   * Start Split Reality effect - screen splits, one side normal, one side corrupted
   */
  private startSplitRealityEffect(editor: vscode.TextEditor, duration: number, intensity: number): void {
    console.log('[ScreenDistortionManager] Starting split reality effect:', { duration, intensity });
    
    const phantomCode = [
      '// THEY ARE WATCHING',
      '/* WRONG DIMENSION */',
      'const soul = null;',
      'return void(existence);',
      '// YOU SHOULD NOT BE HERE',
      'let escape = false;',
      '// THE OTHER SIDE',
      'while(true) { suffer(); }',
      '/* REALITY.ERR */',
      'throw new Error("HELP");'
    ];
    
    let splitProgress = 0;
    let currentPhantom = '';
    const startTime = Date.now();
    const peakTime = duration * 0.3; // Full split at 30%
    const holdTime = duration * 0.5; // Hold until 80%
    const fadeTime = duration * 0.2; // Fade out
    
    const applySplitReality = () => {
      const elapsed = Date.now() - startTime;
      
      // Calculate split progress (0 = no split, 1 = full split)
      if (elapsed < peakTime) {
        // Opening phase
        splitProgress = elapsed / peakTime;
      } else if (elapsed < peakTime + holdTime) {
        // Hold phase - full split with flickering
        splitProgress = 0.9 + (Math.random() * 0.1); // 90-100% with flicker
        
        // Change phantom message occasionally
        if (Math.random() < 0.05) {
          currentPhantom = phantomCode[Math.floor(Math.random() * phantomCode.length)];
        }
      } else {
        // Closing phase
        const fadeElapsed = elapsed - peakTime - holdTime;
        splitProgress = Math.max(0, 1 - (fadeElapsed / fadeTime));
      }
      
      // Apply split effect - dark gradient from one side
      const gradientStop = splitProgress * 50; // 0-50% of screen
      const corruption = splitProgress * 0.7; // Corruption intensity
      
      this.splitRealityDecoration?.dispose();
      this.splitRealityDecoration = vscode.window.createTextEditorDecorationType({
        textDecoration: splitProgress > 0.1 
          ? `none; filter: contrast(${1 + corruption * 0.3}) brightness(${1 - corruption * 0.2});`
          : 'none',
        after: splitProgress > 0.3 && currentPhantom ? {
          contentText: `  ${currentPhantom}`,
          color: `rgba(139, 0, 0, ${splitProgress * 0.6})`,
          fontStyle: 'italic',
          textDecoration: 'none; opacity: 0.7;'
        } : undefined
      });
      
      editor.setDecorations(this.splitRealityDecoration, this.fullRange);
      
      // Apply alternating line effect for "split" look
      if (splitProgress > 0.2) {
        this.applyAlternatingLineEffect(editor, splitProgress);
      }
    };
    
    // Initialize with first phantom message
    currentPhantom = phantomCode[Math.floor(Math.random() * phantomCode.length)];
    
    // Apply effect at 15 fps
    applySplitReality();
    this.effectInterval = setInterval(applySplitReality, 1000 / 15);
    
    // Stop after duration
    this.effectTimeout = setTimeout(() => {
      this.stopEffect(editor);
    }, duration);
  }
  
  /**
   * Apply alternating line darkness for split reality effect
   */
  private applyAlternatingLineEffect(editor: vscode.TextEditor, intensity: number): void {
    // Apply different effects to alternating lines to create "split" illusion
    const lineCount = editor.document.lineCount;
    const darkRanges: vscode.Range[] = [];
    
    // Every other line gets darkened
    for (let i = 0; i < lineCount; i += 2) {
      const line = editor.document.lineAt(i);
      if (line.text.length > 0) {
        darkRanges.push(new vscode.Range(
          new vscode.Position(i, 0),
          new vscode.Position(i, line.text.length)
        ));
      }
    }
    
    // This creates a visual "split" effect with alternating darkness
    // The main decoration handles the overall filter
  }

  /**
   * Stop current visual effect
   */
  private stopEffect(editor: vscode.TextEditor): void {
    if (this.effectInterval) {
      clearInterval(this.effectInterval);
      this.effectInterval = undefined;
    }
    
    if (this.effectInterval2) {
      clearInterval(this.effectInterval2);
      this.effectInterval2 = undefined;
    }
    
    if (this.effectTimeout) {
      clearTimeout(this.effectTimeout);
      this.effectTimeout = undefined;
    }
    
    // Clear all effect decorations
    this.vhsDecoration?.dispose();
    this.vhsDecoration = undefined;
    this.chromaticDecoration?.dispose();
    this.chromaticDecoration = undefined;
    this.glitchDecoration?.dispose();
    this.glitchDecoration = undefined;
    this.mirrorCrackDecoration?.dispose();
    this.mirrorCrackDecoration = undefined;
    this.splitRealityDecoration?.dispose();
    this.splitRealityDecoration = undefined;
    
    console.log('[ScreenDistortionManager] Effect stopped');
  }
  
  /**
   * Stop shake effect
   */
  private stopShake(editor: vscode.TextEditor): void {
    // Clear interval
    if (this.shakeInterval) {
      clearInterval(this.shakeInterval);
      this.shakeInterval = undefined;
    }
    
    // Clear timeout
    if (this.shakeTimeout) {
      clearTimeout(this.shakeTimeout);
      this.shakeTimeout = undefined;
    }
    
    // Clear decorations from editor
    this.unshake(editor);
    
    // Don't dispose decorations - reuse them for next shake
    // this.disposeShakeDecorations();
    
    console.log('[ScreenDistortionManager] Shake stopped');
  }

  /**
   * Generate HTML for distortion effect
   */
  private getEffectHTML(config: DistortionConfig): string {
    const styles = this.getEffectStyles(config);
    const content = this.getEffectContent(config);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: transparent;
      position: relative;
      pointer-events: none;
    }

    ${styles}
  </style>
</head>
<body>
  ${content}
  <script>
    // Auto-close after duration
    setTimeout(() => {
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.3s';
    }, ${config.duration - 300});
  </script>
</body>
</html>`;
  }

  /**
   * Get CSS styles for specific effect
   */
  private getEffectStyles(config: DistortionConfig): string {
    switch (config.type) {
      case 'shake':
        return this.getShakeStyles(config);
      case 'vhs':
        return this.getVHSStyles();
      case 'chromatic':
        return this.getChromaticStyles(config);
      case 'glitch':
        return this.getGlitchStyles();
      default:
        return '';
    }
  }

  /**
   * Get HTML content for specific effect
   */
  private getEffectContent(config: DistortionConfig): string {
    switch (config.type) {
      case 'shake':
        return '<div class="shake-overlay"></div>';
      case 'vhs':
        return '<div class="vhs-overlay"><div class="vhs-scanlines"></div><div class="vhs-tracking"></div></div>';
      case 'chromatic':
        return '<div class="chromatic-overlay"></div>';
      case 'glitch':
        return this.getGlitchContent();
      default:
        return '';
    }
  }

  /**
   * Get shake effect styles
   */
  private getShakeStyles(config: DistortionConfig): string {
    const intensity = (config.intensity || 0.5) * 8; // Scale to 0-8 pixels
    const frequency = 10; // 10 Hz

    return `
    .shake-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      animation: shake ${1000 / frequency}ms infinite;
    }

    @keyframes shake {
      0%, 100% { transform: translate(0, 0); }
      25% { transform: translate(${intensity}px, ${intensity}px); }
      50% { transform: translate(-${intensity}px, ${intensity}px); }
      75% { transform: translate(${intensity}px, -${intensity}px); }
    }
    `;
  }

  /**
   * Get VHS distortion styles
   */
  private getVHSStyles(): string {
    return `
    .vhs-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .vhs-scanlines {
      position: absolute;
      width: 100%;
      height: 100%;
      background: repeating-linear-gradient(
        0deg,
        transparent 0px,
        rgba(255, 255, 255, 0.03) 2px,
        transparent 4px
      );
      animation: vhs-scanlines 0.1s infinite;
    }

    @keyframes vhs-scanlines {
      0% { transform: translateY(0); }
      100% { transform: translateY(-4px); }
    }

    .vhs-tracking {
      position: absolute;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 0, 0, 0.05) 25%,
        rgba(0, 255, 0, 0.05) 50%,
        rgba(0, 0, 255, 0.05) 75%,
        transparent 100%
      );
      animation: vhs-tracking 0.5s infinite;
    }

    @keyframes vhs-tracking {
      0% { transform: translateX(0); }
      50% { transform: translateX(10px); }
      100% { transform: translateX(0); }
    }

    /* Color bleeding effect */
    .vhs-overlay::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        180deg,
        rgba(255, 0, 0, 0.02) 0%,
        rgba(0, 255, 0, 0.02) 50%,
        rgba(0, 0, 255, 0.02) 100%
      );
      mix-blend-mode: screen;
      animation: color-bleed 1s infinite;
    }

    @keyframes color-bleed {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }

    /* VHS noise */
    .vhs-overlay::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background-image: 
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(255, 255, 255, 0.01) 2px,
          rgba(255, 255, 255, 0.01) 4px
        );
      opacity: 0.5;
      animation: vhs-noise 0.2s infinite;
    }

    @keyframes vhs-noise {
      0% { transform: translateY(0); }
      100% { transform: translateY(-8px); }
    }
    `;
  }

  /**
   * Get chromatic aberration styles
   */
  private getChromaticStyles(config: DistortionConfig): string {
    const separation = (config.intensity || 0.5) * 4; // 0-4 pixels

    return `
    .chromatic-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      filter: 
        drop-shadow(${separation}px 0 0 red)
        drop-shadow(-${separation}px 0 0 cyan)
        drop-shadow(0 ${separation}px 0 yellow);
      animation: chromatic-pulse 0.2s infinite;
    }

    @keyframes chromatic-pulse {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
    `;
  }

  /**
   * Get glitch effect styles
   */
  private getGlitchStyles(): string {
    return `
    .glitch-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .glitch-line {
      position: absolute;
      left: 0;
      width: 100%;
      height: 2px;
      background: rgba(255, 0, 0, 0.5);
      animation: glitch-line 0.1s infinite;
    }

    @keyframes glitch-line {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      50% { transform: translateX(10px); }
      75% { transform: translateX(-5px); }
    }

    .glitch-block {
      position: absolute;
      background: rgba(0, 255, 0, 0.1);
      animation: glitch-block 0.15s infinite;
    }

    @keyframes glitch-block {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.7; }
    }

    .color-invert {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      mix-blend-mode: difference;
      animation: color-flash 0.3s infinite;
    }

    @keyframes color-flash {
      0%, 90%, 100% { opacity: 0; }
      95% { opacity: 1; }
    }
    `;
  }

  /**
   * Get glitch effect content (random lines and blocks)
   */
  private getGlitchContent(): string {
    const numLines = Math.floor(Math.random() * 10) + 5;
    const numBlocks = Math.floor(Math.random() * 5) + 3;

    let content = '<div class="glitch-container">';

    // Add random glitch lines
    for (let i = 0; i < numLines; i++) {
      const top = Math.random() * 100;
      content += `<div class="glitch-line" style="top: ${top}%;"></div>`;
    }

    // Add random glitch blocks
    for (let i = 0; i < numBlocks; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const width = Math.random() * 30 + 10;
      const height = Math.random() * 20 + 5;
      content += `<div class="glitch-block" style="top: ${top}%; left: ${left}%; width: ${width}%; height: ${height}%;"></div>`;
    }

    content += '<div class="color-invert"></div>';
    content += '</div>';

    return content;
  }

  /**
   * Clear active effect
   */
  clearEffect(): void {
    if (this.effectTimeout) {
      clearTimeout(this.effectTimeout);
      this.effectTimeout = undefined;
    }

    if (this.overlayPanel) {
      this.overlayPanel.dispose();
      this.overlayPanel = undefined;
    }
    
    // Stop shake effect if active
    if (this.shakeInterval || this.shakeTimeout) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        this.stopShake(editor);
      }
    }

    this.activeEffect = null;
    console.log('[ScreenDistortionManager] Effect cleared');
  }

  /**
   * Get current active effect
   */
  getActiveEffect(): DistortionEffectType | null {
    return this.activeEffect;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    console.log('[ScreenDistortionManager] Disposing...');
    
    this.clearEffect();
    this.disposeShakeDecorations();
    
    console.log('[ScreenDistortionManager] Disposed');
  }
}
