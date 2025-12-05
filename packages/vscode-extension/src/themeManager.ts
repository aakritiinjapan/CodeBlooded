import * as vscode from 'vscode';
import { VisualMapping } from '@codeblooded/core';

/**
 * Manages dynamic workbench tinting based on codeblooded complexity levels.
 */
export class ThemeManager implements vscode.Disposable {
  private readonly workbenchConfig = vscode.workspace.getConfiguration('workbench');
  private readonly originalColors = ThemeManager.cloneColorCustomizations(
    this.workbenchConfig.get<Record<string, string>>('colorCustomizations')
  );

  private enabled = false;
  private lastMapping: VisualMapping | undefined;

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) {
      return;
    }

    this.enabled = enabled;

    if (this.enabled) {
      if (this.lastMapping) {
        this.applyMapping(this.lastMapping);
      }
    } else {
      this.restoreOriginalColors();
    }
  }

  updateTheme(mapping: VisualMapping): void {
    this.lastMapping = mapping;
    console.log('codeblooded: Theme update requested', { 
      enabled: this.enabled, 
      color: mapping.color,
      backgroundColor: mapping.backgroundColor 
    });
    
    if (!this.enabled) {
      console.log('codeblooded: Theme manager disabled, skipping apply');
      return;
    }

    console.log('codeblooded: Calling applyMapping now');
    this.applyMapping(mapping);
  }

  dispose(): void {
    if (this.enabled) {
      this.restoreOriginalColors();
    }
  }

  private applyMapping(mapping: VisualMapping): void {
    const overlay = this.buildColorOverlay(mapping);
    
    console.log('codeblooded: Applying color overlay:', {
      accent: mapping.color,
      statusBarBackground: overlay['statusBar.background']
    });

    // Get fresh config reference
    const freshConfig = vscode.workspace.getConfiguration('workbench');
    
    // Get current color customizations at each level
    const inspection = freshConfig.inspect<Record<string, string>>('colorCustomizations');
    
    // We need to update both workspace AND global to ensure our colors take effect
    // Get the current workspace value and merge
    const workspaceColors = inspection?.workspaceValue || {};
    const globalColors = inspection?.globalValue || {};
    
    console.log('codeblooded: Current workspace colors:', Object.keys(workspaceColors));
    console.log('codeblooded: Current global colors:', Object.keys(globalColors));
    
    // Merge our overlay with existing workspace colors
    const mergedWorkspace = {
      ...workspaceColors,
      ...overlay
    };
    
    // Merge our overlay with existing global colors
    const mergedGlobal = {
      ...globalColors,
      ...overlay
    };
    
    console.log('codeblooded: Applying to both Workspace and Global...');
    
    // Update workspace settings
    freshConfig.update('colorCustomizations', mergedWorkspace, vscode.ConfigurationTarget.Workspace).then(
      () => {
        console.log('codeblooded: Workspace colors updated');
      },
      (err: any) => {
        console.log('codeblooded: Workspace update error:', err?.message);
      }
    );
    
    // Also update global settings to ensure it takes effect
    freshConfig.update('colorCustomizations', mergedGlobal, vscode.ConfigurationTarget.Global).then(
      () => {
        console.log('codeblooded: Global colors updated');
        // Verify after a short delay
        setTimeout(() => {
          const verify = vscode.workspace.getConfiguration('workbench');
          const colors = verify.get<Record<string, string>>('colorCustomizations');
          console.log('codeblooded: VERIFIED statusBar.background =', colors?.['statusBar.background']);
        }, 200);
      },
      (err: any) => {
        console.log('codeblooded: Global update error:', err?.message);
      }
    );
  }

  private restoreOriginalColors(): void {
    console.log('codeblooded: Restoring original colors (clearing our customizations)');
    this.clearColorCustomizations();
  }

  /**
   * Clear all color customizations set by this extension.
   * Call this on activation to ensure a clean slate.
   */
  public clearColorCustomizations(): void {
    const freshConfig = vscode.workspace.getConfiguration('workbench');
    
    // Get current colors and remove only the ones we set
    const keysToRemove = [
      'statusBar.background',
      'statusBar.foreground', 
      'statusBar.debuggingBackground',
      'statusBar.noFolderBackground',
      'activityBar.background',
      'activityBar.foreground',
      'titleBar.activeBackground',
      'titleBar.inactiveBackground',
    ];
    
    // Clear from workspace settings
    const inspection = freshConfig.inspect<Record<string, string>>('colorCustomizations');
    const workspaceColors = { ...(inspection?.workspaceValue || {}) };
    const globalColors = { ...(inspection?.globalValue || {}) };
    
    // Remove our keys
    for (const key of keysToRemove) {
      delete workspaceColors[key];
      delete globalColors[key];
    }
    
    console.log('codeblooded: Clearing color customizations from workspace and global');
    
    // Update with cleaned colors (empty object if no other customizations)
    const cleanedWorkspace = Object.keys(workspaceColors).length > 0 ? workspaceColors : undefined;
    const cleanedGlobal = Object.keys(globalColors).length > 0 ? globalColors : undefined;
    
    void freshConfig.update('colorCustomizations', cleanedWorkspace, vscode.ConfigurationTarget.Workspace);
    void freshConfig.update('colorCustomizations', cleanedGlobal, vscode.ConfigurationTarget.Global);
  }

  private buildColorOverlay(mapping: VisualMapping): Record<string, string> {
    const accent = mapping.color ?? '#DC143C';
    const accentDarker = this.darken(accent, 0.15);

    console.log('codeblooded: Building overlay with accent:', accent);

    // ONLY change the outer edges - status bar, title bar, activity bar
    // Leave editor, terminal, sidebar, panel, etc. as default VS Code colors
    return {
      'statusBar.background': accent,
      'statusBar.foreground': '#FFFFFF',
      'statusBar.debuggingBackground': accentDarker,
      'statusBar.noFolderBackground': accent,
      'activityBar.background': accentDarker,
      'activityBar.foreground': '#FFFFFF',
      'titleBar.activeBackground': accent,
      'titleBar.inactiveBackground': accentDarker,
    };
  }

  private withAlpha(color: string, alpha: number): string {
    const { r, g, b } = this.hexToRgb(color);
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  }

  private darken(color: string, amount: number): string {
    const { r, g, b } = this.hexToRgb(color);
    const factor = Math.max(0, Math.min(1, 1 - amount));
    const dr = Math.round(r * factor);
    const dg = Math.round(g * factor);
    const db = Math.round(b * factor);
    return this.rgbToHex(dr, dg, db);
  }

  private hexToRgb(color: string): { r: number; g: number; b: number } {
    const hex = color.replace('#', '');

    if (hex.length !== 6) {
      return { r: 28, g: 28, b: 28 };
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (value: number) => this.clamp(value).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(255, value));
  }

  private static cloneColorCustomizations(value: Record<string, string> | undefined): Record<string, string> | undefined {
    if (!value) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value));
  }
}
