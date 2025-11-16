import * as vscode from 'vscode';

/**
 * Accessibility state detected from VS Code settings
 */
export interface AccessibilityState {
  reduceMotion: boolean;
  highContrast: boolean;
  screenReaderOptimized: boolean;
}

/**
 * SafetyManager ensures user safety and accessibility compliance
 * for the psychological horror features of CodeChroma.
 * 
 * Key responsibilities:
 * - Display photosensitivity warnings on first run
 * - Provide panic button for instant disable
 * - Monitor accessibility settings
 * - Detect screen sharing
 * - Manage safe mode state
 */
export class SafetyManager {
  private context: vscode.ExtensionContext;
  private isSafeMode: boolean = true; // Default to safe mode
  private accessibilityState: AccessibilityState;
  private panicButtonDisposable: vscode.Disposable | undefined;
  private onSafeModeChangedEmitter = new vscode.EventEmitter<boolean>();
  public readonly onSafeModeChanged = this.onSafeModeChangedEmitter.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    
    // Load safe mode state from storage (defaults to true for safety)
    this.isSafeMode = context.globalState.get<boolean>('codechroma.safeMode', true);
    
    // Initialize accessibility state
    this.accessibilityState = this.checkAccessibilitySettings();
    
    // Register panic button command
    this.registerPanicButton();
    
    // Monitor accessibility settings changes
    this.monitorAccessibilitySettings();
    
