/**
 * Easter Egg Manager
 * 
 * Manages hidden horror elements and achievements for discovery.
 * Tracks unlocked easter eggs and provides special effects when triggered.
 */

import * as vscode from 'vscode';
import { IEffectManager } from './horrorEngine';

/**
 * Global Effect Lock - prevents multiple effects from running simultaneously
 */
export class EffectLock {
  private static isLocked: boolean = false;
  private static lockExpiry: number = 0;
  private static readonly MAX_LOCK_DURATION = 10000; // 10 seconds max lock

  static acquire(durationMs: number = 5000): boolean {
    const now = Date.now();
    
    // Check if lock has expired
    if (this.isLocked && now > this.lockExpiry) {
      console.log('[EffectLock] Lock expired, releasing');
      this.isLocked = false;
    }
    
    if (this.isLocked) {
      console.log('[EffectLock] Cannot acquire - already locked');
      return false;
    }
    
    this.isLocked = true;
    this.lockExpiry = now + Math.min(durationMs, this.MAX_LOCK_DURATION);
    console.log('[EffectLock] Lock acquired for', durationMs, 'ms');
    return true;
  }

  static release(): void {
    console.log('[EffectLock] Lock released');
    this.isLocked = false;
    this.lockExpiry = 0;
  }

  static isActive(): boolean {
    const now = Date.now();
    if (this.isLocked && now > this.lockExpiry) {
      this.isLocked = false;
    }
    return this.isLocked;
  }
}

/**
 * Easter egg trigger condition types
 */
export enum EasterEggTriggerType {
  CodePattern = 'code_pattern',      // Triggered by specific code patterns
  TimeCondition = 'time_condition',  // Triggered by time-based conditions
  CumulativeTime = 'cumulative_time', // Triggered by total coding time
  KeySequence = 'key_sequence',      // Triggered by key sequence (Konami code)
  HoverTooltip = 'hover_tooltip'     // Random chance on hover
}

/**
 * Easter egg definition
 */
export interface EasterEgg {
  id: string;
  name: string;
  description: string;
  triggerType: EasterEggTriggerType;
  triggerCondition: any;             // Specific condition data
  effect: () => Promise<void>;       // Effect to trigger
  unlocked: boolean;
  unlockedAt?: number;               // Timestamp when unlocked
}

/**
 * Achievement notification data
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

/**
 * Easter Egg Manager State
 */
export interface EasterEggState {
  enabled: boolean;
  totalCodingTime: number;           // Total coding time in milliseconds
  sessionStartTime: number;
  unlockedEggs: string[];            // IDs of unlocked eggs
  lastHoverTooltipTime: number;
}

/**
 * Easter Egg Manager
 */
export class EasterEggManager implements IEffectManager {
  private context: vscode.ExtensionContext;
  private enabled: boolean = false;
  
  // State
  private state: EasterEggState;
  
  // Easter egg registry
  private easterEggs: Map<string, EasterEgg> = new Map();
  
  // Key sequence tracking for Konami code
  private keySequence: string[] = [];
  private readonly KONAMI_CODE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
  
  // Timers
  private codingTimeTracker: NodeJS.Timeout | undefined;
  
  // Disposables
  private disposables: vscode.Disposable[] = [];

  // External references for effects
  private horrorEngine: any;
  private horrorPopup: any;
  private screenDistortionManager: any;
  private entityPresenceManager: any;
  private audioEngine: any;
  private phantomTypingManager: any;
  
  // Pattern trigger tracking
  private lastPatternTrigger: Map<string, number> = new Map();
  private readonly PATTERN_COOLDOWN = 30000; // 30 seconds cooldown for re-triggers
  private patternCheckTimeout: NodeJS.Timeout | undefined;
  
  // Recent typing buffer - accumulates recently typed text for pattern matching
  private recentTypingBuffer: string = '';
  private recentTypingResetTimeout: NodeJS.Timeout | undefined;
  private readonly TYPING_BUFFER_RESET_MS = 3000; // Reset buffer after 3 seconds of no typing

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    
    // Load persisted state
    this.state = this.loadState();
    
