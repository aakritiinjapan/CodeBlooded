/**
 * Horror-Themed Visual Effects
 * 
 * SVG filters, animations, and overlays for the horror theme.
 */

import * as d3 from 'd3';

/**
 * Add SVG filters for horror effects
 */
export function addHorrorFilters(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>): void {
  const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');

  // Ghostly glow filter
  const glowFilter = defs.append('filter')
    .attr('id', 'ghostly-glow')
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%');

  glowFilter.append('feGaussianBlur')
    .attr('in', 'SourceGraphic')
    .attr('stdDeviation', '5')
    .attr('result', 'blur');

  glowFilter.append('feColorMatrix')
    .attr('in', 'blur')
    .attr('type', 'matrix')
    .attr('values', '0 0 0 0 0.86  0 0 0 0 0.08  0 0 0 0 0.24  0 0 0 1 0')
    .attr('result', 'glow');

  const glowMerge = glowFilter.append('feMerge');
  glowMerge.append('feMergeNode').attr('in', 'glow');
  glowMerge.append('feMergeNode').attr('in', 'glow');
  glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  // Blood drip shadow filter
  const bloodFilter = defs.append('filter')
    .attr('id', 'blood-shadow')
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%');

  bloodFilter.append('feGaussianBlur')
    .attr('in', 'SourceAlpha')
    .attr('stdDeviation', '3');

  bloodFilter.append('feOffset')
    .attr('dx', '0')
    .attr('dy', '5')
    .attr('result', 'offsetblur');

  bloodFilter.append('feComponentTransfer')
    .append('feFuncA')
    .attr('type', 'linear')
    .attr('slope', '0.8');

  const bloodMerge = bloodFilter.append('feMerge');
  bloodMerge.append('feMergeNode');
  bloodMerge.append('feMergeNode').attr('in', 'SourceGraphic');
}

/**
 * Create cobweb SVG overlay for high complexity nodes
 */
export function createCobwebOverlay(
  nodeGroup: d3.Selection<SVGGElement, any, any, any>,
  size: number
): void {
  const cobwebGroup = nodeGroup.append('g')
    .attr('class', 'cobweb-overlay')
    .attr('opacity', 0.6);

  // Create radial web lines
  const numRadials = 8;
  const numCircles = 3;
  const maxRadius = size * 1.5;

  // Radial lines
  for (let i = 0; i < numRadials; i++) {
    const angle = (i * 2 * Math.PI) / numRadials;
    const x = Math.cos(angle) * maxRadius;
    const y = Math.sin(angle) * maxRadius;

    cobwebGroup.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', x)
      .attr('y2', y)
      .attr('stroke', '#666')
      .attr('stroke-width', 0.5);
  }

  // Concentric circles
  for (let i = 1; i <= numCircles; i++) {
    const radius = (maxRadius / numCircles) * i;
    
    // Create irregular circle using path
    const points: [number, number][] = [];
    for (let j = 0; j < numRadials; j++) {
      const angle = (j * 2 * Math.PI) / numRadials;
      const variation = 0.9 + Math.random() * 0.2; // Add irregularity
      const r = radius * variation;
      points.push([Math.cos(angle) * r, Math.sin(angle) * r]);
    }

    const pathData = points.map((p, idx) => 
      `${idx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`
    ).join(' ') + ' Z';

    cobwebGroup.append('path')
      .attr('d', pathData)
      .attr('fill', 'none')
      .attr('stroke', '#666')
      .attr('stroke-width', 0.5);
  }
}

/**
 * Apply blood drip animation to critical complexity nodes
 */
