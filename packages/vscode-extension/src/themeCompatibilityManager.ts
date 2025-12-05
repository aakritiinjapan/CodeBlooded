/**
 * Theme Compatibility Manager - Handles theme detection and horror effect adjustments
 * 
 * Detects current VS Code theme (light/dark/high contrast) and adjusts horror effects
 * for optimal visibility and impact across different themes.
 */

import * as vscode from 'vscode';

/**
 * Theme type classification
 */
export enum ThemeType {
  Dark = 'dark',
  Light = 'light',
  HighContrast = 'highContrast',
  HighContrastLight = 'highContrastLight'
}

/**
 * Theme information
 */
export interface ThemeInfo {
  type: ThemeType;
  kind: vscode.ColorThemeKind;
  name: string;
}

/**
 * Horror color adjustments for different theme types
 */
export interface HorrorColorAdjustments {
  bloodColor: string;
  shadowColor: string;
  glitchColor: string;
  eyeColor: string;
  phantomTextColor: string;
  whisperColor: string;
  contrastMultiplier: number;
}

/**
 * Theme Compatibility Manager
 */
export class ThemeCompatibilityManager implements vscode.Disposable {
  private context: vscode.ExtensionContext;
  private currentTheme: ThemeInfo;
  private originalTheme: ThemeInfo;
  private disposables: vscode.Disposable[] = [];
  
  // Event emitters
  private onThemeChangedEmitter = new vscode.EventEmitter<ThemeInfo>();
  public readonly onThemeChanged = this.onThemeChangedEmitter.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    
    // Detect initial theme
    this.currentTheme = this.detectTheme();
    this.originalTheme = { ...this.currentTheme };
    
    console.log('[ThemeCompatibilityManager] Initialized', {
      theme: this.currentTheme
    });
    
