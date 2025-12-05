import { CodeMetrics, Dependency } from '../types';
export declare class MetricsExtractor {
    extractMetrics(code: string, ast: any): CodeMetrics;
    extractDependencies(ast: any, filePath: string): Dependency[];
    private countLines;
    private calculateComplexity;
    private calculateMaintainabilityIndex;
    private traverse;
}
//# sourceMappingURL=MetricsExtractor.d.ts.map