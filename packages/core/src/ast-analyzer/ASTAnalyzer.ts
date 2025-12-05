/**
 * ASTAnalyzer - Main class for code analysis
 */

import {
  Language,
  ParseResult,
  AnalysisResult,
  ErrorCode,
  CodeBloodedError,
} from '../types';
import { ParserRegistry } from './ParserRegistry';
import { TypeScriptParser } from './TypeScriptParser';
import { JavaScriptParser } from './JavaScriptParser';
import { PythonParser } from './PythonParser';
import {
  JavaParser,
  CSharpParser,
  GoParser,
  RustParser,
  CppParser,
  CParser,
  PHPParser,
  RubyParser,
  SwiftParser,
  KotlinParser,
  ScalaParser,
} from './CStyleParser';
import { ComplexityCalculator } from './ComplexityCalculator';
import { MetricsExtractor } from './MetricsExtractor';

export class ASTAnalyzer {
  private registry: ParserRegistry;
  private complexityCalculator: ComplexityCalculator;
  private metricsExtractor: MetricsExtractor;

  constructor() {
    this.registry = new ParserRegistry();
    this.complexityCalculator = new ComplexityCalculator();
    this.metricsExtractor = new MetricsExtractor();

    // Register default parsers (AST-based)
    this.registry.register(new TypeScriptParser());
    this.registry.register(new JavaScriptParser());
    this.registry.register(new PythonParser());

    // Register heuristic-based parsers for other languages
    this.registry.register(new JavaParser());
    this.registry.register(new CSharpParser());
    this.registry.register(new GoParser());
    this.registry.register(new RustParser());
    this.registry.register(new CppParser());
    this.registry.register(new CParser());
    this.registry.register(new PHPParser());
    this.registry.register(new RubyParser());
    this.registry.register(new SwiftParser());
    this.registry.register(new KotlinParser());
    this.registry.register(new ScalaParser());
  }

  /**
   * Parse source code into AST
   */
  async parse(code: string, filePath: string): Promise<ParseResult> {
    const startTime = Date.now();

    // Detect language from file path
    const language = this.registry.detectLanguage(filePath);

    if (language === Language.Unknown) {
      throw new CodeBloodedError(
        `Unsupported file type: ${filePath}`,
        ErrorCode.PARSE_ERROR,
        { filePath }
      );
    }

    // Get appropriate parser
    const parser = this.registry.getParser(language);

    // Parse code
    const ast = parser.parse(code, filePath);

    const parseTime = Date.now() - startTime;

    return {
      ast,
      language,
      parseTime,
    };
  }

  /**
   * Analyze parsed AST and extract metrics
   */
  analyze(parseResult: ParseResult, code: string, filePath: string): AnalysisResult {
    try {
      const { ast, language } = parseResult;

      // For Python, use the parser's built-in analyze method
      if (language === Language.Python) {
        const parser = this.registry.getParser(Language.Python) as PythonParser;
        return parser.analyze(code, filePath);
      }

      // For C-style languages (Java, C#, Go, Rust, C, C++, PHP, Ruby, Swift, Kotlin, Scala)
      // Use the parser's built-in analyze method
      const cStyleLanguages = [
        Language.Java, Language.CSharp, Language.Go, Language.Rust,
        Language.Cpp, Language.C, Language.PHP, Language.Ruby,
        Language.Swift, Language.Kotlin, Language.Scala
      ];
      
      if (cStyleLanguages.includes(language)) {
        const parser = this.registry.getParser(language);
        if ('analyze' in parser && typeof parser.analyze === 'function') {
          return parser.analyze(code, filePath);
        }
      }

      // For TypeScript/JavaScript, use the standard extraction methods
      const metrics = this.metricsExtractor.extractMetrics(code, ast);
      const functions = this.complexityCalculator.extractFunctionMetrics(ast, code);
      const dependencies = this.metricsExtractor.extractDependencies(ast, filePath);

      return {
        file: filePath,
        metrics,
        functions,
        dependencies,
      };
    } catch (error: any) {
      throw new CodeBloodedError(
        `Analysis failed: ${error.message}`,
        ErrorCode.ANALYSIS_ERROR,
        { filePath, originalError: error }
      );
    }
  }

  /**
   * Parse and analyze in one step
   */
  async analyzeFile(code: string, filePath: string): Promise<AnalysisResult> {
    const parseResult = await this.parse(code, filePath);
    return this.analyze(parseResult, code, filePath);
  }

  /**
   * Get parser registry for custom parser registration
   */
  getRegistry(): ParserRegistry {
    return this.registry;
  }
}
