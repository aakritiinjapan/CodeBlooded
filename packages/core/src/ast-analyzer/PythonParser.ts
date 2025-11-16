/**
 * PythonParser - Syntax error detection for Python files
 * 
 * Since we can't easily parse Python AST in TypeScript without running Python,
 * we'll provide syntax error detection and basic heuristic-based complexity estimation
 */

import { Language, ParserPlugin, AnalysisResult, FunctionMetric, CodeMetrics } from '../types';

export class PythonParser implements ParserPlugin {
  language = Language.Python;
  extensions = ['.py', '.pyw'];

  /**
   * Parse Python code and detect syntax errors
   */
  parse(code: string, filePath?: string): any {
    // For Python, we'll return a simplified AST-like structure
    // that focuses on syntax validation and basic metrics
    return {
      type: 'Module',
      body: [],
      errors: this.detectSyntaxErrors(code),
      filePath: filePath || 'unknown.py'
    };
  }

  /**
   * Detect common Python syntax errors
   */
  private detectSyntaxErrors(code: string): string[] {
    const errors: string[] = [];
    const lines = code.split('\n');
    
    let inMultilineString = false;
    let multilineStringDelimiter = '';
    let openBrackets = 0;
    let openParens = 0;
    let openBraces = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // Check for multiline strings
      if (inMultilineString) {
        if (line.includes(multilineStringDelimiter)) {
          inMultilineString = false;
          multilineStringDelimiter = '';
        }
        continue;
      }
      
      if (trimmedLine.startsWith('"""') || trimmedLine.startsWith("'''")) {
        const delimiter = trimmedLine.substring(0, 3);
        // Check if it's a single-line docstring
        if (trimmedLine.lastIndexOf(delimiter) > 2) {
          // Single line, do nothing
        } else {
          inMultilineString = true;
          multilineStringDelimiter = delimiter;
        }
        continue;
      }
      
      // Count brackets for balance checking
      for (const char of line) {
        if (char === '[') openBrackets++;
        if (char === ']') openBrackets--;
        if (char === '(') openParens++;
        if (char === ')') openParens--;
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
      }
      
      // Check for unbalanced brackets on this line
      if (openBrackets < 0) {
        errors.push(`Line ${lineNum}: Unmatched closing bracket ]`);
      }
      if (openParens < 0) {
        errors.push(`Line ${lineNum}: Unmatched closing parenthesis )`);
      }
      if (openBraces < 0) {
        errors.push(`Line ${lineNum}: Unmatched closing brace }`);
      }
      
      // Check for common syntax errors
      
      // 1. Missing colons after control structures
      if (/^\s*(if|elif|else|for|while|def|class|try|except|finally|with)\s+.*[^:]$/.test(line)) {
        if (!line.trim().endsWith('\\')) {
          errors.push(`Line ${lineNum}: Missing colon after ${trimmedLine.split(/\s+/)[0]} statement`);
        }
      }
      
      // 2. Invalid indentation (mixing tabs and spaces warning)
      if (line.startsWith('\t') && line.includes('    ')) {
        errors.push(`Line ${lineNum}: Mixed tabs and spaces in indentation`);
      }
      
      // 3. Check for = instead of == in conditions
      const ifMatch = line.match(/if\s+.*[^=!<>]=[^=].*/);
      if (ifMatch && !line.includes('==') && !line.includes('!=')) {
        errors.push(`Line ${lineNum}: Assignment (=) used in condition, did you mean ==?`);
      }
      
      // 4. Check for invalid function/class names
      if (/^\s*def\s+[0-9]/.test(line)) {
        errors.push(`Line ${lineNum}: Function name cannot start with a number`);
      }
      if (/^\s*class\s+[0-9]/.test(line)) {
        errors.push(`Line ${lineNum}: Class name cannot start with a number`);
      }
      
      // 5. Check for common typos
      if (line.includes('esle:')) {
        errors.push(`Line ${lineNum}: Did you mean 'else:' instead of 'esle:'?`);
      }
      if (line.includes('retrun ') || line.endsWith('retrun')) {
        errors.push(`Line ${lineNum}: Did you mean 'return' instead of 'retrun'?`);
      }
      
      // 6. Check for invalid print syntax (Python 3)
      if (/print\s+[^(]/.test(trimmedLine) && !trimmedLine.startsWith('#')) {
        errors.push(`Line ${lineNum}: print requires parentheses in Python 3: print(...)`);
      }
      
      // 7. Check for pass/break/continue/return/raise not followed by code on same line
      if (/^\s*(pass|break|continue)\s+\w/.test(line)) {
        errors.push(`Line ${lineNum}: ${trimmedLine.split(/\s+/)[0]} should be on its own line`);
      }
    }
    
    // Check for unclosed brackets at end of file
    if (openBrackets > 0) {
      errors.push(`End of file: ${openBrackets} unclosed bracket(s)`);
    }
    if (openParens > 0) {
      errors.push(`End of file: ${openParens} unclosed parenthesis(es)`);
    }
    if (openBraces > 0) {
      errors.push(`End of file: ${openBraces} unclosed brace(s)`);
    }
    if (inMultilineString) {
      errors.push(`End of file: Unclosed multiline string`);
    }
    
    return errors;
  }

