/**
 * Configuration Manager - Handles user configuration and settings UI
 * 
 * Provides commands for:
 * - Showing horror controls overview
 * - Resetting settings to defaults
 * - Quick configuration access
 */

import * as vscode from 'vscode';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  'horror.enabled': false,
  'horror.intensity': 50,
  'horror.safeMode': true,
  'horror.enableJumpscares': true,
  'horror.enableScreenEffects': true,
  'horror.enablePhantomEvents': true,
  'horror.enableEntityPresence': true,
  'horror.enableEasterEggs': true,
  'safety.screenSharingMode': false,
  'safety.respectReduceMotion': true,
  'safety.maxFlashFrequency': 3,
  'safety.panicButtonKey': 'ctrl+alt+s',
  'advanced.jumpscareCooldownMin': 30,
  'advanced.jumpscareCooldownMax': 120,
  'advanced.escalationRate': 5
};

/**
 * Configuration Manager class
 */
export class ConfigurationManager {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Register configuration commands
   */
  registerCommands(): void {
    this.context.subscriptions.push(
      vscode.commands.registerCommand('codeblooded.showHorrorControls', () => 
        this.showHorrorControls()
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand('codeblooded.resetHorrorSettings', () => 
        this.resetHorrorSettings()
      )
    );

    console.log('[ConfigurationManager] Commands registered');
  }

  /**
   * Show horror controls overview
   */
  async showHorrorControls(): Promise<void> {
    const config = vscode.workspace.getConfiguration('codeblooded');
    
    const horrorEnabled = config.get<boolean>('horror.enabled', false);
    const safeMode = config.get<boolean>('horror.safeMode', true);
    const intensity = config.get<number>('horror.intensity', 50);
    const panicKey = config.get<string>('safety.panicButtonKey', 'ctrl+alt+s');

    const statusIcon = horrorEnabled && !safeMode ? '🔴' : '🟢';
    const statusText = horrorEnabled && !safeMode ? 'ACTIVE' : 'DISABLED';

    const message = `
# codeblooded Horror Controls ${statusIcon}

**Status**: ${statusText}
**Intensity**: ${intensity}%
**Safe Mode**: ${safeMode ? 'ON 🛡️' : 'OFF'}

## Quick Actions

**Panic Button**: Press \`${panicKey.toUpperCase()}\` to instantly disable all effects

## Current Settings

- Jumpscares: ${config.get('horror.enableJumpscares') ? '✓' : '✗'}
- Screen Effects: ${config.get('horror.enableScreenEffects') ? '✓' : '✗'}
- Phantom Events: ${config.get('horror.enablePhantomEvents') ? '✓' : '✗'}
- Entity Presence: ${config.get('horror.enableEntityPresence') ? '✓' : '✗'}
- Easter Eggs: ${config.get('horror.enableEasterEggs') ? '✓' : '✗'}

## Safety Features

- Reduce Motion: ${config.get('safety.respectReduceMotion') ? 'Enabled' : 'Disabled'}
- Max Flash Frequency: ${config.get('safety.maxFlashFrequency')} per second
- Screen Sharing Mode: ${config.get('safety.screenSharingMode') ? 'ON' : 'OFF'}

---

Use the buttons below to quickly adjust settings.
    `.trim();

    const action = await vscode.window.showInformationMessage(
      message,
      { modal: true },
      'Open Settings',
      'Toggle Safe Mode',
      'Reset to Defaults',
      'Close'
    );

    switch (action) {
      case 'Open Settings':
        await vscode.commands.executeCommand('workbench.action.openSettings', 'codeblooded.horror');
        break;
      case 'Toggle Safe Mode':
        await this.toggleSafeMode();
        break;
      case 'Reset to Defaults':
        await this.resetHorrorSettings();
        break;
    }
  }

  /**
   * Toggle safe mode
   */
  private async toggleSafeMode(): Promise<void> {
    const config = vscode.workspace.getConfiguration('codeblooded');
    const currentSafeMode = config.get<boolean>('horror.safeMode', true);
    
    await config.update('horror.safeMode', !currentSafeMode, vscode.ConfigurationTarget.Global);
    
    const newState = !currentSafeMode ? 'ENABLED' : 'DISABLED';
    vscode.window.showInformationMessage(
      `codeblooded Safe Mode ${newState} ${!currentSafeMode ? '🛡️' : '🔴'}`
    );
  }

  /**
   * Reset horror settings to defaults
   */
  async resetHorrorSettings(): Promise<void> {
    const result = await vscode.window.showWarningMessage(
      'Reset all codeblooded horror settings to defaults?\n\nThis will also clear all saved state (tutorial, warnings, etc.)',
      { modal: true },
      'Reset All Settings',
      'Cancel'
    );

    if (result !== 'Reset All Settings') {
      return;
    }

    const config = vscode.workspace.getConfiguration('codeblooded');
    
    // Reset all horror-related settings in VS Code configuration
    for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
      try {
        await config.update(key, value, vscode.ConfigurationTarget.Global);
      } catch (error) {
        console.error(`[ConfigurationManager] Failed to reset ${key}:`, error);
      }
    }

    // Clear all global state keys
    const globalStateKeys = [
      'codeblooded.hasSeenHorrorWarning',
      'codeblooded.verboseLogging',
      'codeblooded.audioEnabled',
      'codeblooded.animationsEnabled',
      'codeblooded.workspaceTint',
      'codeblooded.threshold',
      'codeblooded.tutorialCompleted',
      'easterEggState'
    ];
    
    for (const key of globalStateKeys) {
      try {
        await this.context.globalState.update(key, undefined);
        console.log(`[ConfigurationManager] Cleared global state: ${key}`);
      } catch (error) {
        console.error(`[ConfigurationManager] Failed to clear global state ${key}:`, error);
      }
    }

    vscode.window.showInformationMessage(
      '✓ codeblooded settings and state reset to defaults. Safe Mode is now enabled.'
    );

    console.log('[ConfigurationManager] Settings and global state reset to defaults');
  }

