import { Language, ParserPlugin } from '../types';
export declare class TypeScriptParser implements ParserPlugin {
    language: Language;
    extensions: string[];
    parse(code: string, filePath?: string): any;
}
//# sourceMappingURL=TypeScriptParser.d.ts.map