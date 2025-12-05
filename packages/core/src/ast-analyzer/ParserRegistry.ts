/**
 * ParserRegistry - Plugin architecture for language parsers
 */

import { Language, ParserPlugin, ErrorCode, CodeBloodedError } from '../types';

export class ParserRegistry {
  private parsers: Map<Language, ParserPlugin> = new Map();
  private extensionMap: Map<string, Language> = new Map();

  /**
   * Register a parser plugin for a specific language
   */
  register(plugin: ParserPlugin): void {
    this.parsers.set(plugin.language, plugin);
    
    // Map file extensions to language
    for (const ext of plugin.extensions) {
      this.extensionMap.set(ext.toLowerCase(), plugin.language);
    }
  }

  /**
   * Get parser for a specific language
   */
  getParser(language: Language): ParserPlugin {
    const parser = this.parsers.get(language);
    if (!parser) {
      throw new CodeBloodedError(
        `No parser registered for language: ${language}`,
        ErrorCode.PARSE_ERROR,
        { language }
      );
    }
    return parser;
  }

  /**
   * Detect language based on file path extension
   */
  detectLanguage(filePath: string): Language {
    const ext = this.extractExtension(filePath);
    const language = this.extensionMap.get(ext);
    return language || Language.Unknown;
  }

  /**
   * Check if a language is supported
   */
  isSupported(language: Language): boolean {
    return this.parsers.has(language);
  }

  /**
   * Get all registered languages
   */
  getSupportedLanguages(): Language[] {
    return Array.from(this.parsers.keys());
  }

  /**
   * Extract file extension from path
   */
  private extractExtension(filePath: string): string {
    const match = filePath.match(/(\.[^.]+)$/);
    return match ? match[1].toLowerCase() : '';
  }
}
