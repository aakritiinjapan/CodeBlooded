import { GraphData, GraphNode, VisualizationConfig, Animation } from '../types';
export interface SimulationNode extends GraphNode {
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}
export declare class D3Renderer {
    private svg;
    private simulation;
    private config;
    private nodeAnimations;
    private tooltip;
    private highlightedNodes;
    private fogSystem;
    constructor(config?: Partial<VisualizationConfig>);
    renderGraph(container: HTMLElement, data: GraphData, config?: Partial<VisualizationConfig>): void;
    private createDragBehavior;
    private addSkullIcon;
    addAnimation(nodeId: string, animation: Animation): void;
    private applyPulseAnimation;
    private applyGlowAnimation;
    private createTooltip;
    private addInteractiveFeatures;
    private showTooltip;
    private moveTooltip;
    private hideTooltip;
    private highlightConnectedNodes;
    private clearHighlights;
    cleanup(): void;
    dispose(): void;
}
//# sourceMappingURL=d3-renderer.d.ts.map