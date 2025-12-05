/**
 * JavaScriptParser - Parser plugin for JavaScript and JSX files
 */

import * as esprima from 'esprima';
import { Language, ParserPlugin, ErrorCode, CodeBloodedError } from '../types';

export class JavaScriptParser implements ParserPlugin {
  language = Language.JavaScript;
  extensions = ['js', 'jsx'];

  /**
   * Parse JavaScript/JSX code into AST
   */
  parse(code: string, filePath?: string): any {
    try {
      const ast = esprima.parseModule(code, {
        loc: true,
        range: true,
        comment: true,
        jsx: true,
      });

      return ast;
    } catch (error: any) {
      throw new CodeBloodedError(
        `Failed to parse JavaScript file: ${error.message}`,
        ErrorCode.PARSE_ERROR,
        { filePath, originalError: error }
      );
    }
  }
}
