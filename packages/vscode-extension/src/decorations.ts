/**
 * Decoration Manager
 * 
 * Manages color-coded highlighting for different complexity levels
 */

import * as vscode from 'vscode';
import { ComplexityLevel, THEME_COLORS } from '@codeblooded/core';

export class DecorationManager {
  private decorationTypes: Map<ComplexityLevel, vscode.TextEditorDecorationType>;

  constructor() {
    this.decorationTypes = new Map();
    this.initializeDecorationTypes();
  }

  /**
   * Initialize decoration types for each complexity level
   * Developer-friendly colors: Blue → Purple → Yellow → Orange
   */
  private initializeDecorationTypes() {
    // Low complexity (1-5) - Dodger Blue - calm and safe
    this.decorationTypes.set(ComplexityLevel.Low, vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(30, 144, 255, 0.12)',
      isWholeLine: true,
      overviewRulerColor: THEME_COLORS.LOW,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      // Use before content to create a left border effect
      before: {
        contentText: '',
        width: '4px',
        backgroundColor: 'rgba(30, 144, 255, 0.9)',
        margin: '0 8px 0 0'
      }
    }));

    // Medium complexity (6-10) - Medium Purple - attention needed
    this.decorationTypes.set(ComplexityLevel.Medium, vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(147, 112, 219, 0.18)',
      isWholeLine: true,
      overviewRulerColor: THEME_COLORS.MEDIUM,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      before: {
        contentText: '',
        width: '4px',
        backgroundColor: 'rgba(147, 112, 219, 1)',
        margin: '0 8px 0 0'
      }
    }));

    // High complexity (11-15) - Goldenrod - softer warning
    this.decorationTypes.set(ComplexityLevel.High, vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(218, 165, 32, 0.18)',
      isWholeLine: true,
      overviewRulerColor: THEME_COLORS.HIGH,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      before: {
        contentText: '',
        width: '5px',
        backgroundColor: 'rgba(218, 165, 32, 1)',
        margin: '0 8px 0 0'
      }
    }));

    // Critical complexity (16+) - Dark Orange - urgent action needed
    this.decorationTypes.set(ComplexityLevel.Critical, vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 140, 0, 0.25)',
      isWholeLine: true,
      overviewRulerColor: THEME_COLORS.CRITICAL,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      before: {
        contentText: '',
        width: '6px',
        backgroundColor: 'rgba(255, 140, 0, 1)',
        margin: '0 8px 0 0'
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
      console.log('[codeblooded Decorations] No functions to decorate');
      return;
    }

    console.log(`[codeblooded Decorations] Applying decorations for ${analysisResult.functions.length} functions`);

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

      console.log(`[codeblooded Decorations] ${func.name}: complexity=${complexity}, level=${level}, lines ${func.startLine}-${func.endLine}`);

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
      if (decorationType && decorations.length > 0) {
        console.log(`[codeblooded Decorations] Applying ${decorations.length} ${level} decorations`);
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
    message.appendMarkdown(`### 🎭 codeblooded Analysis\n\n`);
    message.appendMarkdown(`**Function:** \`${func.name}\`\n\n`);
    message.appendMarkdown(`**Complexity:** ${complexity} (${level})\n\n`);
    message.appendMarkdown(`**Lines of Code:** ${func.linesOfCode}\n\n`);
    message.appendMarkdown(`**Parameters:** ${func.parameters}\n\n`);
    message.appendMarkdown(`**Nesting Depth:** ${func.nestingDepth}\n\n`);

    // Add complexity level description with actionable suggestions
    message.appendMarkdown(`---\n\n`);
    
    switch (level) {
      case ComplexityLevel.Low:
        message.appendMarkdown(`✅ **Low complexity** - Easy to maintain\n\n`);
        message.appendMarkdown(`This function is simple and clear... *for now* 👁️`);
        break;
        
      case ComplexityLevel.Medium:
        message.appendMarkdown(`⚠️ **Medium complexity** - Consider refactoring\n\n`);
        message.appendMarkdown(`**Suggestions:**\n`);
        if (func.nestingDepth > 3) {
          message.appendMarkdown(`- Reduce nesting depth (currently ${func.nestingDepth}) by extracting nested logic into separate functions\n`);
        }
        if (func.linesOfCode > 30) {
          message.appendMarkdown(`- Break this ${func.linesOfCode}-line function into smaller, focused functions\n`);
        }
        if (func.parameters > 3) {
          message.appendMarkdown(`- Consider reducing parameters (${func.parameters}) by using an options object\n`);
        }
        if (complexity >= 8) {
          message.appendMarkdown(`- Simplify conditional logic - try early returns or guard clauses\n`);
        }
        break;
        
      case ComplexityLevel.High:
        message.appendMarkdown(`🔶 **High complexity** - Refactoring recommended\n\n`);
        message.appendMarkdown(`**Action Items:**\n`);
        message.appendMarkdown(`1. **Extract methods** - Break into ${Math.ceil(complexity / 5)} smaller functions\n`);
        if (func.nestingDepth > 4) {
          message.appendMarkdown(`2. **Flatten nesting** - Current depth of ${func.nestingDepth} is too deep\n`);
        }
        message.appendMarkdown(`3. **Use early returns** - Reduce branching complexity\n`);
        message.appendMarkdown(`4. **Apply strategy pattern** - Replace complex conditionals\n`);
        if (func.linesOfCode > 50) {
          message.appendMarkdown(`5. **Split function** - ${func.linesOfCode} lines is too long\n`);
        }
        message.appendMarkdown(`\n*This function will be difficult to test and maintain.*`);
        break;
        
      case ComplexityLevel.Critical:
        message.appendMarkdown(`☠️ **CRITICAL complexity** - Refactoring REQUIRED\n\n`);
        message.appendMarkdown(`**🚨 Immediate Actions Needed:**\n`);
        message.appendMarkdown(`1. **STOP adding features** - This code is at breaking point\n`);
        message.appendMarkdown(`2. **Extract ${Math.ceil(complexity / 4)} functions minimum**\n`);
        message.appendMarkdown(`3. **Reduce nesting from ${func.nestingDepth} to max 3 levels**\n`);
        message.appendMarkdown(`4. **Apply design patterns:**\n`);
        message.appendMarkdown(`   - Strategy pattern for conditionals\n`);
        message.appendMarkdown(`   - Guard clauses for early exits\n`);
        message.appendMarkdown(`   - Helper functions for repeated logic\n`);
        if (func.linesOfCode > 100) {
          message.appendMarkdown(`5. **Break ${func.linesOfCode} lines into multiple classes/modules**\n`);
        }
        message.appendMarkdown(`\n**⚠️ Warning:** This function is virtually untestable and unmaintainable.\n`);
        message.appendMarkdown(`**Recommended:** Schedule dedicated refactoring time NOW.`);
        break;
    }

    message.isTrusted = true;
    message.supportHtml = true;
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
