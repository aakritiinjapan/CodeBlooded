/**
 * AST Analyzer module exports
 */

export { ASTAnalyzer } from './ASTAnalyzer';
export { ParserRegistry } from './ParserRegistry';
export { TypeScriptParser } from './TypeScriptParser';
export { JavaScriptParser } from './JavaScriptParser';
export { PythonParser } from './PythonParser';
export { ComplexityCalculator } from './ComplexityCalculator';
export { MetricsExtractor } from './MetricsExtractor';

// C-style language parsers (heuristic-based)
export {
  CStyleParser,
  createCStyleParser,
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