    // Listen for theme changes
    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(theme => {
        this.handleThemeChange(theme);
      })
    );
  }

  /**
   * Initialize the theme compatibility manager
   */
  async initialize(): Promise<void> {
    console.log('[ThemeCompatibilityManager] Starting initialization...');
    
    // Store original theme settings
    this.originalTheme = { ...this.currentTheme };
    
    console.log('[ThemeCompatibilityManager] Initialization complete');
  }

  /**
   * Detect current VS Code theme
   */
  private detectTheme(): ThemeInfo {
    const colorTheme = vscode.window.activeColorTheme;
    
    let type: ThemeType;
    switch (colorTheme.kind) {
      case vscode.ColorThemeKind.Light:
        type = ThemeType.Light;
        break;
      case vscode.ColorThemeKind.Dark:
        type = ThemeType.Dark;
        break;
      case vscode.ColorThemeKind.HighContrast:
        type = ThemeType.HighContrast;
        break;
      case vscode.ColorThemeKind.HighContrastLight:
        type = ThemeType.HighContrastLight;
        break;
      default:
        type = ThemeType.Dark;
    }
    
    return {
      type,
      kind: colorTheme.kind,
      name: 'Unknown' // VS Code doesn't expose theme name directly
    };
  }

  /**
   * Handle theme changes
   */
  private handleThemeChange(theme: vscode.ColorTheme): void {
    const previousTheme = this.currentTheme;
    this.currentTheme = this.detectTheme();
    
    console.log('[ThemeCompatibilityManager] Theme changed', {
      from: previousTheme,
      to: this.currentTheme
    });
    
    // Emit theme changed event
    this.onThemeChangedEmitter.fire(this.currentTheme);
  }

  /**
   * Get current theme information
   */
  getCurrentTheme(): Readonly<ThemeInfo> {
    return { ...this.currentTheme };
  }

  /**
   * Get original theme information (at initialization)
   */
  getOriginalTheme(): Readonly<ThemeInfo> {
    return { ...this.originalTheme };
  }

  /**
   * Check if current theme is light
   */
  isLightTheme(): boolean {
    return this.currentTheme.type === ThemeType.Light ||
           this.currentTheme.type === ThemeType.HighContrastLight;
  }

  /**
   * Check if current theme is dark
   */
  isDarkTheme(): boolean {
    return this.currentTheme.type === ThemeType.Dark ||
           this.currentTheme.type === ThemeType.HighContrast;
  }

  /**
   * Check if current theme is high contrast
   */
  isHighContrastTheme(): boolean {
    return this.currentTheme.type === ThemeType.HighContrast ||
           this.currentTheme.type === ThemeType.HighContrastLight;
  }

  /**
   * Get horror color adjustments for current theme
   */
  getHorrorColorAdjustments(): HorrorColorAdjustments {
    const isLight = this.isLightTheme();
    const isHighContrast = this.isHighContrastTheme();
    
    // Base colors for dark themes
    let adjustments: HorrorColorAdjustments = {
      bloodColor: '#8B0000',           // Dark red
      shadowColor: '#000000',          // Pure black
      glitchColor: '#FF0000',          // Bright red
      eyeColor: '#FFFFFF',             // White
      phantomTextColor: '#FF0000',     // Red
      whisperColor: '#DC143C',         // Crimson
      contrastMultiplier: 1.0
    };
    
    // Adjust for light themes
    if (isLight) {
      adjustments = {
        bloodColor: '#4B0000',         // Much darker red for visibility
        shadowColor: '#1A1A1A',        // Very dark gray (not pure black)
        glitchColor: '#8B0000',        // Darker red
        eyeColor: '#000000',           // Black eyes on light background
        phantomTextColor: '#8B0000',   // Dark red
        whisperColor: '#8B0000',       // Dark red
        contrastMultiplier: 1.3        // Increase contrast by 30%
      };
    }
    
    // Enhance contrast for high contrast themes
    if (isHighContrast) {
      adjustments.contrastMultiplier = isLight ? 1.8 : 1.5; // 50-80% increase
      
      // Make colors more extreme for high contrast
      if (isLight) {
        adjustments.bloodColor = '#2B0000';      // Even darker
        adjustments.shadowColor = '#000000';     // Pure black
        adjustments.glitchColor = '#4B0000';     // Very dark red
        adjustments.eyeColor = '#000000';        // Pure black
        adjustments.phantomTextColor = '#2B0000';
        adjustments.whisperColor = '#4B0000';
      } else {
        adjustments.bloodColor = '#FF0000';      // Brighter red
        adjustments.shadowColor = '#000000';     // Pure black
        adjustments.glitchColor = '#FF0000';     // Bright red
        adjustments.eyeColor = '#FFFFFF';        // Pure white
        adjustments.phantomTextColor = '#FF0000';
        adjustments.whisperColor = '#FF0000';
      }
    }
    
    return adjustments;
  }

  /**
   * Get adjusted opacity for current theme
   * Light themes need higher opacity for visibility
   */
  getAdjustedOpacity(baseOpacity: number): number {
    if (this.isLightTheme()) {
      // Increase opacity by 20% for light themes
      return Math.min(1.0, baseOpacity * 1.2);
    }
    
    if (this.isHighContrastTheme()) {
      // Increase opacity by 30% for high contrast
      return Math.min(1.0, baseOpacity * 1.3);
    }
    
    return baseOpacity;
  }

  /**
   * Get adjusted shadow intensity for current theme
   */
  getAdjustedShadowIntensity(baseIntensity: number): number {
    if (this.isLightTheme()) {
      // Increase shadow intensity for light themes
      return baseIntensity * 1.5;
    }
    
    if (this.isHighContrastTheme()) {
      // Increase shadow intensity for high contrast
      return baseIntensity * 1.8;
    }
    
    return baseIntensity;
  }

  /**
   * Get CSS filter for theme-adjusted horror effects
   */
  getThemeAdjustedFilter(): string {
    const adjustments = this.getHorrorColorAdjustments();
    
    if (this.isLightTheme()) {
      // Darken and increase contrast for light themes
      return `brightness(0.7) contrast(${adjustments.contrastMultiplier})`;
    }
    
    if (this.isHighContrastTheme()) {
      // Increase contrast significantly
      return `contrast(${adjustments.contrastMultiplier})`;
    }
    
    // No filter for normal dark themes
    return 'none';
  }

  /**
   * Get theme-specific CSS variables
   */
  getThemeCSSVariables(): Record<string, string> {
    const adjustments = this.getHorrorColorAdjustments();
    
    return {
      '--horror-blood-color': adjustments.bloodColor,
      '--horror-shadow-color': adjustments.shadowColor,
      '--horror-glitch-color': adjustments.glitchColor,
      '--horror-eye-color': adjustments.eyeColor,
      '--horror-phantom-text-color': adjustments.phantomTextColor,
      '--horror-whisper-color': adjustments.whisperColor,
      '--horror-contrast-multiplier': adjustments.contrastMultiplier.toString()
    };
  }

  /**
   * Apply theme-specific adjustments to HTML content
   */
  applyThemeAdjustments(html: string): string {
    const cssVars = this.getThemeCSSVariables();
    const filter = this.getThemeAdjustedFilter();
    
    // Inject CSS variables into the HTML
    const styleTag = `
      <style>
        :root {
          ${Object.entries(cssVars).map(([key, value]) => `${key}: ${value};`).join('\n          ')}
        }
        
        body {
          filter: ${filter};
        }
      </style>
    `;
    
    // Insert style tag before closing head tag
    if (html.includes('</head>')) {
      return html.replace('</head>', `${styleTag}</head>`);
    }
    
    // If no head tag, insert at the beginning
    return styleTag + html;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    console.log('[ThemeCompatibilityManager] Disposing...');
    
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    
    this.onThemeChangedEmitter.dispose();
    
    console.log('[ThemeCompatibilityManager] Disposed');
  }
}
