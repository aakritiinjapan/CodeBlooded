/**
 * MetricsExtractor - Extract code metrics and dependencies from AST
 */

import { CodeMetrics, Dependency } from '../types';

export class MetricsExtractor {
  /**
   * Extract code metrics from source code
   */
  extractMetrics(code: string, ast: any): CodeMetrics {
    const lines = code.split('\n');
    const totalLines = lines.length;
    
    const { codeLines, commentLines } = this.countLines(code);
    const cyclomaticComplexity = this.calculateComplexity(ast);
    const maintainabilityIndex = this.calculateMaintainabilityIndex(
      totalLines,
      cyclomaticComplexity,
      codeLines
    );

    return {
      totalLines,
      codeLines,
      commentLines,
      cyclomaticComplexity,
      maintainabilityIndex,
    };
  }

  /**
   * Extract dependencies from AST
   */
  extractDependencies(ast: any, filePath: string): Dependency[] {
    const dependencies: Dependency[] = [];

    this.traverse(ast, (node: any) => {
      // Import declarations
      if (node.type === 'ImportDeclaration' && node.source) {
        dependencies.push({
          from: filePath,
          to: node.source.value || node.source.raw,
          type: 'import',
        });
      }

      // Require calls
      if (
        node.type === 'CallExpression' &&
        node.callee &&
        node.callee.name === 'require' &&
        node.arguments &&
        node.arguments[0]
      ) {
        const arg = node.arguments[0];
        dependencies.push({
          from: filePath,
          to: arg.value || arg.raw,
          type: 'import',
        });
      }

      // Function calls (for call graph)
      if (
        node.type === 'CallExpression' &&
        node.callee &&
        node.callee.name
      ) {
        dependencies.push({
          from: filePath,
          to: node.callee.name,
          type: 'call',
        });
      }

      // Class inheritance
      if (
        node.type === 'ClassDeclaration' &&
        node.superClass &&
        node.superClass.name
      ) {
        dependencies.push({
          from: node.id?.name || filePath,
          to: node.superClass.name,
          type: 'inheritance',
        });
      }
    });

    return dependencies;
  }

  /**
   * Count code lines and comment lines
   */
  private countLines(code: string): { codeLines: number; commentLines: number } {
    const lines = code.split('\n');
    let codeLines = 0;
    let commentLines = 0;
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (trimmed.length === 0) {
        continue;
      }

      // Check for block comment start
      if (trimmed.startsWith('/*')) {
        inBlockComment = true;
        commentLines++;
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }

      // Check for block comment end
      if (inBlockComment) {
        commentLines++;
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }

      // Check for single-line comment
      if (trimmed.startsWith('//')) {
        commentLines++;
        continue;
      }

      // It's a code line
      codeLines++;
    }

    return { codeLines, commentLines };
  }

  /**
   * Calculate cyclomatic complexity from AST
   */
  private calculateComplexity(ast: any): number {
    let complexity = 0;

    this.traverse(ast, (node: any) => {
      if (!node || !node.type) return;

      const complexityNodes = [
        'IfStatement',
        'ConditionalExpression',
        'WhileStatement',
        'DoWhileStatement',
        'ForStatement',
        'ForInStatement',
        'ForOfStatement',
        'SwitchCase',
        'CatchClause',
        'LogicalExpression',
      ];

      if (complexityNodes.includes(node.type)) {
        complexity++;
      }
    });

    return complexity;
  }

  /**
   * Calculate maintainability index
   * Formula: 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(LOC)
   * Where V = Halstead Volume (simplified), G = Cyclomatic Complexity, LOC = Lines of Code
   * Simplified version for now
   */
  private calculateMaintainabilityIndex(
    _totalLines: number,
    complexity: number,
    codeLines: number
  ): number {
    if (codeLines === 0) return 100;

    // Simplified formula
    const volume = codeLines * Math.log2(codeLines + 1);
    const mi =
      171 -
      5.2 * Math.log(volume) -
      0.23 * complexity -
      16.2 * Math.log(codeLines);

    // Normalize to 0-100 scale
    const normalized = Math.max(0, Math.min(100, mi));

    return Math.round(normalized * 100) / 100;
  }

  /**
   * Traverse AST using visitor pattern
   */
  private traverse(node: any, visitor: (node: any) => void, visited: Set<any> = new Set()): void {
    if (!node || typeof node !== 'object') return;
    
    // Prevent infinite recursion from circular references
    if (visited.has(node)) return;
    visited.add(node);

    visitor(node);

    for (const key in node) {
      if (key === 'loc' || key === 'range' || key === 'parent') continue;

      const child = node[key];

      if (Array.isArray(child)) {
        child.forEach((item) => this.traverse(item, visitor, visited));
      } else if (child && typeof child === 'object') {
        this.traverse(child, visitor, visited);
      }
    }
  }
}
