import * as vscode from 'vscode';

/**
 * FirstRunTutorialManager handles the initial onboarding experience for new users
 * Shows warnings, demonstrates panic button, and explains horror features
 */
export class FirstRunTutorialManager {
  private context: vscode.ExtensionContext;
  private readonly TUTORIAL_COMPLETED_KEY = 'codeblooded.tutorialCompleted';
  private readonly TUTORIAL_VERSION = '1.0.0';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Check if tutorial should be shown (first run or version update)
   */
  public shouldShowTutorial(): boolean {
    const completedVersion = this.context.globalState.get<string>(this.TUTORIAL_COMPLETED_KEY);
    return completedVersion !== this.TUTORIAL_VERSION;
  }

  /**
   * Show the complete first-run tutorial
   */
  public async showTutorial(): Promise<void> {
    console.log('[codeblooded Tutorial] Starting first-run tutorial');

    // Step 1: Welcome message
    const proceed = await this.showWelcomeMessage();
    if (!proceed) {
      console.log('[codeblooded Tutorial] User skipped tutorial');
      await this.markTutorialComplete();
      return;
    }

    // Step 2: Safety warnings
    const acceptedWarnings = await this.showSafetyWarnings();
    if (!acceptedWarnings) {
      console.log('[codeblooded Tutorial] User declined warnings, staying in safe mode');
      await this.markTutorialComplete();
      return;
    }

    // Step 3: Demonstrate panic button
    await this.demonstratePanicButton();

    // Step 4: Explain intensity settings
    await this.explainIntensitySettings();

    // Step 5: Show how to enable/disable effects
    await this.showEffectControls();

    // Step 6: Quick start guide
    await this.showQuickStartGuide();

    // Mark tutorial as complete
    await this.markTutorialComplete();

    console.log('[codeblooded Tutorial] Tutorial completed');
  }

  /**
   * Step 1: Welcome message
   */
  private async showWelcomeMessage(): Promise<boolean> {
    const message = `
🎃 Welcome to codeblooded!

codeblooded transforms code complexity into an immersive sensory experience with:
• Real-time audio-visual feedback
• Horror-themed aesthetics
• Optional psychological horror features

Would you like a quick tutorial to get started?
    `.trim();

    const choice = await vscode.window.showInformationMessage(
      message,
      { modal: true },
      'Yes, Show Tutorial',
      'Skip Tutorial'
    );

    return choice === 'Yes, Show Tutorial';
  }

  /**
   * Step 2: Safety warnings
   */
  private async showSafetyWarnings(): Promise<boolean> {
    const message = `
⚠️ IMPORTANT SAFETY WARNINGS

codeblooded includes OPTIONAL psychological horror features that contain:

🚨 Photosensitivity Warning:
• Flashing lights and rapid visual changes
• May trigger seizures in photosensitive individuals

🎃 Psychological Horror Content:
• Jump scares with disturbing imagery
• Screen distortion effects
• Phantom typing events
• Unsettling audio and visuals

❌ NOT Recommended For:
• Photosensitive epilepsy or seizure disorders
• Anxiety disorders, PTSD, or panic disorders
• Heart conditions sensitive to sudden stress
• Anyone preferring calm coding environments
• Users under 13 years of age

🛡️ Safety Features:
• Horror features are DISABLED by default
• Panic Button (Ctrl+Alt+S) for instant disable
• Respects accessibility settings
• Your code is never permanently modified

Do you understand these warnings and wish to continue?
    `.trim();

    const choice = await vscode.window.showWarningMessage(
      message,
      { modal: true },
      'I Understand and Accept',
      'Keep Horror Disabled'
    );

    return choice === 'I Understand and Accept';
  }

  /**
   * Step 3: Demonstrate panic button
   */
  private async demonstratePanicButton(): Promise<void> {
    const message = `
🚨 PANIC BUTTON - Your Safety Net

At ANY time, press:
  Ctrl+Alt+S (Windows/Linux)
  Cmd+Shift+Escape (Mac)

This will INSTANTLY disable ALL horror effects.

You can also:
• Run command: "codeblooded: Panic Button"
• Toggle Safe Mode in settings
• Use "codeblooded: Toggle Safe Mode" command

💡 Tip: Memorize this shortcut before enabling horror features!

Press OK to continue...
    `.trim();

    await vscode.window.showInformationMessage(
      message,
      { modal: true },
      'OK, I Know the Panic Button'
    );
  }

