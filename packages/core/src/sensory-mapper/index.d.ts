import { ComplexityLevel, AudioMapping, VisualMapping, ThemeMapping, Animation } from '../types';
export declare function classifyComplexity(complexity: number): ComplexityLevel;
export declare function mapToAudio(complexity: number): AudioMapping;
export declare function mapToVisual(complexity: number): VisualMapping;
export declare function mapToAnimations(complexity: number): Animation[];
export declare function mapToTheme(complexity: number): ThemeMapping;
export declare function mapToCombinedTheme(complexity: number, diagnosticScore: number, diagnosticSeverity: 'none' | 'info' | 'warning' | 'error' | 'critical'): ThemeMapping;
export declare function mapErrorToAudio(): AudioMapping;
export declare function mapSuccessToAudio(): AudioMapping;
export declare function mapErrorToAnimation(): Animation;
export declare class SensoryMapper {
    classifyComplexity(complexity: number): ComplexityLevel;
    mapToAudio(complexity: number): AudioMapping;
    mapToVisual(complexity: number): VisualMapping;
    mapToTheme(complexity: number): ThemeMapping;
    mapToCombinedTheme(complexity: number, diagnosticScore: number, diagnosticSeverity: 'none' | 'info' | 'warning' | 'error' | 'critical'): ThemeMapping;
    mapErrorToAudio(): AudioMapping;
    mapSuccessToAudio(): AudioMapping;
    mapErrorToAnimation(): Animation;
}
//# sourceMappingURL=index.d.ts.map