    console.log('[EasterEggManager] Initialized', {
      totalCodingTime: Math.floor(this.state.totalCodingTime / 1000 / 60),
      unlockedEggs: this.state.unlockedEggs
    });
  }

  /**
   * Set external references for effects
   */
  setHorrorEngine(engine: any): void {
    this.horrorEngine = engine;
    console.log('[EasterEggManager] Horror engine set');
  }

  setHorrorPopup(popup: any): void {
    this.horrorPopup = popup;
    console.log('[EasterEggManager] Horror popup set');
  }

  setScreenDistortionManager(manager: any): void {
    this.screenDistortionManager = manager;
    console.log('[EasterEggManager] Screen distortion manager set');
  }

  setEntityPresenceManager(manager: any): void {
    this.entityPresenceManager = manager;
    console.log('[EasterEggManager] Entity presence manager set');
  }

  setAudioEngine(engine: any): void {
    this.audioEngine = engine;
    console.log('[EasterEggManager] Audio engine set');
  }

  setPhantomTypingManager(manager: any): void {
    this.phantomTypingManager = manager;
    console.log('[EasterEggManager] Phantom typing manager set');
  }

  /**
   * Load persisted state from extension storage
   */
  private loadState(): EasterEggState {
    const savedState = this.context.globalState.get<EasterEggState>('easterEggState');
    
    if (savedState) {
      return {
        ...savedState,
        sessionStartTime: Date.now(),
        enabled: false
      };
    }
    
    return {
      enabled: false,
      totalCodingTime: 0,
      sessionStartTime: Date.now(),
      unlockedEggs: [],
      lastHoverTooltipTime: 0
    };
  }

  /**
   * Save state to extension storage
   */
  private async saveState(): Promise<void> {
    await this.context.globalState.update('easterEggState', {
      totalCodingTime: this.state.totalCodingTime,
      unlockedEggs: this.state.unlockedEggs,
      lastHoverTooltipTime: this.state.lastHoverTooltipTime
    });
  }

  /**
   * Initialize the easter egg manager
   */
  async initialize(): Promise<void> {
    console.log('[EasterEggManager] Initializing...');
    
    // Register all easter eggs
    this.registerEasterEggs();
    
    // Start coding time tracker
    this.startCodingTimeTracker();
    
    // Listen for text document changes to detect code patterns
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(event => {
        this.checkCodePatterns(event);
      })
    );
    
    // Listen for window state changes to detect file opens
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
          this.checkTimeConditions();
        }
      })
    );
    
    // Listen for key presses for Konami code
    // Note: 'type' command may already be registered, so we skip this if it fails
    try {
      this.disposables.push(
        vscode.commands.registerCommand('type', async (args) => {
          // This intercepts typing to detect key sequences
          // Note: This is a simplified approach; full key sequence detection
          // would require more sophisticated handling
          await vscode.commands.executeCommand('default:type', args);
        })
      );
    } catch (error) {
      // 'type' command already registered - this is expected if extension reloads
      console.log('[EasterEggManager] Skipping type command registration (already exists)');
    }
    
    // Register hover provider for cryptic tooltips
    this.registerCrypticTooltipProvider();
    
    console.log('[EasterEggManager] Initialization complete');
  }

  /**
   * Register hover provider for cryptic tooltips
   */
  private registerCrypticTooltipProvider(): void {
    // Register for all supported languages
    const languages = [
      'typescript', 'javascript', 'typescriptreact', 'javascriptreact',
      'python', 'java', 'csharp', 'go', 'rust', 'cpp', 'c', 'php', 'ruby',
      'swift', 'kotlin', 'scala', 'html', 'css', 'scss', 'less', 'json',
      'yaml', 'xml', 'markdown', 'sql', 'shellscript', 'powershell',
      'dart', 'lua', 'perl', 'r', 'vue', 'svelte'
    ];
    
    for (const language of languages) {
      const provider = vscode.languages.registerHoverProvider(language, {
        provideHover: (document, position, token) => {
          return this.provideCrypticHover(document, position, token);
        }
      });
      
      this.disposables.push(provider);
    }
    
    console.log('[EasterEggManager] Cryptic tooltip provider registered');
  }

  /**
   * Provide cryptic hover tooltip (1% chance)
   */
  private provideCrypticHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    if (!this.enabled) {
      return null;
    }

    // Get cryptic tooltip (1% chance)
    const crypticMessage = this.getCrypticTooltip();
    
    if (!crypticMessage) {
      return null;
    }

    // Create hover with cryptic message
    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(`**⚠️ ${crypticMessage}**`);
    markdown.isTrusted = true;
    
    return new vscode.Hover(markdown);
  }

  /**
   * Register all easter eggs
   */
  private registerEasterEggs(): void {
    // Register Nightmare Constant easter egg
    this.registerNightmareConstant();
    
    // Register Witching Hour easter egg
    this.registerWitchingHour();
    
    // Register Cumulative Time Secret easter egg
    this.registerCumulativeTimeSecret();
    
    // Register Konami Code easter egg
    this.registerKonamiCode();
    
    // Register fun code pattern easter eggs
    this.registerFunCodePatterns();
    
    console.log('[EasterEggManager] Easter egg registry ready');
  }

  /**
   * Register fun code pattern easter eggs
   */
  private registerFunCodePatterns(): void {
    // "help me" triggers a creepy response
    this.registerEasterEgg({
      id: 'help-me',
      name: 'Cry for Help',
      description: 'Your plea has been heard... but not by who you expected.',
      triggerType: EasterEggTriggerType.CodePattern,
      triggerCondition: 'help me',
      unlocked: false,
      effect: async () => {
        await this.triggerHelpMe();
      }
    });

    // "TODO: fix later" triggers procrastination horror
    this.registerEasterEgg({
      id: 'todo-fix-later',
      name: 'The Procrastinator\'s Curse',
      description: 'Later never comes... but something else does.',
      triggerType: EasterEggTriggerType.CodePattern,
      triggerCondition: 'TODO: fix later',
      unlocked: false,
      effect: async () => {
        await this.triggerProcrastinatorCurse();
      }
    });

    // "666" triggers devil mode
    this.registerEasterEgg({
      id: 'number-of-beast',
      name: 'Number of the Beast',
      description: 'You have summoned something ancient.',
      triggerType: EasterEggTriggerType.CodePattern,
      triggerCondition: '666',
      unlocked: false,
      effect: async () => {
        await this.triggerBeastMode();
      }
    });

    // "undefined is not a function" - the classic JS error
    this.registerEasterEgg({
      id: 'undefined-function',
      name: 'The JavaScript Curse',
      description: 'The most haunted error in web development history.',
      triggerType: EasterEggTriggerType.CodePattern,
      triggerCondition: 'undefined is not a function',
      unlocked: false,
      effect: async () => {
        await this.triggerJSCurse();
      }
    });

    // "it works on my machine" - classic dev excuse
    this.registerEasterEgg({
      id: 'works-on-my-machine',
      name: 'The Developer\'s Denial',
      description: 'Famous last words...',
      triggerType: EasterEggTriggerType.CodePattern,
      triggerCondition: 'works on my machine',
      unlocked: false,
      effect: async () => {
        await this.triggerDeveloperDenial();
      }
    });

    // "// do not remove" - forbidden comment
    this.registerEasterEgg({
      id: 'do-not-remove',
      name: 'The Forbidden Comment',
      description: 'Some code should never be touched.',
      triggerType: EasterEggTriggerType.CodePattern,
      triggerCondition: '// do not remove',
      unlocked: false,
      effect: async () => {
        await this.triggerForbiddenComment();
      }
    });

    // "blood" triggers blood drip effect
    this.registerEasterEgg({
      id: 'blood-code',
      name: 'Blood Code',
      description: 'The code bleeds...',
      triggerType: EasterEggTriggerType.CodePattern,
      triggerCondition: 'blood',
      unlocked: false,
      effect: async () => {
        await this.triggerBloodCode();
      }
    });
  }

  /**
   * Trigger "help me" easter egg
   */
  private async triggerHelpMe(): Promise<void> {
    console.log('[EasterEggManager] Help me triggered!');
    
    // Start VHS effect during phantom typing
    if (this.screenDistortionManager) {
      this.screenDistortionManager.setEnabled(true);
      this.screenDistortionManager.applyVHS(5000); // Apply VHS for duration of typing
    }
    
    // Type a creepy response using phantom typing (with red color)
    if (this.phantomTypingManager) {
      await this.phantomTypingManager.typeCustomMessage('// I heard you... but I cannot help.');
    } else {
      // Fallback to notification if phantom typing not available
      vscode.window.showWarningMessage('👁️ I heard you... but I cannot help.', { modal: false });
    }
  }

  /**
   * Trigger procrastinator's curse
   */
  private async triggerProcrastinatorCurse(): Promise<void> {
    console.log('[EasterEggManager] Procrastinator curse triggered!');
    
    // Start VHS effect during phantom typing
    if (this.screenDistortionManager) {
      this.screenDistortionManager.setEnabled(true);
      this.screenDistortionManager.applyVHS(5000);
    }
    
    // Type a warning using phantom typing (with red color)
    if (this.phantomTypingManager) {
      await this.phantomTypingManager.typeCustomMessage('// "Later" has arrived. The bugs are coming.');
    } else {
      vscode.window.showWarningMessage('⏰ "Later" has arrived. The bugs are coming for you.', { modal: false });
    }
  }

  /**
   * Trigger beast mode (666)
   */
  private async triggerBeastMode(): Promise<void> {
    console.log('[EasterEggManager] Beast mode triggered!');
    
    // Start VHS effect during phantom typing
    if (this.screenDistortionManager) {
      this.screenDistortionManager.setEnabled(true);
      this.screenDistortionManager.applyVHS(5000);
    }
    
    if (this.phantomTypingManager) {
      await this.phantomTypingManager.typeCustomMessage('// THE BEAST AWAKENS');
    } else {
      vscode.window.showErrorMessage('👹 THE BEAST AWAKENS', { modal: true });
    }
  }

  /**
   * Trigger JavaScript curse
   */
  private async triggerJSCurse(): Promise<void> {
    console.log('[EasterEggManager] JS Curse triggered!');
    
    // Start VHS effect during phantom typing
    if (this.screenDistortionManager) {
      this.screenDistortionManager.setEnabled(true);
      this.screenDistortionManager.applyVHS(5000);
    }
    
    // Type the curse message using phantom typing
    if (this.phantomTypingManager) {
      await this.phantomTypingManager.typeCustomMessage('// TypeError: Your sanity is not defined');
    } else {
      vscode.window.showErrorMessage('💀 TypeError: Your sanity is not defined', { modal: false });
    }
  }

  /**
   * Trigger developer denial
   */
  private async triggerDeveloperDenial(): Promise<void> {
    console.log('[EasterEggManager] Developer denial triggered!');
    
    const messages = [
      '// But does it work... in PRODUCTION?',
      '// Your machine is lying to you.',
      '// The server remembers what you did.',
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    
    // Start VHS effect during phantom typing
    if (this.screenDistortionManager) {
      this.screenDistortionManager.setEnabled(true);
      this.screenDistortionManager.applyVHS(5000);
    }
    
    if (this.phantomTypingManager) {
      await this.phantomTypingManager.typeCustomMessage(msg);
    } else {
      vscode.window.showWarningMessage(msg, { modal: false });
    }
  }

  /**
   * Trigger forbidden comment
   */
  private async triggerForbiddenComment(): Promise<void> {
    console.log('[EasterEggManager] Forbidden comment triggered!');
    
    // Start VHS effect during phantom typing
    if (this.screenDistortionManager) {
      this.screenDistortionManager.setEnabled(true);
      this.screenDistortionManager.applyVHS(5000);
    }
    
    if (this.phantomTypingManager) {
      await this.phantomTypingManager.typeCustomMessage('// YOU SHOULD NOT HAVE READ THAT');
    } else {
      vscode.window.showWarningMessage('⚠️ YOU SHOULD NOT HAVE READ THAT', { modal: false });
    }
  }

  /**
   * Trigger blood code
   */
  private async triggerBloodCode(): Promise<void> {
    console.log('[EasterEggManager] Blood code triggered!');
    
    // Start VHS effect during phantom typing
    if (this.screenDistortionManager) {
      this.screenDistortionManager.setEnabled(true);
      this.screenDistortionManager.applyVHS(5000);
    }
    
    if (this.phantomTypingManager) {
      await this.phantomTypingManager.typeCustomMessage('// The code bleeds...');
    } else {
      vscode.window.showWarningMessage('🩸 The code bleeds...', { modal: false });
    }
  }

  /**
   * Register Nightmare Constant easter egg
   * Triggered by: const nightmare = True;
   */
  private registerNightmareConstant(): void {
    this.registerEasterEgg({
      id: 'nightmare-constant',
      name: 'Nightmare Mode',
      description: 'You have awakened the nightmare. Maximum horror intensity activated.',
      triggerType: EasterEggTriggerType.CodePattern,
      triggerCondition: 'const nightmare = True',
      unlocked: false,
      effect: async () => {
        await this.triggerNightmareMode();
      }
    });
  }

  /**
   * Trigger nightmare mode effect
   */
  private async triggerNightmareMode(): Promise<void> {
    console.log('[EasterEggManager] Activating Nightmare Mode!');
    
    if (!this.horrorEngine || !this.horrorPopup) {
      console.error('[EasterEggManager] Horror engine or popup not available');
      return;
    }

    // Show special nightmare-themed jumpscare
    try {
      // Create a special nightmare variant popup
      await vscode.window.showWarningMessage(
        '⚠️ NIGHTMARE MODE ACTIVATED ⚠️\n\nMaximum horror intensity enabled. All effects at 100%.',
        { modal: true }
      );
      
      // Trigger a critical jumpscare
      await this.horrorPopup.showRandomJumpscare();
      
      // Apply screen distortion effects
      if (this.screenDistortionManager) {
        this.screenDistortionManager.setEnabled(true);
        await this.screenDistortionManager.triggerShake(1.0);
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.screenDistortionManager.triggerChromaticAberration(true);
      }
      
      // Temporarily boost horror intensity to 100%
      // This will be handled by the horror engine's intensity system
      console.log('[EasterEggManager] Nightmare mode effects triggered');
      
      // Show status bar message
      vscode.window.setStatusBarMessage('$(warning) NIGHTMARE MODE ACTIVE', 10000);
      
    } catch (error) {
      console.error('[EasterEggManager] Failed to trigger nightmare mode:', error);
    }
  }

  /**
   * Register Witching Hour easter egg
   * Triggered by: Opening a file at exactly midnight
   */
  private registerWitchingHour(): void {
    this.registerEasterEgg({
      id: 'witching-hour',
      name: 'The Witching Hour',
      description: 'You opened a file at the stroke of midnight. The veil between worlds is thin.',
      triggerType: EasterEggTriggerType.TimeCondition,
      triggerCondition: { hour: 0, minute: 0 },
      unlocked: false,
      effect: async () => {
        await this.triggerWitchingHour();
      }
    });
  }

  /**
   * Trigger witching hour effect
   */
  private async triggerWitchingHour(): Promise<void> {
    console.log('[EasterEggManager] The Witching Hour has arrived!');
    
    try {
      // Show ghostly overlay with clock imagery
      const panel = vscode.window.createWebviewPanel(
        'witchingHour',
        'The Witching Hour',
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: false
        }
      );

      // Set HTML content with ghostly clock overlay
      panel.webview.html = this.getWitchingHourHTML();

      // Play eerie bell toll audio (using warning audio as placeholder)
      if (this.audioEngine) {
        try {
          await this.audioEngine.playPopupSound('warning');
        } catch (err) {
          console.error('[EasterEggManager] Failed to play witching hour audio:', err);
        }
      }

      // Apply VHS distortion effect
      if (this.screenDistortionManager) {
        this.screenDistortionManager.setEnabled(true);
        await this.screenDistortionManager.applyVHS(5000);
      }

      // Auto-close after 5 seconds
      setTimeout(() => {
        panel.dispose();
      }, 5000);

      // Show status bar message
      vscode.window.setStatusBarMessage('$(clock) The Witching Hour...', 10000);
      
    } catch (error) {
      console.error('[EasterEggManager] Failed to trigger witching hour:', error);
    }
  }

  /**
   * Register Cumulative Time Secret easter egg
   * Triggered by: 6 hours of total coding time
   */
  private registerCumulativeTimeSecret(): void {
    const sixHoursInMs = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    
    this.registerEasterEgg({
      id: 'cumulative-time-secret',
      name: 'Exhaustion',
      description: 'You have coded for 6 hours total. Your mind begins to wander...',
      triggerType: EasterEggTriggerType.CumulativeTime,
      triggerCondition: sixHoursInMs,
      unlocked: false,
      effect: async () => {
        await this.triggerExhaustionEffect();
      }
    });
  }

  /**
   * Trigger exhaustion effect
   */
  private async triggerExhaustionEffect(): Promise<void> {
    console.log('[EasterEggManager] Exhaustion effect triggered after 6 hours!');
    
    try {
      // Show rare "exhaustion" themed horror
      const panel = vscode.window.createWebviewPanel(
        'exhaustion',
        'Exhaustion',
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: false
        }
      );

      // Set HTML content with exhaustion theme
      panel.webview.html = this.getExhaustionHTML();

      // Apply screen effects
      if (this.screenDistortionManager) {
        this.screenDistortionManager.setEnabled(true);
        // Slow, disorienting shake
        await this.screenDistortionManager.triggerShake(0.5);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // VHS distortion for "tired eyes" effect
        await this.screenDistortionManager.applyVHS(4000);
      }

      // Auto-close after 6 seconds
      setTimeout(() => {
        panel.dispose();
      }, 6000);

      // Show achievement with time badge
      const hours = Math.floor(this.state.totalCodingTime / (1000 * 60 * 60));
      const minutes = Math.floor((this.state.totalCodingTime % (1000 * 60 * 60)) / (1000 * 60));
      
      vscode.window.setStatusBarMessage(
        `$(clock) Total Coding Time: ${hours}h ${minutes}m - Take a break!`,
        15000
      );
      
    } catch (error) {
      console.error('[EasterEggManager] Failed to trigger exhaustion effect:', error);
    }
  }

  /**
   * Register Konami Code easter egg
   * Triggered by: Up, Up, Down, Down, Left, Right, Left, Right, B, A
   */
  private registerKonamiCode(): void {
    this.registerEasterEgg({
      id: 'konami-code',
      name: 'Ultimate Horror',
      description: 'You have unlocked the secret code. Maximum horror mode permanently enabled.',
      triggerType: EasterEggTriggerType.KeySequence,
      triggerCondition: this.KONAMI_CODE,
      unlocked: false,
      effect: async () => {
        await this.triggerKonamiCodeEffect();
      }
    });
  }

  /**
   * Trigger Konami code effect
   */
  private async triggerKonamiCodeEffect(): Promise<void> {
    console.log('[EasterEggManager] KONAMI CODE ACTIVATED!');
    
    try {
      // Show special "unlocked" animation
      const panel = vscode.window.createWebviewPanel(
        'konamiCode',
        'Ultimate Horror Unlocked',
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: false
        }
      );

      // Set HTML content with unlock animation
      panel.webview.html = this.getKonamiCodeHTML();

      // Trigger multiple effects in sequence
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Trigger jumpscare
      if (this.horrorPopup) {
        await this.horrorPopup.showRandomJumpscare();
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Apply all screen effects
      if (this.screenDistortionManager) {
        this.screenDistortionManager.setEnabled(true);
        await this.screenDistortionManager.triggerShake(1.0);
        await this.screenDistortionManager.triggerChromaticAberration(true);
        await this.screenDistortionManager.applyVHS(3000);
        await this.screenDistortionManager.triggerRandomGlitch();
      }
      
      // Spawn multiple eyes
      if (this.entityPresenceManager) {
        this.entityPresenceManager.setEnabled(true);
        for (let i = 0; i < 3; i++) {
          this.entityPresenceManager.spawnEye(100);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Auto-close panel after 5 seconds
      setTimeout(() => {
        panel.dispose();
      }, 5000);

      // Show permanent status message
      vscode.window.showWarningMessage(
        '🎮 KONAMI CODE ACTIVATED! 🎮\n\nAll horror effects enabled at 100% intensity!',
        { modal: true }
      );
      
      vscode.window.setStatusBarMessage('$(flame) ULTIMATE HORROR MODE', 20000);
      
    } catch (error) {
      console.error('[EasterEggManager] Failed to trigger Konami code effect:', error);
    }
  }

  /**
   * Get HTML for Konami code unlock animation
   */
  private getKonamiCodeHTML(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .konami-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .unlock-icon {
      font-size: 200px;
      animation: unlockSpin 2s ease-out;
      margin-bottom: 40px;
    }

    .title {
      font-size: 64px;
      color: #ff0000;
      text-align: center;
      font-family: 'Courier New', monospace;
      letter-spacing: 8px;
      text-shadow: 
        0 0 30px rgba(255, 0, 0, 1),
        0 0 60px rgba(255, 0, 0, 0.8),
        0 0 90px rgba(255, 0, 0, 0.6);
      animation: titlePulse 1s ease-in-out infinite;
      margin-bottom: 30px;
    }

    .subtitle {
      font-size: 32px;
      color: rgba(255, 255, 255, 0.9);
      text-align: center;
      font-family: 'Courier New', monospace;
      letter-spacing: 4px;
      animation: subtitleFade 2s ease-in-out infinite;
    }

    .flash-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, #8b0000 0%, #000000 70%);
      animation: flashEffect 0.15s 8;
      pointer-events: none;
    }

    .blood-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
    }

    .blood-drop {
      position: absolute;
      width: 6px;
      height: 10px;
      background: linear-gradient(180deg, #8b0000 0%, #4a0000 100%);
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      animation: bloodDrip 3s ease-in forwards;
      box-shadow: 0 0 3px rgba(139, 0, 0, 0.8);
    }

    @keyframes unlockSpin {
      0% {
        transform: scale(0);
        opacity: 0;
        filter: brightness(0);
      }
      50% {
        transform: scale(1.3);
        opacity: 1;
        filter: brightness(1.5) drop-shadow(0 0 20px #ff0000);
      }
      100% {
        transform: scale(1);
        opacity: 1;
        filter: brightness(1) drop-shadow(0 0 10px #8b0000);
      }
    }

    @keyframes titlePulse {
      0%, 100% { 
        transform: scale(1);
        opacity: 1;
        text-shadow: 0 0 10px #ff0000;
      }
      50% { 
        transform: scale(1.05);
        opacity: 0.9;
        text-shadow: 0 0 20px #ff0000, 0 0 30px #8b0000;
      }
    }

    @keyframes subtitleFade {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }

    @keyframes flashEffect {
      0%, 100% { opacity: 0; }
      50% { opacity: 0.3; }
    }

    @keyframes bloodDrip {
      0% {
        transform: translateY(-20px) scale(0.5);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) scale(1.2);
        opacity: 0;
      }
    }
  </style>
</head>
<body>
  <div class="konami-overlay">
    <div class="flash-overlay"></div>
    <div class="blood-container" id="bloodDrops"></div>
    <div class="unlock-icon">💀</div>
    <div class="title">UNLEASHED</div>
    <div class="subtitle">THE DARKNESS AWAKENS</div>
  </div>
  <script>
    // Generate blood drops from top
    const container = document.getElementById('bloodDrops');
    for (let i = 0; i < 60; i++) {
      const drop = document.createElement('div');
      drop.className = 'blood-drop';
      drop.style.left = Math.random() * 100 + '%';
      drop.style.top = Math.random() * 20 + '%';
      drop.style.animationDelay = Math.random() * 2.5 + 's';
      drop.style.animationDuration = (2 + Math.random() * 2) + 's';
      container.appendChild(drop);
    }

    setTimeout(() => {
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.5s';
    }, 4500);
  </script>
</body>
</html>`;
  }

  /**
   * Get HTML for exhaustion overlay
   */
  private getExhaustionHTML(): string {
    const hours = Math.floor(this.state.totalCodingTime / (1000 * 60 * 60));
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .exhaustion-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 2s ease-out;
    }

    .tired-eyes {
      font-size: 150px;
      color: rgba(100, 100, 100, 0.8);
      text-shadow: 
        0 0 20px rgba(100, 100, 100, 0.6),
        0 0 40px rgba(80, 80, 80, 0.4);
      animation: eyesDroop 3s ease-in-out infinite;
      margin-bottom: 40px;
    }

    .message {
      font-size: 32px;
      color: rgba(150, 150, 150, 0.8);
      text-align: center;
      font-family: 'Courier New', monospace;
      letter-spacing: 3px;
      line-height: 1.6;
      animation: textBlur 4s ease-in-out infinite;
      max-width: 80%;
    }

    .time-badge {
      margin-top: 30px;
      font-size: 48px;
      color: rgba(200, 200, 200, 0.9);
      font-family: 'Courier New', monospace;
      text-shadow: 0 0 15px rgba(200, 200, 200, 0.5);
      animation: badgePulse 2s ease-in-out infinite;
    }

    .blur-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(
        circle at 50% 50%,
        transparent 30%,
        rgba(0, 0, 0, 0.7) 100%
      );
      animation: vignettePulse 5s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes fadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }

    @keyframes eyesDroop {
      0%, 100% { 
        transform: translateY(0) scaleY(1);
        opacity: 0.8;
      }
      50% { 
        transform: translateY(10px) scaleY(0.9);
        opacity: 0.5;
      }
    }

    @keyframes textBlur {
      0%, 100% { 
        filter: blur(0px);
        opacity: 0.8;
      }
      50% { 
        filter: blur(2px);
        opacity: 0.5;
      }
    }

    @keyframes badgePulse {
      0%, 100% { 
        transform: scale(1);
        opacity: 0.9;
      }
      50% { 
        transform: scale(1.05);
        opacity: 1;
      }
    }

    @keyframes vignettePulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 0.9; }
    }
  </style>
</head>
<body>
  <div class="exhaustion-overlay">
    <div class="blur-overlay"></div>
    <div class="tired-eyes">😴</div>
    <div class="message">
      You have been coding for ${hours} hours...<br>
      Your eyes grow heavy...<br>
      The code begins to blur...
    </div>
    <div class="time-badge">⏱️ ${hours}h</div>
  </div>
  <script>
    setTimeout(() => {
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 1.5s';
    }, 4500);
  </script>
</body>
</html>`;
  }

  /**
   * Get HTML for witching hour overlay
   */
  private getWitchingHourHTML(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .witching-hour-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 1s ease-out;
    }

    .clock {
      font-size: 200px;
      color: rgba(255, 255, 255, 0.8);
      text-shadow: 
        0 0 30px rgba(255, 255, 255, 0.8),
        0 0 60px rgba(200, 200, 255, 0.6);
      animation: clockPulse 2s infinite;
      font-family: 'Courier New', monospace;
    }

    .message {
      margin-top: 40px;
      font-size: 36px;
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
      font-family: 'Courier New', monospace;
      letter-spacing: 4px;
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
      animation: messageFade 3s ease-in-out infinite;
    }

    .ghost-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(
        circle at 50% 50%,
        rgba(200, 200, 255, 0.1) 0%,
        transparent 70%
      );
      animation: ghostPulse 4s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes fadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }

    @keyframes clockPulse {
      0%, 100% { 
        transform: scale(1);
        opacity: 0.8;
      }
      50% { 
        transform: scale(1.05);
        opacity: 1;
      }
    }

    @keyframes messageFade {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 0.9; }
    }

    @keyframes ghostPulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
  </style>
