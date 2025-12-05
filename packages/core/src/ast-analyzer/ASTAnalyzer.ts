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

    // Register default parsers
    this.registry.register(new TypeScriptParser());
    this.registry.register(new JavaScriptParser());
    this.registry.register(new PythonParser());
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
