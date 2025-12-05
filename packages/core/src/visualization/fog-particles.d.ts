export declare class FogParticleSystem {
    private particleCount;
    private width;
    private height;
    private canvas;
    private ctx;
    private particles;
    private perlin;
    private animationId;
    private time;
    private isRunning;
    constructor(container: HTMLElement, particleCount?: number, width?: number, height?: number);
    private initParticles;
    start(): void;
    stop(): void;
    private animate;
    private update;
    private render;
    resize(width: number, height: number): void;
    dispose(): void;
}
//# sourceMappingURL=fog-particles.d.ts.map