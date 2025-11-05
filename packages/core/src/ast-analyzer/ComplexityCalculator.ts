/**
 * ComplexityCalculator - Calculate cyclomatic complexity from AST
 */

import { FunctionMetric } from '../types';

export class ComplexityCalculator {
  /**
   * Calculate cyclomatic complexity for a function node
   */
  calculateFunctionComplexity(node: any): number {
    let complexity = 1; // Base complexity

    this.traverse(node, (n: any) => {
      complexity += this.getComplexityIncrement(n);
    });

    return complexity;
  }

  /**
   * Calculate cyclomatic complexity for entire file
   */
  calculateFileComplexity(ast: any): number {
    let complexity = 0;

    this.traverse(ast, (node: any) => {
      complexity += this.getComplexityIncrement(node);
    });

    return complexity;
  }

  /**
   * Extract function metrics from AST
   */
  extractFunctionMetrics(ast: any, code: string): FunctionMetric[] {
    const functions: FunctionMetric[] = [];
    const lines = code.split('\n');

    this.traverse(ast, (node: any) => {
      if (this.isFunctionNode(node)) {
        const metric = this.createFunctionMetric(node, lines);
        functions.push(metric);
      }
    });

    return functions;
  }

  /**
   * Create function metric from AST node
   */
  private createFunctionMetric(node: any, _lines: string[]): FunctionMetric {
    const name = this.getFunctionName(node);
    const startLine = node.loc?.start.line || 0;
    const endLine = node.loc?.end.line || 0;
    const linesOfCode = endLine - startLine + 1;
    const parameters = this.getParameterCount(node);
    const nestingDepth = this.calculateNestingDepth(node);
    const cyclomaticComplexity = this.calculateFunctionComplexity(node);

    return {
      name,
      startLine,
      endLine,
      cyclomaticComplexity,
      linesOfCode,
      parameters,
      nestingDepth,
    };
  }

  /**
   * Get complexity increment for a node type
   */
  private getComplexityIncrement(node: any): number {
    if (!node || !node.type) return 0;

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
    ];

    if (complexityNodes.includes(node.type)) {
      return 1;
    }

    // Logical operators (&&, ||)
    if (node.type === 'LogicalExpression') {
      return 1;
    }

    return 0;
  }

  /**
   * Check if node is a function
   */
  private isFunctionNode(node: any): boolean {
    if (!node || !node.type) return false;

    const functionTypes = [
      'FunctionDeclaration',
      'FunctionExpression',
      'ArrowFunctionExpression',
      'MethodDefinition',
    ];

    return functionTypes.includes(node.type);
  }

  /**
   * Get function name from node
   */
  private getFunctionName(node: any): string {
    if (node.id && node.id.name) {
      return node.id.name;
    }

    if (node.key && node.key.name) {
      return node.key.name;
    }

    if (node.type === 'ArrowFunctionExpression') {
      return '<anonymous>';
    }

    return '<unknown>';
  }

  /**
   * Get parameter count
   */
  private getParameterCount(node: any): number {
    if (node.params) {
      return node.params.length;
    }
    if (node.value && node.value.params) {
      return node.value.params.length;
    }
    return 0;
  }

  /**
   * Calculate nesting depth
   */
  private calculateNestingDepth(node: any): number {
    let maxDepth = 0;

    const calculateDepth = (n: any, currentDepth: number, visited: Set<any> = new Set()): void => {
      if (!n || typeof n !== 'object') return;
      if (visited.has(n)) return;
      visited.add(n);

      const nestingNodes = [
        'IfStatement',
        'WhileStatement',
        'DoWhileStatement',
        'ForStatement',
        'ForInStatement',
        'ForOfStatement',
        'SwitchStatement',
        'TryStatement',
      ];

      const newDepth = nestingNodes.includes(n.type)
        ? currentDepth + 1
        : currentDepth;

      maxDepth = Math.max(maxDepth, newDepth);

      // Manually traverse children without using this.traverse
      for (const key in n) {
        if (key === 'loc' || key === 'range' || key === 'parent') continue;

        const child = n[key];

        if (Array.isArray(child)) {
          child.forEach((item) => calculateDepth(item, newDepth, visited));
        } else if (child && typeof child === 'object') {
          calculateDepth(child, newDepth, visited);
        }
      }
    };

    calculateDepth(node, 0);
    return maxDepth;
  }

  /**
   * Traverse AST using visitor pattern
   */
  private traverse(
    node: any,
    visitor: (node: any) => void,
    recursive: boolean = true,
    visited: Set<any> = new Set()
  ): void {
    if (!node || typeof node !== 'object') return;
    
    // Prevent infinite recursion from circular references
    if (visited.has(node)) return;
    visited.add(node);

    visitor(node);

    if (!recursive) return;

    for (const key in node) {
      if (key === 'loc' || key === 'range' || key === 'parent') continue;

      const child = node[key];

      if (Array.isArray(child)) {
        child.forEach((item) => this.traverse(item, visitor, recursive, visited));
      } else if (child && typeof child === 'object') {
        this.traverse(child, visitor, recursive, visited);
      }
    }
  }
}
