import * as vscode from 'vscode';
import { VisualMapping } from '@codechroma/core';

/**
 * Manages dynamic workbench tinting based on CodeChroma complexity levels.
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
    console.log('CodeChroma: Theme update', { enabled: this.enabled, mapping });
    
    if (!this.enabled) {
      return;
    }

    this.applyMapping(mapping);
  }

  dispose(): void {
    if (this.enabled) {
      this.restoreOriginalColors();
    }
  }

  private applyMapping(mapping: VisualMapping): void {
    const overlay = this.buildColorOverlay(mapping);
    const merged = {
      ...(ThemeManager.cloneColorCustomizations(this.originalColors) ?? {}),
      ...overlay,
    };

    void this.workbenchConfig.update('colorCustomizations', merged, vscode.ConfigurationTarget.Global);
  }

  private restoreOriginalColors(): void {
    void this.workbenchConfig.update('colorCustomizations', this.originalColors ?? {}, vscode.ConfigurationTarget.Global);
  }

  private buildColorOverlay(mapping: VisualMapping): Record<string, string> {
    const accent = mapping.color ?? '#DC143C';
    const background = mapping.backgroundColor ?? '#1C1C1C';
    const shadow = this.darken(background, 0.1);
    const deeperShadow = this.darken(background, 0.2);
    const accentDarker = this.darken(accent, 0.15);

    return {
      'editor.background': background,
      // Don't color the current line - only mark specific code with decorations
      'editor.lineHighlightBackground': '#00000000', // Fully transparent
      'editor.lineHighlightBorder': '#00000000', // No border
      'editor.selectionBackground': this.withAlpha(accent, 0.25),
      'editorCursor.foreground': '#FFFFFF',
      'editorIndentGuide.background': this.withAlpha('#FFFFFF', 0.05),
      'editorGutter.background': background,
      'statusBar.background': accent,
      'statusBar.foreground': '#FFFFFF',
      'statusBar.debuggingBackground': accentDarker,
      'statusBar.noFolderBackground': accent,
      'activityBar.background': accentDarker,
      'activityBar.foreground': '#FFFFFF',
      'titleBar.activeBackground': accent,
      'titleBar.inactiveBackground': accentDarker,
      'sideBar.background': shadow,
      'sideBarSectionHeader.background': deeperShadow,
      'panel.background': shadow,
      'tab.activeBackground': background,
      'tab.inactiveBackground': deeperShadow,
      'tab.activeForeground': '#FFFFFF',
      'tab.inactiveForeground': this.withAlpha('#FFFFFF', 0.65),
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
