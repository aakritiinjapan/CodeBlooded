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
 * for the psychological horror features of codeblooded.
 * 
 * Key responsibilities:
 * - Display photosensitivity warnings on first run
 * - Provide panic button for instant disable
 * - Monitor accessibility settings
 * - Detect screen sharing
 * - Manage safe mode state
 */
/**
 * Flash event tracking for frequency limiting
 */
interface FlashEvent {
  timestamp: number;
  type: string;
}

export class SafetyManager {
  private context: vscode.ExtensionContext;
  private isSafeMode: boolean = true; // Default to safe mode
  private accessibilityState: AccessibilityState;
  private panicButtonDisposable: vscode.Disposable | undefined;
  private statusBarItem: vscode.StatusBarItem;
  private onSafeModeChangedEmitter = new vscode.EventEmitter<boolean>();
  public readonly onSafeModeChanged = this.onSafeModeChangedEmitter.event;
  private onAccessibilityChangedEmitter = new vscode.EventEmitter<AccessibilityState>();
  public readonly onAccessibilityChanged = this.onAccessibilityChangedEmitter.event;
  
  // Flash frequency limiting
  private flashEvents: FlashEvent[] = [];
  private maxFlashesPerSecond: number = 3;
  private flashTrackingWindow: number = 1000; // 1 second in milliseconds
  
  // Focus mode detection
  private isFocusModeActive: boolean = false;
  private focusModeCheckInterval: NodeJS.Timeout | undefined;
  
  // Debugging session detection
  private isDebuggingActive: boolean = false;
  private onDebuggingChangedEmitter = new vscode.EventEmitter<boolean>();
  public readonly onDebuggingChanged = this.onDebuggingChangedEmitter.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    
    // Load safe mode state from configuration (defaults to true for safety)
    const config = vscode.workspace.getConfiguration('codeblooded');
    this.isSafeMode = config.get<boolean>('horror.safeMode', true);
    
    // Initialize accessibility state
    this.accessibilityState = this.checkAccessibilitySettings();
    
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'codeblooded.toggleSafeMode';
    this.updateStatusBar();
    this.statusBarItem.show();
    context.subscriptions.push(this.statusBarItem);
    
    // Register panic button command
    this.registerPanicButton();
    
    // Register toggle safe mode command
    this.registerToggleSafeMode();
    
    // Monitor accessibility settings changes
    this.monitorAccessibilitySettings();
    
    // Monitor configuration changes
    this.monitorConfigurationChanges();
    
    // Start focus mode detection
    this.startFocusModeDetection();
    
    // Start debugging session detection
    this.startDebuggingDetection();
    