    console.log('[SafetyManager] Initialized', {
      safeMode: this.isSafeMode,
      accessibility: this.accessibilityState
    });
  }

  /**
   * Show first-run warning dialog with photosensitivity notice
   * Returns true if user accepts, false if they decline
   */
  async showFirstRunWarning(): Promise<boolean> {
    const hasSeenWarning = this.context.globalState.get<boolean>('codechroma.hasSeenHorrorWarning', false);
    
    if (hasSeenWarning) {
      console.log('[SafetyManager] User has already seen warning');
      return true;
    }

    const warningMessage = `
⚠️ PHOTOSENSITIVITY WARNING ⚠️

CodeChroma contains:
• Flashing lights and rapid visual changes
• Jump scares with disturbing imagery
• Unsettling audio effects
• Psychological horror elements

NOT RECOMMENDED for users with:
• Photosensitive epilepsy or seizure disorders
• Anxiety disorders or PTSD
• Heart conditions sensitive to stress
• Preference for calm coding environments

SAFETY FEATURES:
• Panic Button: Ctrl+Shift+Escape (instant disable)
• Safe Mode: Currently ENABLED by default
• Accessibility: Respects Reduce Motion settings

Do you want to enable horror features?
    `.trim();

    const result = await vscode.window.showWarningMessage(
      warningMessage,
      { modal: true },
      'Enable Horror Features',
      'Stay in Safe Mode',
      'Learn More'
    );

    if (result === 'Learn More') {
      // Show additional information
      await vscode.window.showInformationMessage(
        'CodeChroma horror features are designed for entertainment. All effects are temporary and reversible. Your code is never permanently modified. Use the panic button (Ctrl+Shift+Escape) at any time to instantly disable all effects.',
        { modal: true }
      );
      
      // Ask again after showing more info
      return this.showFirstRunWarning();
    }

    // Mark as seen regardless of choice
    await this.context.globalState.update('codechroma.hasSeenHorrorWarning', true);

    if (result === 'Enable Horror Features') {
      console.log('[SafetyManager] User accepted horror features');
      await this.exitSafeMode();
      return true;
    } else {
      console.log('[SafetyManager] User declined horror features, staying in safe mode');
      await this.enterSafeMode();
      return false;
    }
  }

  /**
   * Register the panic button command (Ctrl+Shift+Escape)
   */
  private registerPanicButton(): void {
    this.panicButtonDisposable = vscode.commands.registerCommand(
      'codechroma.panicButton',
      () => this.activatePanicButton()
    );
    
    this.context.subscriptions.push(this.panicButtonDisposable);
    
    // Register keybinding
    console.log('[SafetyManager] Panic button registered (Ctrl+Shift+Escape)');
  }

  /**
   * Activate panic button - instantly disable all horror effects
   */
  async activatePanicButton(): Promise<void> {
    console.log('[SafetyManager] PANIC BUTTON ACTIVATED');
    
    await this.enterSafeMode();
    
    // Show confirmation with prominent styling
    await vscode.window.showInformationMessage(
      '🛡️ SAFE MODE ACTIVATED\n\nAll horror effects have been disabled. You can re-enable them in settings when ready.',
      { modal: true }
    );
    
    // Update status bar to show safe mode
    vscode.window.setStatusBarMessage('$(shield) CodeChroma: Safe Mode Active', 5000);
  }

  /**
   * Check current accessibility settings from VS Code
   */
  checkAccessibilitySettings(): AccessibilityState {
    const config = vscode.workspace.getConfiguration();
    
    // Check for Reduce Motion preference
    const reduceMotion = config.get<boolean>('workbench.reduceMotion', false);
    
    // Check for High Contrast theme
    const colorTheme = vscode.window.activeColorTheme;
    const highContrast = colorTheme.kind === vscode.ColorThemeKind.HighContrast ||
                         colorTheme.kind === vscode.ColorThemeKind.HighContrastLight;
    
    // Check for screen reader optimization
    const screenReaderOptimized = config.get<boolean>('editor.accessibilitySupport', 'auto') === 'on';
    
    const state: AccessibilityState = {
      reduceMotion,
      highContrast,
      screenReaderOptimized
    };
    
    console.log('[SafetyManager] Accessibility state:', state);
    
    return state;
  }

  /**
   * Monitor accessibility settings for changes
   */
  private monitorAccessibilitySettings(): void {
    // Listen for configuration changes
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('workbench.reduceMotion') ||
            event.affectsConfiguration('editor.accessibilitySupport')) {
          
          const previousState = this.accessibilityState;
          this.accessibilityState = this.checkAccessibilitySettings();
          
          // If Reduce Motion was just enabled, notify user
          if (!previousState.reduceMotion && this.accessibilityState.reduceMotion) {
            vscode.window.showInformationMessage(
              'CodeChroma: Reduce Motion detected. Screen shake and rapid animations will be disabled.'
            );
          }
          
          console.log('[SafetyManager] Accessibility settings changed:', this.accessibilityState);
        }
      })
    );
    
    // Listen for theme changes (for high contrast detection)
    this.context.subscriptions.push(
      vscode.window.onDidChangeActiveColorTheme(() => {
        const previousState = this.accessibilityState;
        this.accessibilityState = this.checkAccessibilitySettings();
        
        if (!previousState.highContrast && this.accessibilityState.highContrast) {
          vscode.window.showInformationMessage(
            'CodeChroma: High Contrast mode detected. Horror effects will be adjusted for visibility.'
          );
        }
      })
    );
  }

  /**
   * Detect if screen is being shared
   * Note: VS Code doesn't provide direct screen sharing detection API,
   * so we use heuristics and user configuration
   */
  detectScreenSharing(): boolean {
    // Check if user has manually indicated they're screen sharing
    const config = vscode.workspace.getConfiguration('codechroma');
    const manualScreenSharing = config.get<boolean>('safety.screenSharingMode', false);
    
    if (manualScreenSharing) {
      console.log('[SafetyManager] Screen sharing mode manually enabled');
      return true;
    }
    
    // Additional heuristics could be added here
    // For now, rely on manual configuration
    
    return false;
  }

  /**
   * Enter safe mode - disable all horror effects
   */
  async enterSafeMode(): Promise<void> {
    if (this.isSafeMode) {
      console.log('[SafetyManager] Already in safe mode');
      return;
    }
    
    this.isSafeMode = true;
    await this.context.globalState.update('codechroma.safeMode', true);
    
    // Update configuration
    const config = vscode.workspace.getConfiguration('codechroma');
    await config.update('horror.enabled', false, vscode.ConfigurationTarget.Global);
    
    console.log('[SafetyManager] Entered safe mode');
    this.onSafeModeChangedEmitter.fire(true);
  }

  /**
   * Exit safe mode - enable horror effects
   */
  async exitSafeMode(): Promise<void> {
    if (!this.isSafeMode) {
      console.log('[SafetyManager] Already out of safe mode');
      return;
    }
    
    this.isSafeMode = false;
    await this.context.globalState.update('codechroma.safeMode', false);
    
    // Update configuration
    const config = vscode.workspace.getConfiguration('codechroma');
    await config.update('horror.enabled', true, vscode.ConfigurationTarget.Global);
    
    console.log('[SafetyManager] Exited safe mode');
    this.onSafeModeChangedEmitter.fire(false);
  }

  /**
   * Get current safe mode state
   */
  isSafeModeActive(): boolean {
    return this.isSafeMode;
  }

  /**
   * Get current accessibility state
   */
  getAccessibilityState(): AccessibilityState {
    return { ...this.accessibilityState };
  }

  /**
   * Check if horror effects should be disabled due to accessibility or safety
   */
  shouldDisableEffects(): boolean {
    // Disable if in safe mode
    if (this.isSafeMode) {
      return true;
    }
    
    // Disable if screen sharing
    if (this.detectScreenSharing()) {
      return true;
    }
    
    // Don't automatically disable for accessibility settings,
    // but effects should respect them (e.g., no screen shake if reduceMotion)
    
    return false;
  }

  /**
   * Check if specific effect types should be disabled
   */
  shouldDisableScreenShake(): boolean {
    return this.accessibilityState.reduceMotion || this.isSafeMode;
  }

  shouldDisableRapidAnimations(): boolean {
    return this.accessibilityState.reduceMotion || this.isSafeMode;
  }

  shouldDisableFlashing(): boolean {
    return this.accessibilityState.reduceMotion || this.isSafeMode;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.onSafeModeChangedEmitter.dispose();
    console.log('[SafetyManager] Disposed');
  }
}
