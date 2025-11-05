/**
 * TypeScriptParser - Parser plugin for TypeScript and TSX files
 */

import { Language, ParserPlugin, ErrorCode, CodeChromaError } from '../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const tsParser = require('@typescript-eslint/parser');

export class TypeScriptParser implements ParserPlugin {
  language = Language.TypeScript;
  extensions = ['ts', 'tsx'];

  /**
   * Parse TypeScript/TSX code into AST
   */
  parse(code: string, filePath?: string): any {
    try {
      const ast = tsParser.parse(code, {
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
          globalReturn: false,
        },
        loc: true,
        range: true,
        tokens: false,
        comment: true,
      });

      return ast;
    } catch (error: any) {
      throw new CodeChromaError(
        `Failed to parse TypeScript file: ${error.message}`,
        ErrorCode.PARSE_ERROR,
        { filePath, originalError: error }
      );
    }
  }
}
