import { ParseResult, AnalysisResult } from '../types';
import { ParserRegistry } from './ParserRegistry';
export declare class ASTAnalyzer {
    private registry;
    private complexityCalculator;
    private metricsExtractor;
    constructor();
    parse(code: string, filePath: string): Promise<ParseResult>;
    analyze(parseResult: ParseResult, code: string, filePath: string): AnalysisResult;
    analyzeFile(code: string, filePath: string): Promise<AnalysisResult>;
    getRegistry(): ParserRegistry;
}
//# sourceMappingURL=ASTAnalyzer.d.ts.map