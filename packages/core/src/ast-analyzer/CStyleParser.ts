/**
 * CStyleParser - Heuristic-based parser for C-style languages
 * 
 * Supports: Java, C#, Go, Rust, C, C++, PHP, Swift, Kotlin, Scala
 * Uses pattern matching to estimate cyclomatic complexity
 */

import { Language, ParserPlugin, AnalysisResult, FunctionMetric, CodeMetrics } from '../types';

interface LanguageConfig {
  language: Language;
  extensions: string[];
  functionPatterns: RegExp[];
  commentSingle: string;
  commentMultiStart: string;
  commentMultiEnd: string;
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  java: {
    language: Language.Java,
    extensions: ['.java'],
    functionPatterns: [
      /^\s*(public|private|protected)?\s*(static)?\s*\w+\s+(\w+)\s*\([^)]*\)\s*(\{|throws)/,
    ],
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/',
  },
  csharp: {
    language: Language.CSharp,
    extensions: ['.cs'],
    functionPatterns: [
      /^\s*(public|private|protected|internal)?\s*(static|async|virtual|override)?\s*\w+\s+(\w+)\s*\([^)]*\)\s*\{?/,
    ],
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/',
  },
  go: {
    language: Language.Go,
    extensions: ['.go'],
    functionPatterns: [
      /^\s*func\s+(\([^)]+\)\s+)?(\w+)\s*\([^)]*\)/,
    ],
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/',
  },
  rust: {
    language: Language.Rust,
    extensions: ['.rs'],
    functionPatterns: [
      /^\s*(pub\s+)?(async\s+)?fn\s+(\w+)\s*(<[^>]*>)?\s*\([^)]*\)/,
    ],
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/',
  },
  cpp: {
    language: Language.Cpp,
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
    functionPatterns: [
      /^\s*(\w+\s+)*(\w+)\s*::\s*(\w+)\s*\([^)]*\)\s*\{?/,
      /^\s*(\w+\s+)+(\w+)\s*\([^)]*\)\s*\{?/,
    ],
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/',
  },
  c: {
    language: Language.C,
    extensions: ['.c'],
    functionPatterns: [
      /^\s*(\w+\s+)+(\w+)\s*\([^)]*\)\s*\{?/,
    ],
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/',
  },
  php: {
    language: Language.PHP,
    extensions: ['.php'],
    functionPatterns: [
      /^\s*(public|private|protected)?\s*(static)?\s*function\s+(\w+)\s*\([^)]*\)/,
    ],
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/',
  },
  ruby: {
    language: Language.Ruby,
    extensions: ['.rb'],
    functionPatterns: [
      /^\s*def\s+(\w+)(\([^)]*\))?/,
    ],
    commentSingle: '#',
    commentMultiStart: '=begin',
    commentMultiEnd: '=end',
  },
  swift: {
    language: Language.Swift,
    extensions: ['.swift'],
    functionPatterns: [
      /^\s*(public|private|internal|fileprivate|open)?\s*(static)?\s*func\s+(\w+)\s*(<[^>]*>)?\s*\([^)]*\)/,
    ],
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/',
  },
  kotlin: {
    language: Language.Kotlin,
    extensions: ['.kt', '.kts'],
    functionPatterns: [
      /^\s*(public|private|protected|internal)?\s*(suspend)?\s*fun\s+(\w+)\s*(<[^>]*>)?\s*\([^)]*\)/,
    ],
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/',
  },
  scala: {
    language: Language.Scala,
    extensions: ['.scala'],
    functionPatterns: [
      /^\s*(private|protected)?\s*def\s+(\w+)\s*(\[[^\]]*\])?\s*\([^)]*\)/,
    ],
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/',
  },
};

export class CStyleParser implements ParserPlugin {
  language: Language;
  extensions: string[];
  private config: LanguageConfig;

  constructor(languageKey: string) {
    const config = LANGUAGE_CONFIGS[languageKey];
    if (!config) {
      throw new Error(`Unknown language: ${languageKey}`);
    }
    this.config = config;
    this.language = config.language;
    this.extensions = config.extensions;
  }

