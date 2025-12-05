import { Language, ParserPlugin, AnalysisResult, FunctionMetric, CodeMetrics } from '../types';
export declare class PythonParser implements ParserPlugin {
    language: Language;
    extensions: string[];
    parse(code: string, filePath?: string): any;
    private detectSyntaxErrors;
    extractFunctionMetrics(code: string): FunctionMetric[];
    private estimateComplexity;
    private estimateNestingDepth;
    calculateMetrics(code: string): CodeMetrics;
    analyze(code: string, filePath?: string): AnalysisResult;
}
//# sourceMappingURL=PythonParser.d.ts.map