  /**
   * Step 4: Explain intensity settings
   */
  private async explainIntensitySettings(): Promise<void> {
    const message = `
🎚️ HORROR INTENSITY SYSTEM

Control your experience with the intensity value (0-100):

• 0-30: Minimal Horror
  Rare events, subtle effects
  
• 31-60: Moderate Horror (Recommended)
  Occasional events, balanced experience
  
• 61-100: Maximum Horror
  Frequent events, intense effects

⚠️ Warning: Intensity above 70 includes rapid animations and frequent jumpscares.

💡 Tip: Start with 30-40 for your first session!

You can adjust intensity in:
  Settings > codeblooded > Horror > Intensity

Press OK to continue...
    `.trim();

    await vscode.window.showInformationMessage(
      message,
      { modal: true },
      'OK, Got It'
    );
  }

  /**
   * Step 5: Show how to enable/disable effects
   */
  private async showEffectControls(): Promise<void> {
    const message = `
🎮 CONTROLLING HORROR EFFECTS

Enable/Disable Individual Effects:

Settings > codeblooded > Horror:
  ✓ Enable Jumpscares
  ✓ Enable Screen Effects
  ✓ Enable Phantom Events
  ✓ Enable Entity Presence
  ✓ Enable Easter Eggs

Quick Commands:
• "codeblooded: Toggle Safe Mode" - Disable all
• "codeblooded: Show Horror Controls" - View all settings
• "codeblooded: Reset Horror Settings" - Restore defaults

💡 Tip: You can disable just jumpscares but keep other effects!

Press OK to continue...
    `.trim();

    await vscode.window.showInformationMessage(
      message,
      { modal: true },
      'OK, Understood'
    );
  }

  /**
   * Step 6: Quick start guide
   */
  private async showQuickStartGuide(): Promise<void> {
    const message = `
🚀 QUICK START GUIDE

To Enable Horror Features:
1. Open Settings (Ctrl+,)
2. Search for "codeblooded.horror.enabled"
3. Set to true
4. Adjust intensity (start with 30-40)
5. Start coding!

Essential Commands:
• Ctrl+Alt+S - Panic Button
• "codeblooded: Show Horror Controls" - View settings
• "codeblooded: Test Horror Popup" - Preview effects

📚 Documentation:
• Full User Guide: HORROR_FEATURES_GUIDE.md
• README: Safety warnings and features
• GitHub: Report issues or ask questions

🎃 Ready to Experience codeblooded?

Horror features are currently DISABLED (Safe Mode).
Enable them in settings when you're ready!
    `.trim();

    const choice = await vscode.window.showInformationMessage(
      message,
      { modal: true },
      'Open Settings',
      'Start Coding',
      'View User Guide'
    );

    if (choice === 'Open Settings') {
      vscode.commands.executeCommand('workbench.action.openSettings', 'codeblooded.horror');
    } else if (choice === 'View User Guide') {
      // Open the user guide file
      const guideUri = vscode.Uri.file(
        this.context.asAbsolutePath('../../HORROR_FEATURES_GUIDE.md')
      );
      vscode.commands.executeCommand('markdown.showPreview', guideUri);
    }
  }

  /**
   * Mark tutorial as complete
   */
  private async markTutorialComplete(): Promise<void> {
    await this.context.globalState.update(this.TUTORIAL_COMPLETED_KEY, this.TUTORIAL_VERSION);
  }

  /**
   * Reset tutorial (for testing or re-showing)
   */
  public async resetTutorial(): Promise<void> {
    await this.context.globalState.update(this.TUTORIAL_COMPLETED_KEY, undefined);
    vscode.window.showInformationMessage('codeblooded: Tutorial reset. Restart VS Code to see it again.');
  }

  /**
   * Show a condensed version for users who skipped the full tutorial
   */
  public async showQuickTips(): Promise<void> {
    const message = `
🎃 codeblooded Quick Tips

🚨 Panic Button: Ctrl+Alt+S
   Instantly disables all horror effects

🎚️ Intensity: Start with 30-40
   Adjust in settings: codeblooded.horror.intensity

🛡️ Safe Mode: Horror disabled by default
   Enable in settings: codeblooded.horror.enabled

📚 Full Tutorial: Run command
   "codeblooded: Show First-Run Tutorial"

💡 View all commands: Ctrl+Shift+P > "codeblooded"
    `.trim();

    await vscode.window.showInformationMessage(
      message,
      { modal: false },
      'Open Settings',
      'View User Guide'
    );
  }
}
