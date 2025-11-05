/**
 * Tests for AST Analyzer
 */

import { ASTAnalyzer } from '../ast-analyzer';
import { Language } from '../types';

describe('ASTAnalyzer', () => {
  let analyzer: ASTAnalyzer;

  beforeEach(() => {
    analyzer = new ASTAnalyzer();
  });

  describe('TypeScript parsing', () => {
    it('should parse simple TypeScript code', async () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b;
        }
      `;

      const result = await analyzer.analyzeFile(code, 'test.ts');

      expect(result.file).toBe('test.ts');
      expect(result.metrics).toBeDefined();
      expect(result.functions).toBeDefined();
      expect(result.dependencies).toBeDefined();
    });

    it('should calculate cyclomatic complexity', async () => {
      const code = `
        function complexFunction(x: number): string {
          if (x > 10) {
            return 'high';
          } else if (x > 5) {
            return 'medium';
          } else {
            return 'low';
          }
        }
      `;

      const result = await analyzer.analyzeFile(code, 'test.ts');

      expect(result.functions.length).toBeGreaterThan(0);
      expect(result.functions[0].cyclomaticComplexity).toBeGreaterThan(1);
    });
  });

  describe('JavaScript parsing', () => {
    it('should parse simple JavaScript code', async () => {
      const code = `
        function multiply(a, b) {
          return a * b;
        }
      `;

      const result = await analyzer.analyzeFile(code, 'test.js');

      expect(result.file).toBe('test.js');
      expect(result.metrics).toBeDefined();
      expect(result.functions).toBeDefined();
    });
  });

  describe('Metrics extraction', () => {
    it('should count lines of code', async () => {
      const code = `
        // This is a comment
        function test() {
          const x = 1;
          const y = 2;
          return x + y;
        }
      `;

      const result = await analyzer.analyzeFile(code, 'test.ts');

      expect(result.metrics.totalLines).toBeGreaterThan(0);
      expect(result.metrics.codeLines).toBeGreaterThan(0);
      expect(result.metrics.commentLines).toBeGreaterThan(0);
    });

    it('should extract dependencies', async () => {
      const code = `
        import { something } from './module';
        
        function test() {
          something();
        }
      `;

      const result = await analyzer.analyzeFile(code, 'test.ts');

      expect(result.dependencies.length).toBeGreaterThan(0);
      expect(result.dependencies.some(d => d.type === 'import')).toBe(true);
    });
  });

  describe('Language detection', () => {
    it('should detect TypeScript files', async () => {
      const code = 'const x: number = 1;';
      const parseResult = await analyzer.parse(code, 'test.ts');

      expect(parseResult.language).toBe(Language.TypeScript);
    });

    it('should detect JavaScript files', async () => {
      const code = 'const x = 1;';
      const parseResult = await analyzer.parse(code, 'test.js');

      expect(parseResult.language).toBe(Language.JavaScript);
    });

    it('should throw error for unsupported files', async () => {
      const code = 'print("hello")';

      await expect(analyzer.parse(code, 'test.py')).rejects.toThrow();
    });
  });
});