    console.log('[SafetyManager] Initialized', {
      safeMode: this.isSafeMode,
      accessibility: this.accessibilityState
    });
  }
  
  /**
   * Start debugging session detection
   * Monitors VS Code debug sessions
   */
  private startDebuggingDetection(): void {
    // Listen for debug session start
    this.context.subscriptions.push(
      vscode.debug.onDidStartDebugSession(() => {
        this.handleDebuggingStateChange(true);
      })
    );
    
    // Listen for debug session end
    this.context.subscriptions.push(
      vscode.debug.onDidTerminateDebugSession(() => {
        // Check if there are any other active debug sessions
        const hasActiveDebugSession = vscode.debug.activeDebugSession !== undefined;
        this.handleDebuggingStateChange(hasActiveDebugSession);
      })
    );
    
    // Check initial state
    this.isDebuggingActive = vscode.debug.activeDebugSession !== undefined;
    console.log('[SafetyManager] Initial debugging state:', this.isDebuggingActive);
  }
  
  /**
   * Handle debugging state changes
   */
  private handleDebuggingStateChange(isDebugging: boolean): void {
    if (this.isDebuggingActive === isDebugging) {
      return; // No change
    }
    
    this.isDebuggingActive = isDebugging;
    console.log('[SafetyManager] Debugging state changed:', isDebugging);
    
    if (isDebugging) {
      vscode.window.showInformationMessage(
        '🐛 codeblooded: Debugging session detected. Horror effects are paused.',
        { modal: false }
      );
    } else {
      vscode.window.showInformationMessage(
        'codeblooded: Debugging session ended. Horror effects resumed.',
        { modal: false }
      );
    }
    
    // Emit event for horror engine to pause/resume effects
    this.onDebuggingChangedEmitter.fire(isDebugging);
  }
  
  /**
   * Check if debugging is active
   */
  isDebuggingDetected(): boolean {
    return this.isDebuggingActive;
  }
  
  /**
   * Start focus mode detection
   * Checks periodically if Zen Mode (focus mode) is active
   */
  private startFocusModeDetection(): void {
    // Check immediately
    this.checkFocusMode();
    
    // Check every 5 seconds
    this.focusModeCheckInterval = setInterval(() => {
      this.checkFocusMode();
    }, 5000);
  }
  
  /**
   * Check if focus mode (Zen Mode) is active
   */
  private checkFocusMode(): void {
    // VS Code doesn't provide a direct API to check Zen Mode status
    // We check the workbench.zenMode.* settings as a proxy
    const config = vscode.workspace.getConfiguration('zenMode');
    
    // If any Zen Mode settings are configured, we assume user might use it
    // But we can't directly detect if it's currently active
    // So we'll rely on window state changes and configuration
    
    // For now, we'll check if the user has manually indicated focus mode
    const manualFocusMode = vscode.workspace.getConfiguration('codeblooded')
      .get<boolean>('safety.focusMode', false);
    
    const wasFocusModeActive = this.isFocusModeActive;
    this.isFocusModeActive = manualFocusMode;
    
    // If focus mode state changed, notify
    if (wasFocusModeActive !== this.isFocusModeActive) {
      this.handleFocusModeChange(this.isFocusModeActive);
    }
  }
  
  /**
   * Handle focus mode changes
   */
  private handleFocusModeChange(isFocusMode: boolean): void {
    console.log('[SafetyManager] Focus mode changed:', isFocusMode);
    
    if (isFocusMode) {
      vscode.window.showInformationMessage(
        '🎯 codeblooded: Focus Mode detected. Horror effects are paused.',
        { modal: false }
      );
    } else {
      vscode.window.showInformationMessage(
        'codeblooded: Focus Mode ended. Horror effects resumed.',
        { modal: false }
      );
    }
    
    // Emit event for horror engine to pause/resume effects
    this.onSafeModeChangedEmitter.fire(isFocusMode || this.isSafeMode);
  }
  
  /**
   * Check if focus mode is active
   */
  isFocusModeDetected(): boolean {
    return this.isFocusModeActive;
  }
  
  /**
   * Manually enable focus mode
   */
  async enableFocusMode(): Promise<void> {
    const config = vscode.workspace.getConfiguration('codeblooded');
    await config.update('safety.focusMode', true, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage(
      '🎯 codeblooded: Focus Mode enabled. Horror effects are paused.',
      { modal: false }
    );
    
    console.log('[SafetyManager] Focus mode manually enabled');
  }
  
  /**
   * Manually disable focus mode
   */
  async disableFocusMode(): Promise<void> {
    const config = vscode.workspace.getConfiguration('codeblooded');
    await config.update('safety.focusMode', false, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage(
      'codeblooded: Focus Mode disabled. Horror effects resumed.',
      { modal: false }
    );
    
    console.log('[SafetyManager] Focus mode manually disabled');
  }
  
  /**
   * Toggle focus mode
   */
  async toggleFocusMode(): Promise<void> {
    if (this.isFocusModeActive) {
      await this.disableFocusMode();
    } else {
      await this.enableFocusMode();
    }
  }

  /**
   * Show first-run warning dialog with photosensitivity notice
   * Returns true if user accepts, false if they decline
   */
  async showFirstRunWarning(): Promise<boolean> {
    const hasSeenWarning = this.context.globalState.get<boolean>('codeblooded.hasSeenHorrorWarning', false);
    const config = vscode.workspace.getConfiguration('codeblooded');
    const horrorEnabled = config.get<boolean>('horror.enabled', false);
    const safeMode = config.get<boolean>('horror.safeMode', true);
    
    // Show warning if they haven't seen it, OR if they're in the default unconfigured state
    // (both safeMode=true and horrorEnabled=false means fresh install or reset)
    const isDefaultState = safeMode && !horrorEnabled;
    
    if (hasSeenWarning && !isDefaultState) {
      // User has already seen the warning and has configured settings
      console.log('[SafetyManager] User has already seen warning, horror.enabled =', horrorEnabled);
      return horrorEnabled; // Return their previous choice
    }
    
    // If in default state, clear the flag to show warning again
    if (isDefaultState && hasSeenWarning) {
      console.log('[SafetyManager] Extension in default state - showing warning again');
      await this.context.globalState.update('codeblooded.hasSeenHorrorWarning', false);
    }

    const warningMessage = `
⚠️ PHOTOSENSITIVITY WARNING ⚠️

codeblooded contains:
• Flashing lights and rapid visual changes
• Jump scares with disturbing imagery
• Unsettling audio effects

NOT RECOMMENDED for users with:
• Photosensitive epilepsy or seizure disorders
• Anxiety disorders or PTSD
• Heart conditions sensitive to stress
• Preference for calm coding environments

SAFETY FEATURES:
• Panic Button: Ctrl+Alt+S (instant disable)
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
        'codeblooded horror features are designed for entertainment. All effects are temporary and reversible. Your code is never permanently modified. Use the panic button (Ctrl+Alt+S) at any time to instantly disable all effects.',
        { modal: true }
      );
      
      // Ask again after showing more info
      return this.showFirstRunWarning();
    }

    // Mark as seen regardless of choice
    await this.context.globalState.update('codeblooded.hasSeenHorrorWarning', true);

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
   * Register the panic button command (Ctrl+Alt+S)
   */
  private registerPanicButton(): void {
    this.panicButtonDisposable = vscode.commands.registerCommand(
      'codeblooded.panicButton',
      () => this.activatePanicButton()
    );
    
    this.context.subscriptions.push(this.panicButtonDisposable);
    
    // Register keybinding
    console.log('[SafetyManager] Panic button registered (Ctrl+Alt+S)');
  }

  /**
   * Register the toggle safe mode command
   */
  private registerToggleSafeMode(): void {
    const disposable = vscode.commands.registerCommand(
      'codeblooded.toggleSafeMode',
      () => this.toggleSafeMode()
    );
    
    this.context.subscriptions.push(disposable);
    
    console.log('[SafetyManager] Toggle safe mode command registered');
  }

  /**
   * Toggle safe mode on/off
   */
  async toggleSafeMode(): Promise<void> {
    if (this.isSafeMode) {
      await this.exitSafeMode();
    } else {
      await this.enterSafeMode();
    }
  }

  /**
   * Update status bar item
   */
  private updateStatusBar(): void {
    if (this.isSafeMode) {
      this.statusBarItem.text = '$(shield) Safe Mode';
      this.statusBarItem.tooltip = 'codeblooded: Safe Mode Active\nAll horror effects disabled\nClick to disable safe mode';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      this.statusBarItem.text = '$(eye) Horror Active';
      this.statusBarItem.tooltip = 'codeblooded: Horror Effects Active\nClick to enable safe mode';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }
  }

  /**
   * Monitor configuration changes
   */
  private monitorConfigurationChanges(): void {
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('codeblooded.horror.safeMode')) {
          const config = vscode.workspace.getConfiguration('codeblooded');
          const newSafeMode = config.get<boolean>('horror.safeMode', true);
          
          if (newSafeMode !== this.isSafeMode) {
            this.isSafeMode = newSafeMode;
            this.updateStatusBar();
            this.onSafeModeChangedEmitter.fire(newSafeMode);
            
            console.log('[SafetyManager] Safe mode changed via configuration:', newSafeMode);
          }
        }
        
        // Monitor screen sharing mode changes
        if (event.affectsConfiguration('codeblooded.safety.screenSharingMode')) {
          const isScreenSharing = this.detectScreenSharing();
          
          if (isScreenSharing && !this.isSafeMode) {
            // Automatically enter safe mode when screen sharing is enabled
            this.enterSafeMode();
            vscode.window.showInformationMessage(
              '📺 codeblooded: Screen sharing detected. Horror effects have been automatically disabled.',
              { modal: false }
            );
          }
          
          console.log('[SafetyManager] Screen sharing mode changed:', isScreenSharing);
        }
      })
    );
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
    vscode.window.setStatusBarMessage('$(shield) codeblooded: Safe Mode Active', 5000);
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
    const accessibilitySupport = config.get<string>('editor.accessibilitySupport', 'auto');
    const screenReaderOptimized = accessibilitySupport === 'on';
    
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
          
          // If Reduce Motion was just enabled, notify user and emit event
          if (!previousState.reduceMotion && this.accessibilityState.reduceMotion) {
            vscode.window.showInformationMessage(
              '🛡️ codeblooded: Reduce Motion detected. Screen shake, rapid animations, and flashing effects have been disabled for your safety.',
              { modal: false }
            );
            
            // Emit accessibility change event
            this.onAccessibilityChangedEmitter.fire(this.accessibilityState);
          }
          
          // If Reduce Motion was disabled, notify user
          if (previousState.reduceMotion && !this.accessibilityState.reduceMotion) {
            vscode.window.showInformationMessage(
              'codeblooded: Reduce Motion disabled. All horror effects are now available.',
              { modal: false }
            );
            
            // Emit accessibility change event
            this.onAccessibilityChangedEmitter.fire(this.accessibilityState);
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
            'codeblooded: High Contrast mode detected. Horror effects will be adjusted for visibility.'
          );
          
          // Emit accessibility change event
          this.onAccessibilityChangedEmitter.fire(this.accessibilityState);
        }
        
        if (previousState.highContrast && !this.accessibilityState.highContrast) {
          // Emit accessibility change event
          this.onAccessibilityChangedEmitter.fire(this.accessibilityState);
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
    const config = vscode.workspace.getConfiguration('codeblooded');
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
   * Enable screen sharing mode (disables all horror effects)
   */
  async enableScreenSharingMode(): Promise<void> {
    const config = vscode.workspace.getConfiguration('codeblooded');
    await config.update('safety.screenSharingMode', true, vscode.ConfigurationTarget.Global);
    
    // Enter safe mode automatically
    await this.enterSafeMode();
    
    vscode.window.showInformationMessage(
      '📺 codeblooded: Screen Sharing Mode enabled. All horror effects are disabled.',
      { modal: false }
    );
    
    console.log('[SafetyManager] Screen sharing mode enabled');
  }
  
  /**
   * Disable screen sharing mode
   */
  async disableScreenSharingMode(): Promise<void> {
    const config = vscode.workspace.getConfiguration('codeblooded');
    await config.update('safety.screenSharingMode', false, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage(
      'codeblooded: Screen Sharing Mode disabled. You can now re-enable horror effects.',
      { modal: false }
    );
    
    console.log('[SafetyManager] Screen sharing mode disabled');
  }
  
  /**
   * Toggle screen sharing mode
   */
  async toggleScreenSharingMode(): Promise<void> {
    const isScreenSharing = this.detectScreenSharing();
    
    if (isScreenSharing) {
      await this.disableScreenSharingMode();
    } else {
      await this.enableScreenSharingMode();
    }
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
    
    // Update configuration
    const config = vscode.workspace.getConfiguration('codeblooded');
    await config.update('horror.safeMode', true, vscode.ConfigurationTarget.Global);
    
    // Update status bar
    this.updateStatusBar();
    
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
    
    // Show warning before exiting safe mode
    const result = await vscode.window.showWarningMessage(
      '⚠️ Disable Safe Mode?\n\nThis will enable horror effects including jumpscares, screen distortions, and phantom events.\n\nUse Panic Button (Ctrl+Alt+S) to instantly re-enable safe mode.',
      { modal: true },
      'Disable Safe Mode',
      'Cancel'
    );
    
    if (result !== 'Disable Safe Mode') {
      return;
    }
    
    this.isSafeMode = false;
    
    // Update configuration
    const config = vscode.workspace.getConfiguration('codeblooded');
    await config.update('horror.safeMode', false, vscode.ConfigurationTarget.Global);
    
    // Update status bar
    this.updateStatusBar();
    
    console.log('[SafetyManager] Exited safe mode');
    this.onSafeModeChangedEmitter.fire(false);
    
    // Show confirmation
    vscode.window.showInformationMessage(
      '🔴 Safe Mode Disabled - Horror effects are now active'
    );
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
    
    // Disable if focus mode is active
    if (this.isFocusModeActive) {
      return true;
    }
    
    // Disable if debugging is active
    if (this.isDebuggingActive) {
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
   * Track a flash event and check if it should be allowed
   * Returns true if the flash is allowed, false if it exceeds the frequency limit
   */
  trackFlashEvent(type: string = 'generic'): boolean {
    const now = Date.now();
    
    // Remove flash events older than the tracking window
    this.flashEvents = this.flashEvents.filter(
      event => now - event.timestamp < this.flashTrackingWindow
    );
    
    // Check if we've exceeded the maximum flashes per second
    if (this.flashEvents.length >= this.maxFlashesPerSecond) {
      console.warn(
        `[SafetyManager] Flash frequency limit exceeded (${this.flashEvents.length}/${this.maxFlashesPerSecond} per second). Skipping flash event: ${type}`
      );
      return false;
    }
    
    // Add the new flash event
    this.flashEvents.push({ timestamp: now, type });
    
    console.log(
      `[SafetyManager] Flash event tracked: ${type} (${this.flashEvents.length}/${this.maxFlashesPerSecond} in last second)`
    );
    
    return true;
  }
  
  /**
   * Get current flash frequency (flashes per second)
   */
  getCurrentFlashFrequency(): number {
    const now = Date.now();
    
    // Count flashes in the last second
    const recentFlashes = this.flashEvents.filter(
      event => now - event.timestamp < this.flashTrackingWindow
    );
    
    return recentFlashes.length;
  }
  
  /**
   * Set maximum flashes per second
   */
  setMaxFlashFrequency(maxFlashes: number): void {
    this.maxFlashesPerSecond = Math.max(1, Math.min(10, maxFlashes));
    console.log('[SafetyManager] Max flash frequency set to:', this.maxFlashesPerSecond);
  }
  
  /**
   * Get maximum flashes per second
   */
  getMaxFlashFrequency(): number {
    return this.maxFlashesPerSecond;
  }
  
  /**
   * Reset flash tracking (useful for testing or after long pauses)
   */
  resetFlashTracking(): void {
    this.flashEvents = [];
    console.log('[SafetyManager] Flash tracking reset');
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Clear focus mode check interval
    if (this.focusModeCheckInterval) {
      clearInterval(this.focusModeCheckInterval);
      this.focusModeCheckInterval = undefined;
    }
    
    this.onSafeModeChangedEmitter.dispose();
    this.onAccessibilityChangedEmitter.dispose();
    this.onDebuggingChangedEmitter.dispose();
    console.log('[SafetyManager] Disposed');
  }
}