  /**
   * Parse code - returns a simple structure for C-style languages
   */
  parse(_code: string, filePath?: string): any {
    return {
      type: 'Program',
      body: [],
      filePath: filePath || 'unknown',
      language: this.language,
    };
  }

  /**
   * Extract function metrics using heuristics
   */
  extractFunctionMetrics(code: string): FunctionMetric[] {
    const functions: FunctionMetric[] = [];
    const lines = code.split('\n');
    
    let inMultilineComment = false;
    let braceDepth = 0;
    let currentFunction: Partial<FunctionMetric> | null = null;
    let functionStartBraceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const trimmedLine = line.trim();

      // Handle multiline comments
      if (inMultilineComment) {
        if (trimmedLine.includes(this.config.commentMultiEnd)) {
          inMultilineComment = false;
        }
        continue;
      }

      if (trimmedLine.startsWith(this.config.commentMultiStart)) {
        if (!trimmedLine.includes(this.config.commentMultiEnd)) {
          inMultilineComment = true;
        }
        continue;
      }

      // Skip single-line comments
      if (trimmedLine.startsWith(this.config.commentSingle)) {
        continue;
      }

      // Count braces (for languages that use them)
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      
      // Check for function definition
      if (!currentFunction) {
        for (const pattern of this.config.functionPatterns) {
          const match = line.match(pattern);
          if (match) {
            // Extract function name (usually last capturing group or specific position)
            const funcName = this.extractFunctionName(match, line);
            if (funcName && !this.isKeyword(funcName)) {
              currentFunction = {
                name: funcName,
                startLine: lineNum,
                cyclomaticComplexity: 1,
                linesOfCode: 0,
                parameters: this.countParameters(line),
                nestingDepth: 0,
              };
              functionStartBraceDepth = braceDepth;
              break;
            }
          }
        }
      }

      braceDepth += openBraces - closeBraces;

      // If we're inside a function, calculate complexity
      if (currentFunction) {
        currentFunction.cyclomaticComplexity! += this.countDecisionPoints(trimmedLine);
        currentFunction.nestingDepth = Math.max(
          currentFunction.nestingDepth || 0,
          braceDepth - functionStartBraceDepth
        );

        // Check if function ended
        if (braceDepth <= functionStartBraceDepth && closeBraces > 0 && i > currentFunction.startLine! - 1) {
          currentFunction.endLine = lineNum;
          currentFunction.linesOfCode = lineNum - currentFunction.startLine! + 1;
          functions.push(currentFunction as FunctionMetric);
          currentFunction = null;
        }
      }
    }

    // Handle unclosed function (e.g., Ruby-style without braces)
    if (currentFunction) {
      currentFunction.endLine = lines.length;
      currentFunction.linesOfCode = lines.length - currentFunction.startLine! + 1;
      functions.push(currentFunction as FunctionMetric);
    }

