/**
 * Fog Particle System
 * 
 * Canvas-based particle system with Perlin noise for organic fog movement.
 */

/**
 * Simple Perlin noise implementation
 */
class PerlinNoise {
  private permutation: number[];

  constructor(seed: number = 0) {
    // Initialize permutation table
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    // Shuffle using seed
    const random = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }

    // Duplicate for wrapping
    this.permutation = [...this.permutation, ...this.permutation];
  }

  private seededRandom(seed: number): () => number {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const a = this.permutation[X] + Y;
    const b = this.permutation[X + 1] + Y;

    return this.lerp(
      this.lerp(
        this.grad(this.permutation[a], x, y),
        this.grad(this.permutation[b], x - 1, y),
        u
      ),
      this.lerp(
        this.grad(this.permutation[a + 1], x, y - 1),
        this.grad(this.permutation[b + 1], x - 1, y - 1),
        u
      ),
      v
    );
  }
}

/**
 * Fog particle
 */
interface FogParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  noiseOffsetX: number;
  noiseOffsetY: number;
}

/**
 * Fog Particle System
 */
export class FogParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: FogParticle[] = [];
  private perlin: PerlinNoise;
  private animationId: number | null = null;
  private time: number = 0;
  private isRunning: boolean = false;

  constructor(
    container: HTMLElement,
    private particleCount: number = 50,
    private width: number = 800,
    private height: number = 600
  ) {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '0';
    container.style.position = 'relative';
    container.insertBefore(this.canvas, container.firstChild);

    this.ctx = this.canvas.getContext('2d')!;
    this.perlin = new PerlinNoise(Math.random() * 1000);

    this.initParticles();
  }

  /**
   * Initialize fog particles
   */
  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 30 + Math.random() * 70,
        opacity: 0.1 + Math.random() * 0.2,
        noiseOffsetX: Math.random() * 1000,
        noiseOffsetY: Math.random() * 1000,
      });
    }
  }

  /**
   * Start animation
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  /**
   * Stop animation
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    this.time += 0.005;
    this.update();
    this.render();

    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * Update particle positions
   */
  private update(): void {
    this.particles.forEach(particle => {
      // Apply Perlin noise for organic movement
      const noiseX = this.perlin.noise(
        particle.noiseOffsetX + this.time,
        particle.noiseOffsetY
      );
      const noiseY = this.perlin.noise(
        particle.noiseOffsetX,
        particle.noiseOffsetY + this.time
      );

      // Update velocity based on noise
      particle.vx += noiseX * 0.1;
      particle.vy += noiseY * 0.1;

      // Apply damping
      particle.vx *= 0.95;
      particle.vy *= 0.95;

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Wrap around edges
      if (particle.x < -particle.size) particle.x = this.width + particle.size;
      if (particle.x > this.width + particle.size) particle.x = -particle.size;
      if (particle.y < -particle.size) particle.y = this.height + particle.size;
      if (particle.y > this.height + particle.size) particle.y = -particle.size;
    });
  }

  /**
   * Render particles
   */
  private render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw particles
    this.particles.forEach(particle => {
      // Create radial gradient for fog effect
      const gradient = this.ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      );

      gradient.addColorStop(0, `rgba(200, 200, 200, ${particle.opacity})`);
      gradient.addColorStop(0.5, `rgba(150, 150, 150, ${particle.opacity * 0.5})`);
      gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stop();
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