export function applyBloodDripAnimation(
  nodeGroup: d3.Selection<SVGGElement, any, any, any>,
  size: number
): void {
  const dripGroup = nodeGroup.append('g')
    .attr('class', 'blood-drip')
    .attr('filter', 'url(#blood-shadow)');

  // Create multiple drips
  const numDrips = 3;
  for (let i = 0; i < numDrips; i++) {
    const angle = (i * 2 * Math.PI) / numDrips;
    const startX = Math.cos(angle) * size;
    const startY = Math.sin(angle) * size;

    const drip = dripGroup.append('ellipse')
      .attr('cx', startX)
      .attr('cy', startY)
      .attr('rx', 2)
      .attr('ry', 3)
      .attr('fill', '#8B0000')
      .attr('opacity', 0.8);

    // Animate drip falling
    function animateDrip() {
      drip
        .attr('cy', startY)
        .attr('ry', 3)
        .transition()
        .duration(2000 + Math.random() * 1000)
        .ease(d3.easeQuadIn)
        .attr('cy', startY + size * 2)
        .attr('ry', 8)
        .attr('opacity', 0)
        .on('end', () => {
          // Reset and repeat
          setTimeout(animateDrip, Math.random() * 2000);
        });
    }

    // Start with random delay
    setTimeout(animateDrip, Math.random() * 2000);
  }
}

/**
 * Apply ghostly glow effect for error states
 */
export function applyGhostlyGlow(
  nodeGroup: d3.Selection<SVGGElement, any, any, any>
): void {
  nodeGroup.select('circle, path')
    .attr('filter', 'url(#ghostly-glow)');

  // Pulsing animation
  function pulse() {
    nodeGroup.select('circle, path')
      .transition()
      .duration(1000)
      .attr('opacity', 0.5)
      .transition()
      .duration(1000)
      .attr('opacity', 1)
      .on('end', pulse);
  }

  pulse();
}

/**
 * Create skull icon path
 */
export function createSkullPath(size: number): string {
  const scale = size / 15;
  // Skull SVG path (scaled)
  return `M0,${-15 * scale} C${-8 * scale},${-15 * scale} ${-15 * scale},${-8 * scale} ${-15 * scale},0 C${-15 * scale},${5 * scale} ${-12 * scale},${9 * scale} ${-8 * scale},${11 * scale} L${-8 * scale},${15 * scale} L${-3 * scale},${15 * scale} L${-3 * scale},${12 * scale} L${3 * scale},${12 * scale} L${3 * scale},${15 * scale} L${8 * scale},${15 * scale} L${8 * scale},${11 * scale} C${12 * scale},${9 * scale} ${15 * scale},${5 * scale} ${15 * scale},0 C${15 * scale},${-8 * scale} ${8 * scale},${-15 * scale} 0,${-15 * scale} Z M${-6 * scale},${-5 * scale} C${-6 * scale},${-7 * scale} ${-5 * scale},${-8 * scale} ${-3 * scale},${-8 * scale} C${-1 * scale},${-8 * scale} 0,${-7 * scale} 0,${-5 * scale} C0,${-3 * scale} ${-1 * scale},${-2 * scale} ${-3 * scale},${-2 * scale} C${-5 * scale},${-2 * scale} ${-6 * scale},${-3 * scale} ${-6 * scale},${-5 * scale} Z M${6 * scale},${-5 * scale} C${6 * scale},${-7 * scale} ${7 * scale},${-8 * scale} ${9 * scale},${-8 * scale} C${11 * scale},${-8 * scale} ${12 * scale},${-7 * scale} ${12 * scale},${-5 * scale} C${12 * scale},${-3 * scale} ${11 * scale},${-2 * scale} ${9 * scale},${-2 * scale} C${7 * scale},${-2 * scale} ${6 * scale},${-3 * scale} ${6 * scale},${-5 * scale} Z`;
}

/**
 * Apply horror effects based on node complexity
 */
export function applyHorrorEffects(
  nodeGroup: d3.Selection<SVGGElement, any, any, any>,
  node: any,
  isError: boolean = false
): void {
  if (isError) {
    applyGhostlyGlow(nodeGroup);
    return;
  }

  // Apply effects based on complexity
  if (node.complexity === 'critical') {
    applyBloodDripAnimation(nodeGroup, node.size);
  }

  if (node.complexity === 'high' || node.complexity === 'critical') {
    createCobwebOverlay(nodeGroup, node.size);
  }
}