    return functions;
  }

  /**
   * Extract function name from regex match
   */
  private extractFunctionName(match: RegExpMatchArray, line: string): string {
    // Try to find the function name in the match groups
    for (let i = match.length - 1; i >= 1; i--) {
      if (match[i] && /^\w+$/.test(match[i]) && !this.isKeyword(match[i])) {
        return match[i];
      }
    }
    
    // Fallback: extract from the line directly
    const funcMatch = line.match(/(?:func|function|def|fn)\s+(\w+)/);
    if (funcMatch) return funcMatch[1];
    
    return match[match.length - 1] || 'unknown';
  }

  /**
   * Check if a word is a language keyword
   */
  private isKeyword(word: string): boolean {
    const keywords = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
      'return', 'throw', 'try', 'catch', 'finally', 'new', 'delete', 'typeof',
      'void', 'null', 'true', 'false', 'class', 'interface', 'extends', 'implements',
      'public', 'private', 'protected', 'static', 'final', 'abstract', 'virtual',
      'override', 'async', 'await', 'const', 'let', 'var', 'func', 'function',
      'def', 'fn', 'pub', 'mut', 'ref', 'self', 'this', 'super', 'import', 'export',
      'package', 'module', 'namespace', 'using', 'include', 'require',
    ];
    return keywords.includes(word.toLowerCase());
  }

  /**
   * Count parameters in a function signature
   */
  private countParameters(line: string): number {
    const match = line.match(/\(([^)]*)\)/);
    if (!match || !match[1].trim()) return 0;
    return match[1].split(',').filter(p => p.trim()).length;
  }

  /**
   * Count decision points in a line for cyclomatic complexity
   */
  private countDecisionPoints(line: string): number {
    let count = 0;
    
    // Decision keywords (language-agnostic patterns)
    const patterns = [
      /\bif\s*\(/,
      /\belse\s+if\s*\(/,
      /\belif\s*\(/,
      /\bfor\s*\(/,
      /\bforeach\s*\(/,
      /\bwhile\s*\(/,
      /\bcase\s+/,
      /\bcatch\s*\(/,
      /\bexcept\s*/,
      /\bwhen\s*\(/,
      /\?\s*[^:]/,  // Ternary operator
      /\bmatch\s*\{/,  // Rust match
      /\bguard\s+/,  // Swift guard
    ];

    for (const pattern of patterns) {
      if (pattern.test(line)) {
        count++;
      }
    }

    // Logical operators
    count += (line.match(/\s&&\s/g) || []).length;
    count += (line.match(/\s\|\|\s/g) || []).length;
    count += (line.match(/\sand\s/g) || []).length;
    count += (line.match(/\sor\s/g) || []).length;

    return count;
  }

  /**
   * Calculate code metrics
   */
  calculateMetrics(code: string): CodeMetrics {
    const lines = code.split('\n');
    const totalLines = lines.length;
    let codeLines = 0;
    let commentLines = 0;
    let inMultilineComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (inMultilineComment) {
        commentLines++;
        if (trimmed.includes(this.config.commentMultiEnd)) {
          inMultilineComment = false;
        }
        continue;
      }

      if (trimmed.startsWith(this.config.commentMultiStart)) {
        commentLines++;
        if (!trimmed.includes(this.config.commentMultiEnd)) {
          inMultilineComment = true;
        }
        continue;
      }

      if (!trimmed) continue;

      if (trimmed.startsWith(this.config.commentSingle)) {
        commentLines++;
      } else {
        codeLines++;
      }
    }

    const functions = this.extractFunctionMetrics(code);
    const cyclomaticComplexity = functions.reduce((sum, f) => sum + f.cyclomaticComplexity, 0) || 1;

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
   * Analyze code and return results
   */
  analyze(code: string, filePath?: string): AnalysisResult {
    const metrics = this.calculateMetrics(code);
    const functions = this.extractFunctionMetrics(code);

    return {
      file: filePath || 'unknown',
      metrics,
      functions,
      dependencies: [],
    };
  }
}

// Factory function to create parsers for each language
export function createCStyleParser(language: string): CStyleParser {
  return new CStyleParser(language);
}

// Export individual parser classes for convenience
export class JavaParser extends CStyleParser {
  constructor() { super('java'); }
}

export class CSharpParser extends CStyleParser {
  constructor() { super('csharp'); }
}

export class GoParser extends CStyleParser {
  constructor() { super('go'); }
}

export class RustParser extends CStyleParser {
  constructor() { super('rust'); }
}

export class CppParser extends CStyleParser {
  constructor() { super('cpp'); }
}

export class CParser extends CStyleParser {
  constructor() { super('c'); }
}

export class PHPParser extends CStyleParser {
  constructor() { super('php'); }
}

export class RubyParser extends CStyleParser {
  constructor() { super('ruby'); }
}

export class SwiftParser extends CStyleParser {
  constructor() { super('swift'); }
}

export class KotlinParser extends CStyleParser {
  constructor() { super('kotlin'); }
}

export class ScalaParser extends CStyleParser {
  constructor() { super('scala'); }
}