  /**
   * Extract function metrics from Python code using heuristics
   */
  extractFunctionMetrics(code: string): FunctionMetric[] {
    const functions: FunctionMetric[] = [];
    const lines = code.split('\n');
    
    let currentFunction: Partial<FunctionMetric> | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Detect function definition
      const funcMatch = line.match(/^(\s*)def\s+(\w+)\s*\((.*?)\):/);
      if (funcMatch) {
        // Save previous function if exists
        if (currentFunction) {
          currentFunction.endLine = lineNum - 1;
          currentFunction.linesOfCode = (currentFunction.endLine || 0) - (currentFunction.startLine || 0) + 1;
          functions.push(currentFunction as FunctionMetric);
        }
        
        const funcName = funcMatch[2];
        const params = funcMatch[3].split(',').filter(p => p.trim()).length;
        
        currentFunction = {
          name: funcName,
          startLine: lineNum,
          endLine: lineNum,
          cyclomaticComplexity: this.estimateComplexity(code, lineNum, lines),
          linesOfCode: 0,
          parameters: params,
          nestingDepth: this.estimateNestingDepth(code, lineNum, lines),
        };
      }
      
      // Detect end of function (return to base indentation or less)
      if (currentFunction && line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t') && lineNum > currentFunction.startLine!) {
        currentFunction.endLine = lineNum - 1;
        currentFunction.linesOfCode = currentFunction.endLine - currentFunction.startLine! + 1;
        functions.push(currentFunction as FunctionMetric);
        currentFunction = null;
      }
    }
    
    // Close last function
    if (currentFunction) {
      currentFunction.endLine = lines.length;
      currentFunction.linesOfCode = currentFunction.endLine - currentFunction.startLine! + 1;
      functions.push(currentFunction as FunctionMetric);
    }
    
    return functions;
  }

  /**
   * Estimate cyclomatic complexity for a Python function
   * Based on counting decision points (if, elif, for, while, and, or, except, etc.)
   */
  private estimateComplexity(_code: string, startLine: number, lines: string[]): number {
    let complexity = 1; // Base complexity
    let baseIndent = lines[startLine - 1].match(/^(\s*)/)?.[1].length || 0;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      const indent = line.match(/^(\s*)/)?.[1].length || 0;
      
      // Stop if we've exited the function
      if (line.trim() && indent <= baseIndent && i > startLine) {
        break;
      }
      
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      
      // Count decision points
      if (/^\s*(if|elif)\s+/.test(line)) complexity++;
      if (/^\s*for\s+/.test(line)) complexity++;
      if (/^\s*while\s+/.test(line)) complexity++;
      if (/^\s*except/.test(line)) complexity++;
      
      // Count logical operators (and/or)
      const andCount = (line.match(/\sand\s/g) || []).length;
      const orCount = (line.match(/\sor\s/g) || []).length;
      complexity += andCount + orCount;
    }
    
    return complexity;
  }

  /**
   * Estimate nesting depth for a Python function
   */
  private estimateNestingDepth(_code: string, startLine: number, lines: string[]): number {
    let maxDepth = 0;
    let baseIndent = lines[startLine - 1].match(/^(\s*)/)?.[1].length || 0;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      const indent = line.match(/^(\s*)/)?.[1].length || 0;
      
      // Stop if we've exited the function
      if (line.trim() && indent <= baseIndent && i > startLine) {
        break;
      }
      
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      
      // Calculate nesting level based on indentation (assuming 4 spaces per level)
      const nestingLevel = Math.floor((indent - baseIndent) / 4);
      maxDepth = Math.max(maxDepth, nestingLevel);
    }
    
    return maxDepth;
  }

  /**
   * Calculate code metrics for Python file
   */
  calculateMetrics(code: string): CodeMetrics {
    const lines = code.split('\n');
    let totalLines = lines.length;
    let codeLines = 0;
    let commentLines = 0;
    let inMultilineString = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check multiline strings (docstrings)
      if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        inMultilineString = !inMultilineString;
        commentLines++;
        continue;
      }
      
      if (inMultilineString) {
        commentLines++;
        continue;
      }
      
      if (!trimmed) {
        continue; // empty line
      }
      
      if (trimmed.startsWith('#')) {
        commentLines++;
      } else {
        codeLines++;
      }
    }
    
    // Estimate total file complexity (sum of all functions)
    const functions = this.extractFunctionMetrics(code);
    const cyclomaticComplexity = functions.reduce((sum, f) => sum + f.cyclomaticComplexity, 0) || 1;
    
    // Simple maintainability index estimation
    const maintainabilityIndex = Math.max(0, Math.min(100, 
      100 - (cyclomaticComplexity * 2) - (codeLines / 10)
    ));
    
    return {
      totalLines,
      codeLines,
      commentLines,
      cyclomaticComplexity,
      maintainabilityIndex,
    };
  }

  /**
   * Analyze Python code and return results
   */
  analyze(code: string, filePath?: string): AnalysisResult {
    const ast = this.parse(code, filePath);
    const metrics = this.calculateMetrics(code);
    const functions = this.extractFunctionMetrics(code);
    
    // Add syntax errors to the analysis result
    if (ast.errors && ast.errors.length > 0) {
      console.warn(`[PythonParser] Syntax errors detected in ${filePath}:`, ast.errors);
    }
    
    return {
      file: filePath || 'unknown.py',
      metrics,
      functions,
      dependencies: [], // Not implemented for Python
      syntaxErrors: ast.errors || [],
    };
  }
}
