/**
 * Code Action Provider
 *
 * Provides code actions for high complexity functions.
 * Suggests refactoring for complex code.
 */

import {
  Connection,
  CodeAction,
  CodeActionKind,
  CodeActionParams,
  Diagnostic,
} from 'vscode-languageserver/node';
import { DocumentAnalyzer } from './DocumentAnalyzer';
import type { FunctionMetric } from '@codechroma/core';

/**
 * Code Action Provider class
 */
export class CodeActionProvider {
  private connection: Connection;
  private documentAnalyzer: DocumentAnalyzer;

  constructor(connection: Connection, documentAnalyzer: DocumentAnalyzer) {
    this.connection = connection;
    this.documentAnalyzer = documentAnalyzer;

    // Register code action handler
    this.connection.onCodeAction(this.handleCodeAction.bind(this));
  }

  /**
   * Handle code action requests
   */
  private handleCodeAction(params: CodeActionParams): CodeAction[] {
    const uri = params.textDocument.uri;
    const analysisResult = this.documentAnalyzer.getCachedAnalysis(uri);

    if (!analysisResult) {
      return [];
    }

    const codeActions: CodeAction[] = [];

    // Process diagnostics to find complexity issues
    for (const diagnostic of params.context.diagnostics) {
      if (diagnostic.source !== 'codechroma') {
        continue;
      }

      // Find the function corresponding to this diagnostic
      const func = this.findFunctionAtRange(
        analysisResult.functions,
        diagnostic.range.start.line
      );

      if (!func) {
        continue;
      }

      // Generate code actions based on complexity and code patterns
      if (func.cyclomaticComplexity >= 11) {
        // High or critical complexity - suggest extract method
        codeActions.push(
          this.createExtractMethodAction(diagnostic, func)
        );
      }

      if (func.nestingDepth >= 3) {
        // Deep nesting - suggest simplify conditional
        codeActions.push(
          this.createSimplifyConditionalAction(diagnostic, func)
        );
      }

      if (func.cyclomaticComplexity >= 16) {
        // Critical complexity - suggest breaking down
        codeActions.push(
          this.createBreakDownFunctionAction(diagnostic, func)
        );
      }
    }

    return codeActions;
  }

  /**
   * Create "Extract Method" refactoring action
   */
  private createExtractMethodAction(
    diagnostic: Diagnostic,
    func: FunctionMetric
  ): CodeAction {
    const funcName = func.name || 'anonymous function';

    return {
      title: `Extract method from '${funcName}'`,
      kind: CodeActionKind.RefactorExtract,
      diagnostics: [diagnostic],
      command: {
        title: 'Extract Method',
        command: 'codechroma.extractMethod',
        arguments: [
          {
            functionName: func.name,
            startLine: func.startLine,
            endLine: func.endLine,
          },
        ],
      },
    };
  }

  /**
   * Create "Simplify Conditional" refactoring action
   */
  private createSimplifyConditionalAction(
    diagnostic: Diagnostic,
    func: FunctionMetric
  ): CodeAction {
    const funcName = func.name || 'anonymous function';

    return {
      title: `Simplify conditionals in '${funcName}'`,
      kind: CodeActionKind.RefactorRewrite,
      diagnostics: [diagnostic],
      command: {
        title: 'Simplify Conditional',
        command: 'codechroma.simplifyConditional',
        arguments: [
          {
            functionName: func.name,
            startLine: func.startLine,
            endLine: func.endLine,
            nestingDepth: func.nestingDepth,
          },
        ],
      },
    };
  }

  /**
   * Create "Break Down Function" refactoring action
   */
  private createBreakDownFunctionAction(
    diagnostic: Diagnostic,
    func: FunctionMetric
  ): CodeAction {
    const funcName = func.name || 'anonymous function';

    return {
      title: `Break down '${funcName}' into smaller functions`,
      kind: CodeActionKind.RefactorRewrite,
      diagnostics: [diagnostic],
      command: {
        title: 'Break Down Function',
        command: 'codechroma.breakDownFunction',
        arguments: [
          {
            functionName: func.name,
            startLine: func.startLine,
            endLine: func.endLine,
            complexity: func.cyclomaticComplexity,
          },
        ],
      },
    };
  }

  /**
   * Find function at a specific line
   */
  private findFunctionAtRange(
    functions: FunctionMetric[],
    line: number
  ): FunctionMetric | undefined {
    // Convert 0-based line to 1-based for comparison
    const targetLine = line + 1;

    return functions.find(
      (func) => func.startLine <= targetLine && func.endLine >= targetLine
    );
  }
}
