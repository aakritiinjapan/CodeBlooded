/**
 * ASTAnalyzer - Main class for code analysis
 */

import {
  Language,
  ParseResult,
  AnalysisResult,
  ErrorCode,
  CodeChromaError,
} from '../types';
import { ParserRegistry } from './ParserRegistry';
import { TypeScriptParser } from './TypeScriptParser';
import { JavaScriptParser } from './JavaScriptParser';
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
  }

  /**
   * Parse source code into AST
   */
  async parse(code: string, filePath: string): Promise<ParseResult> {
    const startTime = Date.now();

    // Detect language from file path
    const language = this.registry.detectLanguage(filePath);

    if (language === Language.Unknown) {
      throw new CodeChromaError(
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
      const { ast } = parseResult;

      // Extract metrics
      const metrics = this.metricsExtractor.extractMetrics(code, ast);

      // Extract function metrics
      const functions = this.complexityCalculator.extractFunctionMetrics(ast, code);

      // Extract dependencies
      const dependencies = this.metricsExtractor.extractDependencies(ast, filePath);

      return {
        file: filePath,
        metrics,
        functions,
        dependencies,
      };
    } catch (error: any) {
      throw new CodeChromaError(
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
