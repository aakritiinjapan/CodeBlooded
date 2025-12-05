import { Language, ParserPlugin } from '../types';
export declare class ParserRegistry {
    private parsers;
    private extensionMap;
    register(plugin: ParserPlugin): void;
    getParser(language: Language): ParserPlugin;
    detectLanguage(filePath: string): Language;
    isSupported(language: Language): boolean;
    getSupportedLanguages(): Language[];
    private extractExtension;
}
//# sourceMappingURL=ParserRegistry.d.ts.map