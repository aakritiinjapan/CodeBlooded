/**
 * Diagnostic Manager
 * 
 * Monitors VS Code diagnostics (errors, warnings) in real-time
 * and provides horror-themed feedback
 */

import * as vscode from 'vscode';

export interface DiagnosticSummary {
  errorCount: number;
  warningCount: number;
  infoCount: number;
  totalCount: number;
  severity: 'none' | 'info' | 'warning' | 'error' | 'critical';
  horrorScore: number; // 0-100
}

export class DiagnosticManager implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private onDidChangeDiagnosticsEmitter = new vscode.EventEmitter<DiagnosticSummary>();
  public readonly onDidChangeDiagnostics = this.onDidChangeDiagnosticsEmitter.event;
  private lastSummary: DiagnosticSummary | undefined;
  private analyzeTimeout: NodeJS.Timeout | undefined;

  constructor() {
    // Listen for diagnostic changes
    this.disposables.push(
      vscode.languages.onDidChangeDiagnostics(() => {
        // Debounce to avoid firing too frequently
        if (this.analyzeTimeout) {
          clearTimeout(this.analyzeTimeout);
        }
        this.analyzeTimeout = setTimeout(() => {
          this.analyzeDiagnostics();
        }, 100);
      })
    );

    // Listen for active editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.analyzeDiagnostics();
      })
    );
  }

  /**
   * Get current diagnostic summary for active editor
   */
  getCurrentSummary(): DiagnosticSummary {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return this.createEmptySummary();
    }

    return this.getDiagnosticsForDocument(editor.document);
  }

  /**
   * Analyze diagnostics and emit change event
   */
  private analyzeDiagnostics(): void {
    const summary = this.getCurrentSummary();
    
    // Only emit if something actually changed
    if (this.lastSummary && 
        this.lastSummary.errorCount === summary.errorCount &&
        this.lastSummary.warningCount === summary.warningCount &&
        this.lastSummary.infoCount === summary.infoCount) {
      console.log('[codeblooded Diagnostics] No change, skipping emit');
      return;
    }
    
    console.log('[codeblooded Diagnostics] Changed:', summary);
    this.lastSummary = summary;
    this.onDidChangeDiagnosticsEmitter.fire(summary);
  }

  /**
   * Get diagnostics for a specific document
   */
  private getDiagnosticsForDocument(document: vscode.TextDocument): DiagnosticSummary {
    const diagnostics = vscode.languages.getDiagnostics(document.uri);

    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    for (const diagnostic of diagnostics) {
      switch (diagnostic.severity) {
        case vscode.DiagnosticSeverity.Error:
          errorCount++;
          break;
        case vscode.DiagnosticSeverity.Warning:
          warningCount++;
          break;
        case vscode.DiagnosticSeverity.Information:
        case vscode.DiagnosticSeverity.Hint:
          infoCount++;
          break;
      }
    }

    const totalCount = errorCount + warningCount + infoCount;
    const severity = this.calculateSeverity(errorCount, warningCount, infoCount);
    const horrorScore = this.calculateHorrorScore(errorCount, warningCount, infoCount);

    return {
      errorCount,
      warningCount,
      infoCount,
      totalCount,
      severity,
      horrorScore,
    };
  }

  /**
   * Calculate severity level based on diagnostic counts
   */
  private calculateSeverity(
    errors: number,
    warnings: number,
    infos: number
  ): DiagnosticSummary['severity'] {
    if (errors >= 5) {
      return 'critical';
    } else if (errors > 0) {
      return 'error';
    } else if (warnings >= 10) {
      return 'critical';
    } else if (warnings > 0) {
      return 'warning';
    } else if (infos > 0) {
      return 'info';
    }
    return 'none';
  }

  /**
   * Calculate horror score (0-100) based on diagnostics
   * Focus on actual errors, reduce impact of warnings/info
   */
  private calculateHorrorScore(errors: number, warnings: number, _infos: number): number {
    // Errors are worth 25 points each (major impact)
    // Warnings are worth 2 points each (minor impact)
    // Infos are worth 0 points (no impact on horror)
    const rawScore = errors * 25 + warnings * 2;
    
    // Cap at 100
    return Math.min(100, rawScore);
  }

  /**
   * Create empty summary for when there's no active editor
   */
  private createEmptySummary(): DiagnosticSummary {
    return {
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      totalCount: 0,
      severity: 'none',
      horrorScore: 0,
    };
  }

  dispose(): void {
    this.onDidChangeDiagnosticsEmitter.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}
