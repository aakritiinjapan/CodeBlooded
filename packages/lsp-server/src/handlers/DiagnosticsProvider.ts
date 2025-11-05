/**
 * Diagnostics Provider
 *
 * Converts AnalysisResult to LSP Diagnostic messages and publishes them.
 * Maps complexity levels to diagnostic severity.
 */

import {
  Connection,
  Diagnostic,
  DiagnosticSeverity,
  Range,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentAnalyzer } from './DocumentAnalyzer';
import type { AnalysisResult, FunctionMetric, ComplexityLevel } from '@codechroma/core';
import { classifyComplexity } from '@codechroma/core';

/**
 * Diagnostics Provider class
 */
export class DiagnosticsProvider {
  private connection: Connection;
  private documentAnalyzer: DocumentAnalyzer;

  constructor(connection: Connection, documentAnalyzer: DocumentAnalyzer) {
    this.connection = connection;
    this.documentAnalyzer = documentAnalyzer;
  }

  /**
   * Validate a text document and send diagnostics
   */
  public validateTextDocument(document: TextDocument): void {
    this.documentAnalyzer.analyzeDocument(document, (analysisResult) => {
      const diagnostics = this.generateDiagnostics(document, analysisResult);
      this.connection.sendDiagnostics({
        uri: document.uri,
        diagnostics,
      });
    });
  }

  /**
   * Generate diagnostics from analysis result
   */
  private generateDiagnostics(
    document: TextDocument,
    analysisResult: AnalysisResult
  ): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // Generate diagnostics for each function
    for (const func of analysisResult.functions) {
      const complexity = func.cyclomaticComplexity;
      const complexityLevel = classifyComplexity(complexity);

      // Only create diagnostics for medium complexity and above
      if (complexityLevel === 'low') {
        continue;
      }

      const severity = this.mapComplexityToSeverity(complexityLevel);
      const range = this.createRange(document, func);
      const message = this.createDiagnosticMessage(func, complexityLevel);

      const diagnostic: Diagnostic = {
        severity,
        range,
        message,
        source: 'codechroma',
        code: `complexity-${complexityLevel}`,
      };

      diagnostics.push(diagnostic);
    }

    // Add file-level diagnostic if overall complexity is high
    const fileComplexity = analysisResult.metrics.cyclomaticComplexity;
    const fileComplexityLevel = classifyComplexity(fileComplexity);

    if (fileComplexityLevel === 'high' || fileComplexityLevel === 'critical') {
      const fileDiagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Warning,
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
        message: `File has ${fileComplexityLevel} overall complexity (${fileComplexity}). Consider refactoring.`,
        source: 'codechroma',
        code: 'file-complexity',
      };

      diagnostics.push(fileDiagnostic);
    }

    return diagnostics;
  }

  /**
   * Map complexity level to diagnostic severity
   */
  private mapComplexityToSeverity(
    complexityLevel: ComplexityLevel
  ): DiagnosticSeverity {
    switch (complexityLevel) {
      case 'low':
        return DiagnosticSeverity.Hint;
      case 'medium':
        return DiagnosticSeverity.Information;
      case 'high':
        return DiagnosticSeverity.Warning;
      case 'critical':
        return DiagnosticSeverity.Error;
      default:
        return DiagnosticSeverity.Information;
    }
  }

  /**
   * Create diagnostic message for a function
   */
  private createDiagnosticMessage(
    func: FunctionMetric,
    complexityLevel: ComplexityLevel
  ): string {
    const complexity = func.cyclomaticComplexity;
    const funcName = func.name || 'anonymous function';

    let message = `Function '${funcName}' has ${complexityLevel} complexity (${complexity})`;

    // Add suggestions based on complexity level
    if (complexityLevel === 'critical') {
      message += '. Critical: Immediate refactoring recommended.';
    } else if (complexityLevel === 'high') {
      message += '. Consider breaking down into smaller functions.';
    } else if (complexityLevel === 'medium') {
      message += '. Monitor for further increases.';
    }

    return message;
  }

  /**
   * Create range for a function in the document
   */
  private createRange(document: TextDocument, func: FunctionMetric): Range {
    // Convert 1-based line numbers to 0-based
    const startLine = Math.max(0, func.startLine - 1);
    const endLine = Math.max(0, func.endLine - 1);

    // Get the actual line text to determine character positions
    const endLineText = this.getLineText(document, endLine);

    return {
      start: {
        line: startLine,
        character: 0,
      },
      end: {
        line: endLine,
        character: endLineText.length,
      },
    };
  }

  /**
   * Get text of a specific line in the document
   */
  private getLineText(document: TextDocument, line: number): string {
    const text = document.getText();
    const lines = text.split(/\r?\n/);
    return lines[line] || '';
  }
}
