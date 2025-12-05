/**
 * Horror Popup Manager
 * 
 * Creates full-screen transparent overlays with horror effects
 * that escalate based on error severity
 */

import * as vscode from 'vscode';
import { EffectLock } from './easterEggManager';

export type PopupSeverity = 'none' | 'info' | 'warning' | 'error' | 'critical';

export interface JumpscareVariant {
  id: string;
  name: string;
  weight: number;
  duration: number;
  htmlGenerator: (errorMessage?: string) => string;
  audioFile: string;
  cooldownMultiplier: number;
}

export class HorrorPopupManager implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private lastPopupTime: number = 0;
  private readonly POPUP_COOLDOWN = 5000; // 5 seconds between popups to avoid spam
  private currentCooldown: number = this.POPUP_COOLDOWN;
  private context: vscode.ExtensionContext;
  private onPopupClosed?: () => void; // Callback when popup is closed (for audio cleanup)
  private audioEngine?: { playVariantAudio(audioId: string): Promise<void>; fadeOutPopup(duration: number): Promise<void>; stopPopup(): void };
  private safetyManager?: { trackFlashEvent(eventId: string): boolean };
  private themeCompatibilityManager?: { getHorrorColorAdjustments(): any; getThemeAdjustedFilter(): string };
  private enabled: boolean = true;

  private variants: JumpscareVariant[] = [];
  private variantHistory: string[] = [];
  private readonly MAX_HISTORY_SIZE = 3;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.initializeVariants();
  }

  async initialize(): Promise<void> {
    console.log('[HorrorPopupManager] Initialized');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (!enabled && this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
  }

  public setAudioEngine(audioEngine: any): void {
    this.audioEngine = audioEngine;
  }

  public setSafetyManager(safetyManager: any): void {
    this.safetyManager = safetyManager;
  }

  public setThemeCompatibilityManager(themeCompatibilityManager: any): void {
    this.themeCompatibilityManager = themeCompatibilityManager;
  }

  public async showRandomJumpscare(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    // Check if another effect is already running
    if (EffectLock.isActive()) {
      console.log('[HorrorPopupManager] Skipping jumpscare - another effect is running');
      return;
    }

    if (this.safetyManager && !this.safetyManager.trackFlashEvent('jumpscare')) {
      return;
    }

    const now = Date.now();
    if (now - this.lastPopupTime < this.POPUP_COOLDOWN) {
      return;
    }

    const variant = this.selectVariant();
    if (!variant) {
      return;
    }

    // Acquire lock for the duration of the jumpscare
    if (!EffectLock.acquire(variant.duration + 1000)) {
      console.log('[HorrorPopupManager] Could not acquire effect lock for jumpscare');
      return;
    }

    this.recordVariant(variant.id);
    this.lastPopupTime = now;
    this.currentCooldown = Math.max(this.POPUP_COOLDOWN, this.POPUP_COOLDOWN * variant.cooldownMultiplier);

    if (this.audioEngine) {
      try {
        await this.audioEngine.playVariantAudio(variant.audioFile);
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        console.error('[HorrorPopupManager] Failed to play variant audio:', error);
      }
    }

    try {
      await this.showVariantPopup(variant);
    } finally {
      // Release lock after popup completes
      EffectLock.release();
    }
  }

  private async showVariantPopup(variant: JumpscareVariant, errorMessage?: string): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    const activeDocument = activeEditor?.document;

    if (this.panel) {
      this.panel.dispose();
    }

    this.panel = vscode.window.createWebviewPanel(
      'horrorPopup',
      'codeblooded Horror',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: false
      }
    );

    this.panel.onDidDispose(() => {
      if (this.audioEngine) {
        this.audioEngine.stopPopup();
      }

      if (this.onPopupClosed) {
        this.onPopupClosed();
      }

      this.panel = undefined;
    });

    const videoUri = variant.id === 'realistic-horror-face'
      ? this.panel.webview.asWebviewUri(
          vscode.Uri.joinPath(this.context.extensionUri, 'media', 'videos', 'jumpscare-silent.mp4')
        ).toString()
      : undefined;

    this.panel.webview.html = this.getVariantHTML(variant, errorMessage, videoUri);

    const fadeOutDelay = Math.max(variant.duration - 1000, 500);
    if (this.audioEngine) {
      setTimeout(() => {
        this.audioEngine?.fadeOutPopup(1000).catch(console.error);
      }, fadeOutDelay);
    }

    setTimeout(async () => {
      if (this.panel) {
        try {
          this.panel.dispose();
        } catch (error) {
          console.error('[HorrorPopupManager] Error disposing variant popup:', error);
        }
        this.panel = undefined;
      }

      if (activeDocument) {
        try {
          await vscode.window.showTextDocument(activeDocument, {
            viewColumn: activeEditor?.viewColumn,
            preserveFocus: false,
            preview: false
          });
        } catch (error) {
          console.error('[HorrorPopupManager] Error restoring editor focus:', error);
        }
      }
    }, variant.duration);
  }

  private initializeVariants(): void {
    this.variants = [
      {
        id: 'realistic-horror-face',
        name: 'Scary Lady',
        weight: 2.0,
        duration: 5000,
        htmlGenerator: () => this.getRealisticHorrorFaceHTML(),
        audioFile: 'critical.mp3',
        cooldownMultiplier: 1.5
      },
      {
        id: 'quick-ghost',
        name: 'Cute Ghost',
        weight: 1.5,
        duration: 3000,
        htmlGenerator: () => this.getQuickGhostHTML(),
        audioFile: 'warning.wav',
        cooldownMultiplier: 0.8
      }
    ];
  }

  private recordVariant(variantId: string): void {
    this.variantHistory.push(variantId);
    if (this.variantHistory.length > this.MAX_HISTORY_SIZE) {
      this.variantHistory.shift();
    }
  }

  private selectVariant(): JumpscareVariant | null {
    const available = this.variants.filter(variant => !this.variantHistory.includes(variant.id));
    const pool = available.length > 0 ? available : this.variants;
    return this.weightedRandomSelection(pool);
  }

  private weightedRandomSelection(variants: JumpscareVariant[]): JumpscareVariant | null {
    if (variants.length === 0) {
      return null;
    }

    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let threshold = Math.random() * totalWeight;

    for (const variant of variants) {
      threshold -= variant.weight;
      if (threshold <= 0) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  private getVariantHTML(variant: JumpscareVariant, errorMessage?: string, videoUri?: string): string {
    let horrorContent = variant.htmlGenerator(errorMessage);

    if (videoUri) {
      horrorContent = horrorContent.replace('{{VIDEO_URI}}', videoUri);
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https: data: blob: vscode-resource:; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <style>
    ${this.getSharedStyles()}
    ${this.getVariantStyles(variant.id)}
  </style>
</head>
<body>
  ${horrorContent}
  <script>
    const duration = ${variant.duration};
    setTimeout(() => {
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.2s';
      setTimeout(() => {
        document.body.innerHTML = '';
      }, 200);
    }, duration);
  </script>
</body>
</html>`;
  }

  private getSharedStyles(): string {
    const adjustments = this.themeCompatibilityManager
      ? this.themeCompatibilityManager.getHorrorColorAdjustments()
      : {
          bloodColor: '#8B0000',
          shadowColor: '#000000',
          glitchColor: '#FF0000',
          eyeColor: '#FFFFFF',
          phantomTextColor: '#FF0000',
          whisperColor: '#DC143C',
          contrastMultiplier: 1.0
        };

    const filter = this.themeCompatibilityManager
      ? this.themeCompatibilityManager.getThemeAdjustedFilter()
      : 'none';

    return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: ${adjustments.shadowColor};
      position: relative;
      filter: ${filter};
    }

    .horror-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    `;
  }

  private getVariantStyles(variantId: string): string {
    switch (variantId) {
      case 'realistic-horror-face':
        return `
        .jumpscare {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background: #000;
          overflow: hidden;
        }

        .jumpscare-bg {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #000;
          animation: extremeFlash 0.05s 30 forwards;
        }

        .horror-video-container {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          overflow: hidden;
          background: #000;
        }

        .horror-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: contrast(1.2) brightness(0.95) saturate(1.1);
        }

        .blood-overlay-critical {
          position: absolute;
          top: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 50% 50%,
              rgba(139, 0, 0, 0.8) 0%,
              rgba(100, 0, 0, 0.6) 30%,
              transparent 70%);
          animation: bloodPulseCritical 0.1s infinite;
          pointer-events: none;
          z-index: 5;
        }

        .error-text-critical {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          color: #ff0000;
          font-size: 18px;
          font-family: 'Courier New', monospace;
          opacity: 0.8;
          z-index: 20;
          text-align: center;
          text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
          animation: textFlicker 0.2s 23 forwards;
        }

        @keyframes bloodPulseCritical {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }

        @keyframes textFlicker {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; }
        }

        @keyframes extremeFlash {
          0% { background: #000; }
          20% { background: #500; }
          40% { background: #000; }
          60% { background: #400; }
          80% { background: #000; }
          100% { background: #200; }
        }
        `;
      case 'quick-ghost':
      default:
        return `
        .ghost {
          width: 200px;
          height: 250px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50% 50% 0 0;
          position: relative;
          animation: ghostFloat 0.8s ease-out;
          box-shadow: 0 0 50px rgba(255, 255, 255, 0.8);
        }

        .ghost::before, .ghost::after {
          content: '';
          position: absolute;
          width: 30px;
          height: 30px;
          background: #000;
          border-radius: 50%;
          top: 80px;
          animation: ghostBlink 1.5s infinite;
        }

        .ghost::before { left: 50px; }
        .ghost::after { right: 50px; }

        @keyframes ghostFloat {
          0% {
            transform: translateY(150vh) scale(0.5);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes ghostBlink {
          0%, 45%, 55%, 100% { height: 30px; }
          50% { height: 2px; }
        }
        `;
    }
  }

  private getRealisticHorrorFaceHTML(): string {
    return `
      <div class="jumpscare">
        <div class="jumpscare-bg"></div>
        <div class="blood-overlay-critical"></div>
        <div class="horror-video-container">
          <video 
            id="horror-video"
            class="horror-video" 
            src="{{VIDEO_URI}}" 
            autoplay 
            muted
            playsinline
            preload="auto"
          ></video>
        </div>
        <div class="error-text-critical">FATAL ERROR</div>
      </div>
      <script>
        (function() {
          const video = document.getElementById('horror-video');
          if (video) {
            video.addEventListener('error', () => {
              console.error('[Horror Popup] failed to load jumpscare video');
            });
            video.load();
          }
        })();
      </script>
    `;
  }

  private getQuickGhostHTML(): string {
    return `
      <div class="horror-overlay">
        <div class="ghost"></div>
      </div>
    `;
  }

  dispose(): void {
    if (this.panel) {
      this.panel.dispose();
    }
  }

  /**
   * Set callback for when popup is closed
   */
  public setOnPopupClosed(callback: () => void): void {
    this.onPopupClosed = callback;
  }

  /**
   * Show horror popup based on severity
   */
  public async showPopup(severity: PopupSeverity, errorMessage?: string): Promise<void> {
    console.log('[codeblooded Horror] showPopup called:', { severity, errorMessage });
    
    if (!this.enabled) {
      console.log('[codeblooded Horror] Horror popups disabled, skipping');
      return;
    }

    // Check if another effect is already running
    if (EffectLock.isActive()) {
      console.log('[codeblooded Horror] Skipping popup - another effect is running');
      return;
    }

    if (this.safetyManager && !this.safetyManager.trackFlashEvent(`popup-${severity}`)) {
      console.log('[codeblooded Horror] Flash frequency limit exceeded, skipping popup');
      return;
    }

    // Don't show if on cooldown
    const now = Date.now();
    if (now - this.lastPopupTime < this.currentCooldown) {
      console.log('[codeblooded Horror] On cooldown, skipping popup');
      return;
    }
    this.lastPopupTime = now;
    this.currentCooldown = this.POPUP_COOLDOWN;

    // Don't show for info or none
    if (severity === 'none' || severity === 'info') {
      console.log('[codeblooded Horror] Severity too low, skipping popup');
      return;
    }

    // Acquire lock for the popup duration
    const popupDuration = this.getPopupDuration(severity);
    if (!EffectLock.acquire(popupDuration + 1000)) {
      console.log('[codeblooded Horror] Could not acquire effect lock for popup');
      return;
    }

    console.log('[codeblooded Horror] Creating popup panel...');

    // Save the currently active editor to restore focus later
    const activeEditor = vscode.window.activeTextEditor;
    const activeDocument = activeEditor?.document;

    // Close existing panel
    if (this.panel) {
      this.panel.dispose();
    }

    // Create full-screen transparent webview panel
    this.panel = vscode.window.createWebviewPanel(
      'horrorPopup',
      'codeblooded Horror',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: false,
      }
    );

    // Listen for panel disposal to clean up reference and stop audio
    this.panel.onDidDispose(() => {
      console.log('[codeblooded Horror] Panel disposed (user closed or auto-closed)');
      
      // Call cleanup callback to stop audio
      if (this.onPopupClosed) {
        console.log('[codeblooded Horror] Calling audio cleanup callback');
        this.onPopupClosed();
      }
      
      this.panel = undefined;
    });

    console.log('[codeblooded Horror] Panel created, setting HTML...');

    // Get video URI for critical severity
    const mediaUri = severity === 'critical' 
      ? this.panel.webview.asWebviewUri(
          vscode.Uri.joinPath(this.context.extensionUri, 'media', 'videos', 'jumpscare-silent.mp4')
        ).toString()
      : '';

    console.log('[codeblooded Horror] Video URI:', mediaUri);

    // Make it transparent and overlay
    this.panel.webview.html = this.getHorrorHTML(severity, errorMessage, mediaUri);

    console.log('[codeblooded Horror] HTML set, popup should be visible');

    // Auto-close after animation and restore focus to original editor
    const duration = this.getPopupDuration(severity);
    setTimeout(async () => {
      console.log('[codeblooded Horror] Auto-closing popup after', duration, 'ms');
      
      // Release the effect lock
      EffectLock.release();
      
      if (this.panel) {
        try {
          this.panel.dispose();
        } catch (e) {
          console.error('[codeblooded Horror] Error disposing panel:', e);
        }
        this.panel = undefined;
      }

      // Small delay before restoring focus to ensure panel is fully closed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Restore focus to the original editor
      if (activeDocument) {
        console.log('[codeblooded Horror] Restoring focus to:', activeDocument.fileName);
        try {
          await vscode.window.showTextDocument(activeDocument, {
            viewColumn: activeEditor?.viewColumn,
            preserveFocus: false,
            preview: false
          });
        } catch (e) {
          console.error('[codeblooded Horror] Error restoring focus:', e);
        }
      }
    }, duration);
  }

  /**
   * Get popup duration based on severity
   * Synced with audio file lengths and video duration
   */
  private getPopupDuration(severity: PopupSeverity): number {
    switch (severity) {
      case 'warning':
        return 3000; // 3 seconds - warning popup
      case 'error':
        return 3000; // 3 seconds - moderate error
      case 'critical':
        return 5000; // 5 seconds - allows 4-second video to play fully with buffer
      default:
        return 3000;
    }
  }

  /**
   * Generate HTML for horror popup based on severity
   */
  private getHorrorHTML(severity: PopupSeverity, errorMessage?: string, videoUri?: string): string {
    const horrorContent = this.getHorrorContent(severity, errorMessage, videoUri);
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https: data: blob: vscode-resource:; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
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
      background: #000;
      position: relative;
    }

    .horror-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    /* Warning - Quick Ghost */
    .ghost {
      width: 200px;
      height: 250px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 50% 50% 0 0;
      position: relative;
      animation: ghostFloat 0.8s ease-out;
      box-shadow: 0 0 50px rgba(255, 255, 255, 0.8);
    }

    .ghost::before, .ghost::after {
      content: '';
      position: absolute;
      width: 30px;
      height: 30px;
      background: #000;
      border-radius: 50%;
      top: 80px;
      animation: ghostBlink 1.5s infinite;
    }

    .ghost::before { left: 50px; }
    .ghost::after { right: 50px; }

    @keyframes ghostFloat {
      0% {
        transform: translateY(150vh) scale(0.5);
        opacity: 0;
      }
      100% {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }

    @keyframes ghostBlink {
      0%, 45%, 55%, 100% { height: 30px; }
      50% { height: 2px; }
    }

    /* Error - Instant Glitch Skull */
    .glitch-face {
      width: 500px;
      height: 500px;
      position: relative;
      animation: instantAppear 0.05s ease-out, glitchShake 0.08s infinite 0.05s;
    }

    .glitch-face .face-emoji {
      width: 100%;
      height: 100%;
      font-size: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 0 40px rgba(255, 0, 0, 1)) brightness(1.5);
      text-shadow: 
        0 0 20px #ff0000,
        0 0 40px #ff0000,
        0 0 60px #ff0000;
    }

    @keyframes instantAppear {
      0% { transform: scale(5); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes glitchShake {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      20% { transform: translate(-8px, 8px) rotate(3deg); }
      40% { transform: translate(8px, -8px) rotate(-3deg); }
      60% { transform: translate(-6px, -6px) rotate(2deg); }
      80% { transform: translate(6px, 6px) rotate(-2deg); }
    }

    /* CRITICAL - REALISTIC HORROR FACE JUMPSCARE */
    .jumpscare {
      width: 100vw;
      height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
      background: #000;
      overflow: hidden;
    }

    .jumpscare-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      background: #000;
      animation: extremeFlash 0.05s 30 forwards;  /* Faster, more intense flashing */
    }

    /* Horror face container - rushes at screen */
    .horror-face-container {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: rushAtScreen 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards, 
                 headShake 0.04s 117 0.3s forwards;
      z-index: 10;
    }

    /* Horror video container */
    .horror-video-container {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      overflow: hidden;
      background: #000;
    }

    /* Horror video - silent jumpscare video */
    .horror-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: contrast(1.2) brightness(0.95) saturate(1.1);
    }

    /* Realistic SVG horror face */
    .horror-svg-face {
      width: 900px;
      height: 1100px;
      filter: contrast(1.4) brightness(0.9) saturate(0.8);
      animation: faceDistort 0.06s 83 forwards, faceTwitch 0.1s 47 forwards;
    }

    .dead-face {
      position: relative;
      width: 850px;
      height: 1000px;
      /* Sickly pale grayish-blue skin */
      background: 
        radial-gradient(ellipse at 50% 35%, 
          #b8c4d4 0%,
          #8a96a6 20%,
          #6c7884 40%,
          #4e5a66 70%,
          #303c48 100%);
      border-radius: 50% 50% 45% 45%;
      box-shadow: 
        inset 0 0 150px rgba(0, 0, 0, 0.95),
        inset 0 50px 100px rgba(0, 0, 50, 0.6),
        0 0 120px rgba(255, 0, 0, 0.6);
      animation: faceDistort 0.06s 83 forwards, faceTwitch 0.1s 47 forwards;
      filter: contrast(1.3) saturate(0.7);
    }

    /* Unnaturally large, sunken dead eyes */
    .dead-eyes {
      position: absolute;
      top: 28%;
      width: 100%;
      display: flex;
      justify-content: center;
      gap: 220px;
    }

    .dead-eye {
      width: 180px;
      height: 220px;
      position: relative;
      background: transparent;
      animation: eyeWiden 0.12s 39 forwards;
    }

    .eye-socket {
      position: absolute;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(ellipse at 50% 50%,
          #000 0%,
          #0d0d0d 30%,
          #1a1a1a 60%,
          rgba(30, 30, 30, 0.8) 100%);
      border-radius: 50%;
      box-shadow: 
        inset 0 0 60px rgba(0, 0, 0, 1),
        inset 0 30px 40px rgba(0, 0, 0, 0.9),
        0 0 40px rgba(100, 0, 0, 0.8);
    }

    .bloodshot-veins {
      position: absolute;
      width: 100%;
      height: 100%;
      background: 
        linear-gradient(30deg, transparent 45%, rgba(139, 0, 0, 0.8) 45%, rgba(139, 0, 0, 0.8) 55%, transparent 55%),
        linear-gradient(-30deg, transparent 48%, rgba(139, 0, 0, 0.6) 48%, rgba(139, 0, 0, 0.6) 52%, transparent 52%),
        linear-gradient(90deg, transparent 46%, rgba(100, 0, 0, 0.7) 46%, rgba(100, 0, 0, 0.7) 54%, transparent 54%),
        linear-gradient(120deg, transparent 47%, rgba(120, 0, 0, 0.5) 47%, rgba(120, 0, 0, 0.5) 53%, transparent 53%);
      border-radius: 50%;
      animation: veinPulse 0.15s 31 forwards;
    }

    /* Pinprick glowing pupils */
    .dead-pupil.pinprick {
      width: 20px;
      height: 20px;
      background: 
        radial-gradient(circle,
          #ff3333 0%,
          #ff0000 40%,
          #cc0000 100%);
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 
        0 0 60px rgba(255, 0, 0, 1),
        0 0 40px rgba(255, 50, 50, 1),
        inset 0 0 10px rgba(255, 255, 255, 0.8);
      animation: pupilGlowIntense 0.08s 58 forwards, pupilShake 0.04s 117 forwards;
    }

    .eye-veins {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      background: 
        linear-gradient(45deg, transparent 48%, rgba(139, 0, 0, 0.6) 48%, rgba(139, 0, 0, 0.6) 52%, transparent 52%),
        linear-gradient(-45deg, transparent 48%, rgba(139, 0, 0, 0.4) 48%, rgba(139, 0, 0, 0.4) 52%, transparent 52%),
        linear-gradient(90deg, transparent 48%, rgba(100, 0, 0, 0.3) 48%, rgba(100, 0, 0, 0.3) 52%, transparent 52%);
      animation: veinPulse 0.2s 23 forwards; /* 23 iterations = ~4.6 seconds */
    }

    /* Collapsed nose cavity */
    .nose-cavity {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translateX(-50%);
      width: 65px;
      height: 85px;
      background: 
        radial-gradient(ellipse at 50% 40%,
          #000 0%,
          #0d0000 50%,
          rgba(20, 10, 10, 0.8) 100%);
      border-radius: 45% 45% 50% 50%;
      box-shadow: 
        inset 0 0 40px rgba(0, 0, 0, 1),
        inset 0 15px 30px rgba(0, 0, 0, 0.9),
        0 0 25px rgba(80, 0, 0, 0.7);
      animation: noseBreath 0.25s 18 forwards;
    }

    /* Gaping screaming mouth with extreme opening */
    .dead-mouth.extreme-open {
      position: absolute;
      top: 65%;
      left: 50%;
      transform: translateX(-50%);
      width: 480px;
      height: 320px;
      background: 
        radial-gradient(ellipse at 50% 25%,
          #000 0%,
          #0a0000 30%,
          #1a0a0a 100%);
      border-radius: 50% 50% 50% 50% / 35% 35% 65% 65%;
      box-shadow: 
        inset 0 0 80px rgba(0, 0, 0, 1),
        inset 0 30px 60px rgba(139, 0, 0, 0.6),
        0 0 60px rgba(139, 0, 0, 0.8);
      animation: mouthScreamExtreme 0.08s 58 forwards;
      overflow: visible;
    }

    /* Dark stained gums */
    .gums {
      position: absolute;
      width: 100%;
      height: 40px;
      background: linear-gradient(90deg, #2a0a0a 0%, #3a1a1a 50%, #2a0a0a 100%);
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
    }

    .top-gum {
      top: 0;
      border-radius: 50% 50% 0 0;
    }

    .bottom-gum {
      bottom: 20px;
      border-radius: 0 0 50% 50%;
    }

    .teeth-row {
      position: absolute;
      display: flex;
      gap: 8px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
    }

    .top-teeth {
      top: 25px;
      gap: 10px;
    }

    .bottom-teeth {
      bottom: 45px;
      gap: 12px;
    }

    /* Sharp, misshapen teeth */
    .tooth {
      position: relative;
      width: 28px;
      height: 50px;
      background: linear-gradient(180deg, #d8d8c0 0%, #a8a890 100%);
      border-radius: 2px 2px 6px 6px;
      box-shadow: 
        inset 0 0 8px rgba(0, 0, 0, 0.4),
        0 2px 4px rgba(0, 0, 0, 0.6);
    }

    .tooth.sharp {
      clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
      height: 60px;
      background: linear-gradient(180deg, #e8e8d0 0%, #b8b8a0 100%);
    }

    .tooth.sharp.long {
      height: 75px;
      filter: brightness(1.1);
    }

    .tooth.jagged {
      clip-path: polygon(45% 0%, 30% 40%, 0% 100%, 100% 100%, 70% 40%, 55% 0%);
      background: linear-gradient(180deg, #c8c8b0 0%, #989880 100%);
    }

    .tooth.jagged.broken {
      height: 35px;
      background: linear-gradient(180deg, #888870 0%, #686850 100%);
    }

    .tooth.crooked {
      transform: rotate(-12deg);
      height: 55px;
    }

    .tooth.missing {
      opacity: 0;
    }

    /* Dark, diseased tongue */
    .tongue.diseased {
      position: absolute;
      bottom: 35px;
      left: 50%;
      transform: translateX(-50%);
      width: 240px;
      height: 120px;
      background: 
        radial-gradient(ellipse at 50% 35%,
          #6a2a2a 0%,
          #4a1a1a 50%,
          #2a0a0a 100%);
      border-radius: 50% 50% 45% 45%;
      box-shadow: 
        inset 0 0 30px rgba(0, 0, 0, 0.7),
        inset 0 10px 20px rgba(100, 0, 0, 0.4);
      animation: tongueMove 0.12s 39 forwards;
    }

    /* Decaying skin patches */
    .skin-decay {
      position: absolute;
      border-radius: 50%;
      background: 
        radial-gradient(circle,
          rgba(100, 50, 50, 0.8) 0%,
          rgba(60, 30, 30, 0.6) 50%,
          transparent 100%);
      animation: decayPulse 0.25s 18 forwards; /* 18 iterations = ~4.5 seconds */
    }

    .decay-1 {
      top: 20%;
      left: 15%;
      width: 120px;
      height: 120px;
    }

    .decay-2 {
      top: 25%;
      right: 20%;
      width: 150px;
      height: 150px;
      animation-delay: 0.1s;
    }

    .decay-3 {
      bottom: 20%;
      left: 25%;
      width: 100px;
      height: 100px;
      animation-delay: 0.2s;
    }

    .decay-4 {
      top: 50%;
      right: 15%;
      width: 130px;
      height: 130px;
      animation-delay: 0.15s;
    }

    /* Blood dripping from forehead */
    .blood-drip {
      position: absolute;
      top: 10%;
      width: 8px;
      background: linear-gradient(180deg, 
        rgba(139, 0, 0, 0.9) 0%,
        rgba(100, 0, 0, 0.7) 50%,
        rgba(80, 0, 0, 0.5) 100%);
      border-radius: 4px;
      animation: bloodDrip 1.2s infinite;
    }

    .drip-1 {
      left: 35%;
      height: 120px;
      animation-delay: 0s;
    }

    .drip-2 {
      left: 50%;
      height: 150px;
      animation-delay: 0.4s;
    }

    .drip-3 {
      left: 65%;
      height: 100px;
      animation-delay: 0.8s;
    }

    /* Blood tears from eyes */
    .eye-blood-tears {
      position: absolute;
      bottom: -20px;
      left: 50%;
      transform: translateX(-50%);
      width: 12px;
      height: 80px;
      background: linear-gradient(180deg, 
        rgba(139, 0, 0, 1) 0%,
        rgba(100, 0, 0, 0.8) 100%);
      border-radius: 6px;
      animation: tearsDrip 1.5s infinite;
    }

    /* Mouth blood drips */
    .mouth-blood-drip {
      position: absolute;
      bottom: -40px;
      width: 15px;
      height: 100px;
      background: linear-gradient(180deg, 
        rgba(139, 0, 0, 1) 0%,
        rgba(80, 0, 0, 0.6) 100%);
      border-radius: 8px;
      animation: mouthBloodDrip 1.8s infinite;
    }

    .left-drip {
      left: 15%;
      animation-delay: 0.3s;
    }

    .right-drip {
      right: 15%;
      animation-delay: 0.6s;
    }

    /* Exposed bones/cheekbones */
    .exposed-bone {
      position: absolute;
      top: 40%;
      width: 120px;
      height: 80px;
      background: 
        radial-gradient(ellipse at 50% 50%,
          #e8e8e0 0%,
          #c8c8b8 40%,
          #a8a898 100%);
      border-radius: 50% 40% 50% 40%;
      box-shadow: 
        inset 0 0 20px rgba(0, 0, 0, 0.3),
        0 0 15px rgba(255, 255, 255, 0.2);
      animation: bonePulse 0.3s 15 forwards;
    }

    .bone-left {
      left: 8%;
      transform: rotate(-25deg);
    }

    .bone-right {
      right: 8%;
      transform: rotate(25deg);
    }

    /* Jaw line */
    .jaw-line {
      position: absolute;
      bottom: 8%;
      left: 50%;
      transform: translateX(-50%);
      width: 400px;
      height: 60px;
      background: 
        linear-gradient(90deg,
          transparent 0%,
          rgba(200, 200, 190, 0.3) 20%,
          rgba(180, 180, 170, 0.5) 50%,
          rgba(200, 200, 190, 0.3) 80%,
          transparent 100%);
      border-radius: 0 0 50% 50%;
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.4);
    }

    /* Skin texture overlay */
    .skin-texture {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      background-image: 
        repeating-linear-gradient(0deg, 
          transparent 0px, 
          rgba(0, 0, 0, 0.05) 1px, 
          transparent 2px),
        repeating-linear-gradient(90deg, 
          transparent 0px, 
          rgba(0, 0, 0, 0.05) 1px, 
          transparent 2px);
      opacity: 0.6;
      pointer-events: none;
    }

    /* Screen glitch effect */
    .screen-glitch {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      background: 
        repeating-linear-gradient(0deg, 
          transparent 0px, 
          rgba(255, 0, 0, 0.03) 2px, 
          transparent 4px);
      animation: glitchEffect 0.1s 47 forwards;
      pointer-events: none;
      mix-blend-mode: overlay;
    }

    /* Small error text */
    .error-text-small {
      position: absolute;
      bottom: 20px;
      right: 20px;
      color: #ff0000;
      font-size: 14px;
      font-family: monospace;
      opacity: 0.6;
      z-index: 20;
    }

    /* Animations */
    @keyframes flicker {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.2;  /* Extreme flicker */
      }
    }

    @keyframes rushAtScreen {
      0% {
        transform: scale(0.05) translateZ(-2000px);
        opacity: 0;
        filter: blur(20px);
      }
      70% {
        transform: scale(1.2) translateZ(0);
        opacity: 1;
        filter: blur(0);
      }
      100% {
        transform: scale(1) translateZ(0);
        opacity: 1;
        filter: blur(0);
      }
    }

    @keyframes headShake {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      10% { transform: translate(-30px, 20px) rotate(8deg); }
      20% { transform: translate(30px, -20px) rotate(-8deg); }
      30% { transform: translate(-25px, -25px) rotate(6deg); }
      40% { transform: translate(25px, 25px) rotate(-6deg); }
      50% { transform: translate(-28px, 15px) rotate(7deg); }
      60% { transform: translate(28px, -15px) rotate(-7deg); }
      70% { transform: translate(-22px, -20px) rotate(5deg); }
      80% { transform: translate(22px, 20px) rotate(-5deg); }
      90% { transform: translate(-18px, 12px) rotate(3deg); }
    }

    @keyframes faceDistort {
      0%, 100% { 
        transform: scaleX(1) scaleY(1);
        filter: brightness(1);
      }
      50% { 
        transform: scaleX(1.05) scaleY(0.95);
        filter: brightness(1.2);
      }
    }

    @keyframes eyeTwitch {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(1.1); }
    }

    @keyframes pupilGlowDead {
      0%, 100% { 
        box-shadow: 0 0 40px rgba(255, 0, 0, 1);
      }
      50% { 
        box-shadow: 0 0 80px rgba(255, 0, 0, 1);
      }
    }

    @keyframes pupilShake {
      0%, 100% { transform: translate(-50%, -50%); }
      25% { transform: translate(-45%, -55%); }
      50% { transform: translate(-55%, -50%); }
      75% { transform: translate(-50%, -45%); }
    }

    @keyframes veinPulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    @keyframes noseBreath {
      0%, 100% { 
        transform: translateX(-50%) scaleY(1);
      }
      50% { 
        transform: translateX(-50%) scaleY(1.1);
      }
    }

    @keyframes mouthScream {
      0%, 100% { 
        transform: translateX(-50%) scaleY(1) scaleX(1);
      }
      50% { 
        transform: translateX(-50%) scaleY(1.08) scaleX(1.03);
      }
    }

    @keyframes tongueMove {
      0%, 100% { 
        transform: translateX(-50%) translateY(0);
      }
      50% { 
        transform: translateX(-50%) translateY(5px);
      }
    }

    @keyframes decayPulse {
      0%, 100% { 
        opacity: 0.6;
        transform: scale(1);
      }
      50% { 
        opacity: 0.9;
        transform: scale(1.1);
      }
    }

    @keyframes extremeFlash {
      0% { background: #000; }
      20% { background: #500; }  /* Brighter red flashes */
      40% { background: #000; }
      60% { background: #400; }
      80% { background: #000; }
      100% { background: #200; }
    }

    @keyframes faceTwitch {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    @keyframes eyeWiden {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    @keyframes pupilGlowIntense {
      0%, 100% { 
        box-shadow: 0 0 60px rgba(255, 0, 0, 1), 0 0 40px rgba(255, 50, 50, 1);
      }
      50% { 
        box-shadow: 0 0 100px rgba(255, 0, 0, 1), 0 0 80px rgba(255, 50, 50, 1);
      }
    }

    @keyframes mouthScreamExtreme {
      0%, 100% { 
        transform: translateX(-50%) scaleY(1) scaleX(1);
        height: 320px;
      }
      50% { 
        transform: translateX(-50%) scaleY(1.12) scaleX(1.05);
        height: 340px;
      }
    }

    @keyframes bloodDrip {
      0% { 
        transform: translateY(0);
        opacity: 0.9;
      }
      100% { 
        transform: translateY(150px);
        opacity: 0;
      }
    }

    @keyframes tearsDrip {
      0% { 
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
      100% { 
        transform: translateX(-50%) translateY(80px);
        opacity: 0;
      }
    }

    @keyframes mouthBloodDrip {
      0% { 
        transform: translateY(0);
        opacity: 1;
      }
      100% { 
        transform: translateY(120px);
        opacity: 0;
      }
    }

    @keyframes bonePulse {
      0%, 100% { 
        opacity: 0.7;
        filter: brightness(1);
      }
      50% { 
        opacity: 0.9;
        filter: brightness(1.2);
      }
    }

    @keyframes glitchEffect {
      0%, 100% { 
        transform: translateX(0);
        opacity: 0.3;
      }
      50% { 
        transform: translateX(-5px);
        opacity: 0.6;
      }
    }

    /* Blood overlay for critical */
    .blood-overlay-critical {
      position: absolute;
      top: 0;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 50% 50%, 
          rgba(139, 0, 0, 0.8) 0%, 
          rgba(100, 0, 0, 0.6) 30%,
          transparent 70%);
      animation: bloodPulseCritical 0.1s infinite;  /* Faster pulse */
      pointer-events: none;
      z-index: 5;
    }

    @keyframes bloodPulseCritical {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 0.9; }  /* More intense */
    }

    /* Glitch text overlay */
    .glitch-text {
      position: absolute;
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 72px;
      font-weight: 900;
      color: #ff0000;
      text-shadow: 
        0 0 20px rgba(255, 0, 0, 1),
        0 0 40px rgba(255, 0, 0, 0.8),
        3px 0 0 rgba(0, 255, 0, 0.5),
        -3px 0 0 rgba(0, 0, 255, 0.5);
      animation: glitchTextEffect 0.1s 47 forwards;
      z-index: 15;
      font-family: 'Courier New', monospace;
      letter-spacing: 8px;
    }

    @keyframes glitchTextEffect {
      0%, 100% { 
        transform: translateX(-50%) translateY(0);
        text-shadow: 
          0 0 20px rgba(255, 0, 0, 1),
          3px 0 0 rgba(0, 255, 0, 0.5),
          -3px 0 0 rgba(0, 0, 255, 0.5);
      }
      25% { 
        transform: translateX(-48%) translateY(-5px);
        text-shadow: 
          0 0 30px rgba(255, 0, 0, 1),
          -3px 0 0 rgba(0, 255, 0, 0.5),
          3px 0 0 rgba(0, 0, 255, 0.5);
      }
      50% { 
        transform: translateX(-52%) translateY(5px);
        text-shadow: 
          0 0 25px rgba(255, 0, 0, 1),
          5px 0 0 rgba(0, 255, 0, 0.5),
          -5px 0 0 rgba(0, 0, 255, 0.5);
      }
      75% { 
        transform: translateX(-50%) translateY(-3px);
        text-shadow: 
          0 0 35px rgba(255, 0, 0, 1),
          -5px 0 0 rgba(0, 255, 0, 0.5),
          5px 0 0 rgba(0, 0, 255, 0.5);
      }
    }

    /* Screen distortion effect */
    .screen-distortion {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      background: 
        repeating-linear-gradient(0deg, 
          transparent 0px, 
          rgba(255, 0, 0, 0.05) 2px, 
          transparent 4px);
      animation: distortionEffect 0.1s 47 forwards;
      pointer-events: none;
      mix-blend-mode: overlay;
      z-index: 12;
    }

    @keyframes distortionEffect {
      0%, 100% { 
        transform: translateY(0);
        opacity: 0.4;
      }
      50% { 
        transform: translateY(-10px);
        opacity: 0.7;
      }
    }

    /* Error text for critical */
    .error-text-critical {
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      color: #ff0000;
      font-size: 18px;
      font-family: 'Courier New', monospace;
      opacity: 0.8;
      z-index: 20;
      text-align: center;
      text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
      animation: textFlicker 0.2s 23 forwards;
    }

    @keyframes textFlicker {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 0.3; }
    }

    .screen-static {
      position: absolute;
      width: 100%;
      height: 100%;
      background-image: 
        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px);
      animation: staticNoise 0.05s infinite;
      pointer-events: none;
      mix-blend-mode: overlay;
    }

    @keyframes staticNoise {
      0% { transform: translateY(0); }
      100% { transform: translateY(-4px); }
    }

    .error-message {
      position: absolute;
      bottom: 80px;
      width: 100%;
      text-align: center;
      color: #ff0000;
      font-size: 36px;
      font-weight: bold;
      text-shadow: 
        0 0 20px rgba(255, 0, 0, 1),
        0 0 40px rgba(255, 0, 0, 0.8),
        2px 2px 4px #000;
      animation: messagePulse 0.3s infinite;
      font-family: 'Courier New', monospace;
      letter-spacing: 4px;
    }

    @keyframes messagePulse {
      0%, 100% { 
        opacity: 1; 
        transform: scale(1);
        filter: blur(0);
      }
      50% { 
        opacity: 0.8; 
        transform: scale(1.1);
        filter: blur(1px);
      }
    }

    .red-flash {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 0, 0, 0.8);
      animation: flashRed 0.15s ease-out;
      pointer-events: none;
    }

    @keyframes flashRed {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
  </style>
</head>
<body>
  ${horrorContent}
  <script>
    // Auto-hide content after duration (audio is handled by extension)
    const severity = '${severity}';
    
    const durations = {
      'warning': 2000,
      'error': 3000,
      'critical': 4000  // Matches 4-second video duration
    };
    
    const duration = durations[severity] || 2000;
    
    // Hide everything after animation completes
    setTimeout(() => {
      console.log('[Horror Popup] Animation complete, hiding content');
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.2s';
      
      // Signal that we're done (panel will be disposed from extension side)
      setTimeout(() => {
        document.body.innerHTML = '';
      }, 200);
    }, duration);
  </script>
</body>
</html>`;
  }

  /**
   * Get horror content based on severity
   */
  private getHorrorContent(severity: PopupSeverity, errorMessage?: string, videoUri?: string): string {
    switch (severity) {
      case 'warning':
      case 'error':
        // Quick ghost for warnings and errors
        return `
          <div class="horror-overlay">
            <div class="ghost"></div>
            ${errorMessage ? `<div class="error-message">${this.escapeHtml(errorMessage)}</div>` : ''}
          </div>
        `;

      case 'critical': {
        // CRITICAL JUMPSCARE - Silent video with external audio
        const videoSrc = videoUri || '';
        return `
          <div class="jumpscare">
            <div class="jumpscare-bg"></div>
            <div class="blood-overlay-critical"></div>
            <div class="horror-video-container">
              <video 
                id="horror-video"
                class="horror-video" 
                src="${videoSrc}" 
                autoplay 
                muted
                playsinline
                preload="auto"
              ></video>
            </div>
            <div class="error-text-critical">FATAL ERROR</div>
          </div>
          <script>
            (function() {
              const video = document.getElementById('horror-video');
              console.log('[Horror Video] Video element:', video);
              console.log('[Horror Video] Video src:', video ? video.src : 'NO VIDEO');
              console.log('[Horror Video] Video readyState:', video ? video.readyState : 'NO VIDEO');
              
              if (video) {
                video.addEventListener('loadstart', () => console.log('[Horror Video] loadstart'));
                video.addEventListener('loadedmetadata', () => console.log('[Horror Video] loadedmetadata'));
                video.addEventListener('loadeddata', () => console.log('[Horror Video] loadeddata - Video loaded successfully'));
                video.addEventListener('canplay', () => console.log('[Horror Video] canplay'));
                video.addEventListener('canplaythrough', () => console.log('[Horror Video] canplaythrough'));
                video.addEventListener('play', () => console.log('[Horror Video] play started'));
                video.addEventListener('playing', () => console.log('[Horror Video] playing'));
                video.addEventListener('error', (e) => {
                  console.error('[Horror Video] ERROR event:', e);
                  console.error('[Horror Video] Video error code:', video.error ? video.error.code : 'NO ERROR OBJECT');
                  console.error('[Horror Video] Video error message:', video.error ? video.error.message : 'NO ERROR OBJECT');
                });
                video.addEventListener('stalled', () => console.error('[Horror Video] stalled'));
                video.addEventListener('suspend', () => console.log('[Horror Video] suspend'));
                video.addEventListener('abort', () => console.error('[Horror Video] abort'));
                video.addEventListener('emptied', () => console.error('[Horror Video] emptied'));
                
                // Try to force load
                video.load();
                console.log('[Horror Video] load() called, readyState:', video.readyState);
              }
            })();
          </script>
        `;
      }

      default:
        return '';
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}
