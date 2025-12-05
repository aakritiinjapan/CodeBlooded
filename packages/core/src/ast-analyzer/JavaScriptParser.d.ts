import { Language, ParserPlugin } from '../types';
export declare class JavaScriptParser implements ParserPlugin {
    language: Language;
    extensions: string[];
    parse(code: string, filePath?: string): any;
}
//# sourceMappingURL=JavaScriptParser.d.ts.map