import { FunctionMetric } from '../types';
export declare class ComplexityCalculator {
    calculateFunctionComplexity(node: any): number;
    calculateFileComplexity(ast: any): number;
    extractFunctionMetrics(ast: any, code: string): FunctionMetric[];
    private createFunctionMetric;
    private getComplexityIncrement;
    private isFunctionNode;
    private getFunctionName;
    private getParameterCount;
    private calculateNestingDepth;
    private traverse;
}
//# sourceMappingURL=ComplexityCalculator.d.ts.map