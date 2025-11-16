/**
 * Editor Effects Manager
 * 
 * Applies horror effects directly to the editor using decorations
 * (since webviews can't overlay the editor)
 */

import * as vscode from 'vscode';

export interface FunctionWithError {
  startLine: number;
  endLine: number;
  hasError: boolean;
}

export class EditorEffectsManager implements vscode.Disposable {
  private bloodDripDecoration: vscode.TextEditorDecorationType | undefined;
  private spiderWebDecoration: vscode.TextEditorDecorationType | undefined;
  private fogDecoration: vscode.TextEditorDecorationType | undefined;

  /**
   * Show horror effects in the editor
   */
  showEffects(editor: vscode.TextEditor, effects: {
    cobweb?: boolean;
    bloodDrip?: boolean;
    fog?: boolean;
    intensity?: number;
    functionsWithErrors?: FunctionWithError[];
  }): void {
    this.clearEffects(editor);

    const intensity = effects.intensity ?? 0.5;

    // Apply spider web effect (3 spiders floating in editor)
    // ONLY show if there's actual complexity or errors
    if (effects.cobweb && intensity > 0.3) {
      this.spiderWebDecoration = vscode.window.createTextEditorDecorationType({
        after: {
          contentText: ' 🕷️🕸️',
          color: 'rgba(200, 200, 200, 0.6)',
          margin: '0 0 0 20px',
        },
        isWholeLine: false,
      });

      // Add spiders ONLY on lines with medium+ complexity
      // Not on every line - just 3 strategic positions
      const spiderPositions: vscode.Range[] = [];
      const lineCount = editor.document.lineCount;
      
      // Only add spiders if we have medium or higher complexity
      // Top position (around line 5)
      const topLine = Math.min(5, lineCount - 1);
      if (topLine >= 0) {
        const lineLength = editor.document.lineAt(topLine).text.length;
        spiderPositions.push(new vscode.Range(topLine, lineLength, topLine, lineLength));
      }
      
      // Middle position
      const midLine = Math.floor(lineCount / 2);
      if (midLine > topLine && midLine < lineCount) {
        const lineLength = editor.document.lineAt(midLine).text.length;
        spiderPositions.push(new vscode.Range(midLine, lineLength, midLine, lineLength));
      }
      
      // Bottom position (around 80% down)
      const bottomLine = Math.min(lineCount - 1, Math.floor(lineCount * 0.8));
      if (bottomLine > midLine && bottomLine < lineCount) {
        const lineLength = editor.document.lineAt(bottomLine).text.length;
        spiderPositions.push(new vscode.Range(bottomLine, lineLength, bottomLine, lineLength));
      }

      if (spiderPositions.length > 0) {
        editor.setDecorations(this.spiderWebDecoration, spiderPositions);
      }
    }

    // Apply blood drip effect ONLY on functions with errors
    if (effects.bloodDrip && effects.functionsWithErrors && effects.functionsWithErrors.length > 0) {
      this.bloodDripDecoration = vscode.window.createTextEditorDecorationType({
        gutterIconPath: vscode.Uri.parse('data:image/svg+xml;base64,' + this.getBloodDropSvg()),
        gutterIconSize: 'contain',
      });

      const bloodLines: vscode.Range[] = [];
      
      // Add blood drops from start to end line of each function with errors
      for (const func of effects.functionsWithErrors) {
        if (func.hasError) {
          for (let line = func.startLine; line <= func.endLine; line++) {
            if (line < editor.document.lineCount) {
              bloodLines.push(new vscode.Range(line, 0, line, 0));
            }
          }
        }
      }

      if (bloodLines.length > 0) {
        editor.setDecorations(this.bloodDripDecoration, bloodLines);
      }
    }

    // Apply fog effect (dark transparent overlay)
    if (effects.fog) {
      this.fogDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: `rgba(30, 0, 0, ${Math.min(0.3, intensity * 0.4)})`,
        isWholeLine: true,
      });

      // Apply fog to all visible lines only
      const visibleRanges = editor.visibleRanges;
      if (visibleRanges.length > 0) {
        const fogRanges: vscode.Range[] = [];
        for (const range of visibleRanges) {
          for (let line = range.start.line; line <= range.end.line; line++) {
            fogRanges.push(new vscode.Range(line, 0, line, Number.MAX_SAFE_INTEGER));
          }
        }
        editor.setDecorations(this.fogDecoration, fogRanges);
      }
    }
  }

  /**
   * Clear all horror effects from editor
   */
  clearEffects(editor: vscode.TextEditor): void {
    if (this.bloodDripDecoration) {
      editor.setDecorations(this.bloodDripDecoration, []);
      this.bloodDripDecoration.dispose();
      this.bloodDripDecoration = undefined;
    }

    if (this.spiderWebDecoration) {
      editor.setDecorations(this.spiderWebDecoration, []);
      this.spiderWebDecoration.dispose();
      this.spiderWebDecoration = undefined;
    }

    if (this.fogDecoration) {
      editor.setDecorations(this.fogDecoration, []);
      this.fogDecoration.dispose();
      this.fogDecoration = undefined;
    }
  }

  /**
   * Generate realistic SVG for blood drop icon
   */
  private getBloodDropSvg(): string {
    const svg = `
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <!-- Realistic blood droplet shape -->
        <defs>
          <radialGradient id="bloodGradient" cx="40%" cy="30%">
            <stop offset="0%" style="stop-color:#FF0000;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#CC0000;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8B0000;stop-opacity:1" />
          </radialGradient>
          
          <!-- Shadow -->
          <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.5"/>
            <feOffset dx="0.5" dy="0.5" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <!-- Shine effect -->
          <radialGradient id="shine" cx="35%" cy="25%">
            <stop offset="0%" style="stop-color:#FF6666;stop-opacity:0.8" />
            <stop offset="50%" style="stop-color:#FF0000;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#8B0000;stop-opacity:0" />
          </radialGradient>
        </defs>
        
        <!-- Main blood drop - teardrop shape -->
        <path d="M 8,3 C 8,3 5,6 5,9 C 5,11.5 6.5,13 8,13 C 9.5,13 11,11.5 11,9 C 11,6 8,3 8,3 Z" 
              fill="url(#bloodGradient)" 
              filter="url(#dropShadow)"
              stroke="#660000" 
              stroke-width="0.3"/>
        
        <!-- Shine/highlight -->
        <ellipse cx="7" cy="6" rx="1.5" ry="2" fill="url(#shine)" opacity="0.6"/>
        
        <!-- Small drip at bottom -->
        <circle cx="8" cy="13.5" r="0.8" fill="#8B0000" opacity="0.9"/>
      </svg>
    `;
    return Buffer.from(svg).toString('base64');
  }

  dispose(): void {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      this.clearEffects(editor);
    }
  }
}