  /**
   * Validate configuration values
   */
  validateConfiguration(): void {
    const config = vscode.workspace.getConfiguration('codeblooded');
    
    // Validate intensity
    const intensity = config.get<number>('horror.intensity', 50);
    if (intensity < 0 || intensity > 100) {
      config.update('horror.intensity', 50, vscode.ConfigurationTarget.Global);
      vscode.window.showWarningMessage(
        'codeblooded: Invalid intensity value. Reset to 50.'
      );
    }

    // Validate cooldowns
    const minCooldown = config.get<number>('advanced.jumpscareCooldownMin', 30);
    const maxCooldown = config.get<number>('advanced.jumpscareCooldownMax', 120);
    
    if (minCooldown > maxCooldown) {
      config.update('advanced.jumpscareCooldownMax', minCooldown + 30, vscode.ConfigurationTarget.Global);
      vscode.window.showWarningMessage(
        'codeblooded: Max cooldown must be greater than min cooldown. Adjusted automatically.'
      );
    }

    // Validate flash frequency
    const flashFreq = config.get<number>('safety.maxFlashFrequency', 3);
    if (flashFreq < 1 || flashFreq > 10) {
      config.update('safety.maxFlashFrequency', 3, vscode.ConfigurationTarget.Global);
      vscode.window.showWarningMessage(
        'codeblooded: Invalid flash frequency. Reset to 3 (safe default).'
      );
    }

    // Validate escalation rate
    const escalationRate = config.get<number>('advanced.escalationRate', 5);
    if (escalationRate < 0 || escalationRate > 20) {
      config.update('advanced.escalationRate', 5, vscode.ConfigurationTarget.Global);
      vscode.window.showWarningMessage(
        'codeblooded: Invalid escalation rate. Reset to 5.'
      );
    }
  }

  /**
   * Get current configuration summary
   */
  getConfigurationSummary(): string {
    const config = vscode.workspace.getConfiguration('codeblooded');
    
    return `
Horror Enabled: ${config.get('horror.enabled')}
Safe Mode: ${config.get('horror.safeMode')}
Intensity: ${config.get('horror.intensity')}%
Jumpscares: ${config.get('horror.enableJumpscares')}
Screen Effects: ${config.get('horror.enableScreenEffects')}
Phantom Events: ${config.get('horror.enablePhantomEvents')}
Entity Presence: ${config.get('horror.enableEntityPresence')}
Easter Eggs: ${config.get('horror.enableEasterEggs')}
    `.trim();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    console.log('[ConfigurationManager] Disposed');
  }
}