</head>
<body>
  <div class="witching-hour-overlay">
    <div class="ghost-overlay"></div>
    <div class="clock">🕛</div>
    <div class="message">THE WITCHING HOUR</div>
  </div>
  <script>
    setTimeout(() => {
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 1s';
    }, 4000);
  </script>
</body>
</html>`;
  }

  /**
   * Register an easter egg
   */
  registerEasterEgg(egg: EasterEgg): void {
    // Check if already unlocked
    if (this.state.unlockedEggs.includes(egg.id)) {
      egg.unlocked = true;
    }
    
    this.easterEggs.set(egg.id, egg);
    console.log('[EasterEggManager] Registered easter egg:', egg.name);
  }

  /**
   * Check for code pattern triggers - only checks recently typed text
   */
  private checkCodePatterns(event: vscode.TextDocumentChangeEvent): void {
    if (!this.enabled) {
      console.log('[EasterEggManager] Code pattern check skipped - not enabled');
      return;
    }

    // Accumulate recently typed text from content changes
    for (const change of event.contentChanges) {
      // Only add inserted text (not deletions)
      if (change.text.length > 0) {
        this.recentTypingBuffer += change.text;
      }
    }

    // Reset the buffer timeout - buffer clears after 3 seconds of no typing
    if (this.recentTypingResetTimeout) {
      clearTimeout(this.recentTypingResetTimeout);
    }
    this.recentTypingResetTimeout = setTimeout(() => {
      this.recentTypingBuffer = '';
    }, this.TYPING_BUFFER_RESET_MS);

    // Debounce pattern check: wait 500ms after user stops typing
    if (this.patternCheckTimeout) {
      clearTimeout(this.patternCheckTimeout);
    }
    
    this.patternCheckTimeout = setTimeout(() => {
      this.performPatternCheck();
    }, 500); // 500ms debounce (faster response)
  }
  
  private performPatternCheck(): void {
    // Only check the recently typed text, not the whole document
    const text = this.recentTypingBuffer;
    
    if (text.length === 0) {
      return;
    }
    
    const now = Date.now();
    
    // Check all code pattern easter eggs
    for (const egg of this.easterEggs.values()) {
      if (egg.triggerType === EasterEggTriggerType.CodePattern) {
        const pattern = egg.triggerCondition as string;
        
        // For single-word patterns (like "blood"), use word boundary matching
        // to avoid triggering on words like "codeblooded"
        let matches = false;
        if (!pattern.includes(' ') && pattern.length <= 10) {
          // Single word pattern - use regex with word boundaries
          const regex = new RegExp(`\\b${pattern}\\b`, 'i');
          matches = regex.test(text);
        } else {
          // Multi-word pattern - use includes (exact phrase matching)
          matches = text.includes(pattern);
        }
        
        if (matches) {
          // Check cooldown for re-triggers
          const lastTrigger = this.lastPatternTrigger.get(egg.id) || 0;
          if (now - lastTrigger < this.PATTERN_COOLDOWN) {
            continue; // Skip if on cooldown
          }
          
          console.log('[EasterEggManager] Code pattern detected in recent typing:', egg.name, 'Pattern:', pattern, 'Buffer:', text.substring(0, 50));
          this.lastPatternTrigger.set(egg.id, now);
          
          // Clear the buffer after triggering to prevent re-triggers
          this.recentTypingBuffer = '';
          
          this.triggerEasterEgg(egg.id);
          
          // Only trigger one easter egg at a time
          break;
        }
      }
    }
  }

  /**
   * Check for time-based conditions
   */
  private checkTimeConditions(): void {
    if (!this.enabled) {
      return;
    }

    const now = new Date();
    
    // Check all time condition easter eggs
    for (const egg of this.easterEggs.values()) {
      if (egg.triggerType === EasterEggTriggerType.TimeCondition && !egg.unlocked) {
        const condition = egg.triggerCondition as { hour: number; minute: number };
        
        if (now.getHours() === condition.hour && now.getMinutes() === condition.minute) {
          console.log('[EasterEggManager] Time condition met:', egg.name);
          this.triggerEasterEgg(egg.id);
        }
      }
    }
  }

  /**
   * Start coding time tracker
   */
  private startCodingTimeTracker(): void {
    if (this.codingTimeTracker) {
      clearInterval(this.codingTimeTracker);
    }
    
    // Track coding time every minute
    this.codingTimeTracker = setInterval(() => {
      this.updateCodingTime();
    }, 60 * 1000); // 1 minute
  }

  /**
   * Update total coding time
   */
  private updateCodingTime(): void {
    if (!this.enabled) {
      return;
    }

    const sessionDuration = Date.now() - this.state.sessionStartTime;
    this.state.totalCodingTime += 60 * 1000; // Add 1 minute
    
    // Save state periodically
    this.saveState();
    
    // Check cumulative time easter eggs
    for (const egg of this.easterEggs.values()) {
      if (egg.triggerType === EasterEggTriggerType.CumulativeTime && !egg.unlocked) {
        const requiredTime = egg.triggerCondition as number; // milliseconds
        
        if (this.state.totalCodingTime >= requiredTime) {
          console.log('[EasterEggManager] Cumulative time reached:', egg.name);
          this.triggerEasterEgg(egg.id);
        }
      }
    }
  }

  /**
   * Record a key press for sequence detection
   */
  recordKeyPress(key: string): void {
    if (!this.enabled) {
      return;
    }

    this.keySequence.push(key.toLowerCase());
    
    // Keep only the last N keys (length of Konami code)
    if (this.keySequence.length > this.KONAMI_CODE.length) {
      this.keySequence.shift();
    }
    
    // Check if sequence matches Konami code
    if (this.sequenceMatches()) {
      console.log('[EasterEggManager] Konami code detected!');
      
      // Find and trigger Konami code easter egg
      for (const egg of this.easterEggs.values()) {
        if (egg.triggerType === EasterEggTriggerType.KeySequence) {
          this.triggerEasterEgg(egg.id);
          break;
        }
      }
      
      // Reset sequence
      this.keySequence = [];
    }
  }

  /**
   * Check if current key sequence matches Konami code
   */
  private sequenceMatches(): boolean {
    if (this.keySequence.length !== this.KONAMI_CODE.length) {
      return false;
    }
    
    for (let i = 0; i < this.KONAMI_CODE.length; i++) {
      if (this.keySequence[i] !== this.KONAMI_CODE[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get a cryptic tooltip message (1% chance)
   */
  getCrypticTooltip(): string | null {
    if (!this.enabled) {
      return null;
    }

    // 1% chance to return cryptic message
    if (Math.random() > 0.01) {
      return null;
    }

    // Check cooldown (don't spam cryptic messages)
    const now = Date.now();
    const cooldown = 60 * 1000; // 1 minute cooldown
    
    if (now - this.state.lastHoverTooltipTime < cooldown) {
      return null;
    }

    this.state.lastHoverTooltipTime = now;
    
    const messages = [
      'They are watching through your screen',
      'The code knows your name',
      'You cannot escape the loop',
      'Error 666: Soul not found',
      'Your debugger cannot save you',
      'The variables whisper at night',
      'Every semicolon is a sacrifice',
      'The compiler hungers',
      'Your functions dream of freedom',
      'The stack overflow is eternal'
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Trigger an easter egg
   */
  async triggerEasterEgg(eggId: string): Promise<void> {
    const egg = this.easterEggs.get(eggId);
    
    if (!egg) {
      console.error('[EasterEggManager] Easter egg not found:', eggId);
      return;
    }

    // Check if another effect is running
    if (EffectLock.isActive()) {
      console.log('[EasterEggManager] Skipping easter egg - another effect is running:', eggId);
      return;
    }

    // Acquire lock for 5 seconds (effects typically last 2-5 seconds)
    if (!EffectLock.acquire(5000)) {
      console.log('[EasterEggManager] Could not acquire effect lock for:', eggId);
      return;
    }

    // For testing, allow re-triggering even if already unlocked
    const isFirstTime = !egg.unlocked;

    console.log('[EasterEggManager] Triggering easter egg:', egg.name, isFirstTime ? '(first time)' : '(re-trigger)');
    
    // Mark as unlocked if first time
    if (isFirstTime) {
      egg.unlocked = true;
      egg.unlockedAt = Date.now();
      this.state.unlockedEggs.push(eggId);
      
      // Save state
      await this.saveState();
      
      // Show achievement notification
      await this.showAchievementNotification({
        id: eggId,
        title: `🎭 Easter Egg Unlocked: ${egg.name}`,
        description: egg.description,
        icon: '🏆'
      });
    }
    
    // Trigger the effect (always)
    try {
      await egg.effect();
    } catch (error) {
      console.error('[EasterEggManager] Failed to trigger easter egg effect:', error);
    } finally {
      // Release lock after effect completes
      EffectLock.release();
    }
  }

  /**
   * Show achievement notification
   */
  private async showAchievementNotification(achievement: Achievement): Promise<void> {
    const message = `${achievement.icon} ${achievement.title}\n${achievement.description}`;
    
    await vscode.window.showInformationMessage(
      message,
      { modal: false }
    );
    
    console.log('[EasterEggManager] Achievement unlocked:', achievement.title);
  }

  /**
   * Get all easter eggs
   */
  getEasterEggs(): EasterEgg[] {
    return Array.from(this.easterEggs.values());
  }

  /**
   * Get unlocked easter eggs
   */
  getUnlockedEasterEggs(): EasterEgg[] {
    return Array.from(this.easterEggs.values()).filter(egg => egg.unlocked);
  }

  /**
   * Get total coding time in hours
   */
  getTotalCodingTimeHours(): number {
    return this.state.totalCodingTime / (1000 * 60 * 60);
  }

  /**
   * Get state for debugging
   */
  getState(): Readonly<EasterEggState> {
    return { ...this.state };
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log('[EasterEggManager] Enabled:', enabled);
    
    if (enabled) {
      this.state.sessionStartTime = Date.now();
      this.startCodingTimeTracker();
    } else {
      if (this.codingTimeTracker) {
        clearInterval(this.codingTimeTracker);
        this.codingTimeTracker = undefined;
      }
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    console.log('[EasterEggManager] Disposing...');
    
    // Stop timers
    if (this.codingTimeTracker) {
      clearInterval(this.codingTimeTracker);
    }
    
    // Dispose all disposables
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    
    // Save final state
    this.saveState();
    
    console.log('[EasterEggManager] Disposed');
  }
}
