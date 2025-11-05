/**
 * Decoration Manager
 * 
 * Manages color-coded highlighting for different complexity levels
 */

import * as vscode from 'vscode';
import { ComplexityLevel, THEME_COLORS } from '@codechroma/core';

export class DecorationManager {
  private decorationTypes: Map<ComplexityLevel, vscode.TextEditorDecorationType>;

  constructor() {
    this.decorationTypes = new Map();
    this.initializeDecorationTypes();
  }

  /**
   * Initialize decoration types for each complexity level
   */
  private initializeDecorationTypes() {
    // Low complexity (1-5) - Midnight Blue
    this.decorationTypes.set(ComplexityLevel.Low, vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(25, 25, 112, 0.15)',
      border: '1px solid rgba(25, 25, 112, 0.5)',
      borderRadius: '2px',
      overviewRulerColor: THEME_COLORS.LOW,
      overviewRulerLane: vscode.OverviewRulerLane.Right
    }));

    // Medium complexity (6-10) - Toxic Purple
    this.decorationTypes.set(ComplexityLevel.Medium, vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(148, 0, 211, 0.15)',
      border: '1px solid rgba(148, 0, 211, 0.5)',
      borderRadius: '2px',
      overviewRulerColor: THEME_COLORS.MEDIUM,
      overviewRulerLane: vscode.OverviewRulerLane.Right
    }));

    // High complexity (11-15) - Blood Orange
    this.decorationTypes.set(ComplexityLevel.High, vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(204, 85, 0, 0.2)',
      border: '1px solid rgba(204, 85, 0, 0.6)',
      borderRadius: '2px',
      overviewRulerColor: THEME_COLORS.HIGH,
      overviewRulerLane: vscode.OverviewRulerLane.Right
    }));

    // Critical complexity (16+) - Crimson Red with skull emoji
    this.decorationTypes.set(ComplexityLevel.Critical, vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(220, 20, 60, 0.25)',
      border: '2px solid rgba(220, 20, 60, 0.7)',
      borderRadius: '2px',
      overviewRulerColor: THEME_COLORS.CRITICAL,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      after: {
        contentText: ' ☠️',
        color: THEME_COLORS.CRITICAL
      }
    }));
  }

  /**
   * Apply decorations to editor based on analysis results
   */
  applyDecorations(editor: vscode.TextEditor, analysisResult: any) {
    // Clear existing decorations
    this.clearDecorations(editor);

    if (!analysisResult || !analysisResult.functions) {
      return;
    }

    // Group functions by complexity level
    const decorationsByLevel = new Map<ComplexityLevel, vscode.DecorationOptions[]>();
    decorationsByLevel.set(ComplexityLevel.Low, []);
    decorationsByLevel.set(ComplexityLevel.Medium, []);
    decorationsByLevel.set(ComplexityLevel.High, []);
    decorationsByLevel.set(ComplexityLevel.Critical, []);

    // Process each function
    for (const func of analysisResult.functions) {
      const complexity = func.cyclomaticComplexity;
      const level = this.classifyComplexity(complexity);

      // Create range for function
      const startPos = new vscode.Position(func.startLine - 1, 0);
      const endPos = new vscode.Position(func.endLine - 1, Number.MAX_SAFE_INTEGER);
      const range = new vscode.Range(startPos, endPos);

      // Create decoration with hover message
      const decoration: vscode.DecorationOptions = {
        range,
        hoverMessage: this.createHoverMessage(func)
      };

      decorationsByLevel.get(level)?.push(decoration);
    }

    // Apply decorations for each level
    for (const [level, decorations] of decorationsByLevel) {
      const decorationType = this.decorationTypes.get(level);
      if (decorationType) {
        editor.setDecorations(decorationType, decorations);
      }
    }
  }

  /**
   * Clear all decorations from editor
   */
  clearDecorations(editor: vscode.TextEditor) {
    for (const decorationType of this.decorationTypes.values()) {
      editor.setDecorations(decorationType, []);
    }
  }

  /**
   * Classify complexity into levels
   */
  private classifyComplexity(complexity: number): ComplexityLevel {
    if (complexity <= 5) {
      return ComplexityLevel.Low;
    } else if (complexity <= 10) {
      return ComplexityLevel.Medium;
    } else if (complexity <= 15) {
      return ComplexityLevel.High;
    } else {
      return ComplexityLevel.Critical;
    }
  }

  /**
   * Create hover message for function
   */
  private createHoverMessage(func: any): vscode.MarkdownString {
    const complexity = func.cyclomaticComplexity;
    const level = this.classifyComplexity(complexity);
    
    const message = new vscode.MarkdownString();
    message.appendMarkdown(`### 🎭 CodeChroma Analysis\n\n`);
    message.appendMarkdown(`**Function:** \`${func.name}\`\n\n`);
    message.appendMarkdown(`**Complexity:** ${complexity} (${level})\n\n`);
    message.appendMarkdown(`**Lines of Code:** ${func.linesOfCode}\n\n`);
    message.appendMarkdown(`**Parameters:** ${func.parameters}\n\n`);
    message.appendMarkdown(`**Nesting Depth:** ${func.nestingDepth}\n\n`);

    // Add complexity level description
    switch (level) {
      case ComplexityLevel.Low:
        message.appendMarkdown(`✅ Low complexity - Easy to maintain`);
        break;
      case ComplexityLevel.Medium:
        message.appendMarkdown(`⚠️ Medium complexity - Consider refactoring`);
        break;
      case ComplexityLevel.High:
        message.appendMarkdown(`🔶 High complexity - Refactoring recommended`);
        break;
      case ComplexityLevel.Critical:
        message.appendMarkdown(`☠️ Critical complexity - Refactoring required`);
        break;
    }

    message.isTrusted = true;
    return message;
  }

  /**
   * Dispose all decoration types
   */
  dispose() {
    for (const decorationType of this.decorationTypes.values()) {
      decorationType.dispose();
    }
    this.decorationTypes.clear();
  }
}
