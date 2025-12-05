/**
 * D3.js Force-Directed Graph Renderer
 * 
 * Renders graph data using D3.js force simulation with zoom and pan controls.
 */

import * as d3 from 'd3';
import {
  GraphData,
  GraphNode,
  VisualizationConfig,
  Animation,
} from '../types';
import {
  addHorrorFilters,
  applyHorrorEffects,
  createSkullPath,
} from './horror-effects';
import { FogParticleSystem } from './fog-particles';

// Default configuration
const DEFAULT_CONFIG: VisualizationConfig = {
  width: 800,
  height: 600,
  forceConfig: {
    charge: -300,
    linkDistance: 100,
    centerForce: 0.1,
    collisionRadius: 30,
  },
  enableAnimations: true,
  theme: 'horror',
};

// D3 simulation node type (extends GraphNode with position)
export interface SimulationNode extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

// D3 simulation link type
interface SimulationLink {
  source: SimulationNode | string;
  target: SimulationNode | string;
  type: 'import' | 'call' | 'inheritance';
  weight: number;
}

/**
 * D3.js Graph Renderer
 */
export class D3Renderer {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private simulation: d3.Simulation<SimulationNode, SimulationLink> | null = null;
  private config: VisualizationConfig;
  private nodeAnimations: Map<string, Animation> = new Map();
  private tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null = null;
  private highlightedNodes: Set<string> = new Set();
  private fogSystem: FogParticleSystem | null = null;

  constructor(config?: Partial<VisualizationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Render graph in the specified container
   */
  renderGraph(container: HTMLElement, data: GraphData, config?: Partial<VisualizationConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.cleanup();

    // Create fog particle system if horror theme is enabled
    if (this.config.theme === 'horror' && this.config.enableAnimations) {
      this.fogSystem = new FogParticleSystem(container, 50, this.config.width, this.config.height);
      this.fogSystem.start();
    }

    // Create tooltip
    this.createTooltip(container);

    // Create SVG
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height)
      .attr('viewBox', [0, 0, this.config.width, this.config.height])
      .style('background-color', '#1C1C1C'); // Eerie Black

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    this.svg.call(zoom);

    // Create container group for zoom/pan
    const g = this.svg.append('g');

    // Add horror-themed filters if enabled
    if (this.config.theme === 'horror') {
      addHorrorFilters(this.svg);
    }

    // Define arrow markers for edges
    this.svg.append('defs').selectAll('marker')
      .data(['import', 'call', 'inheritance'])
      .join('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666');

    // Create force simulation
    const nodes: SimulationNode[] = data.nodes.map(n => ({ ...n }));
    const links: SimulationLink[] = data.edges.map(e => ({ ...e }));

    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(links)
        .id(d => d.id)
        .distance(this.config.forceConfig.linkDistance))
      .force('charge', d3.forceManyBody().strength(this.config.forceConfig.charge))
      .force('center', d3.forceCenter(this.config.width / 2, this.config.height / 2)
        .strength(this.config.forceConfig.centerForce))
      .force('collision', d3.forceCollide().radius(this.config.forceConfig.collisionRadius));

    // Create edges
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#666')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(this.createDragBehavior() as any);

    // Add node circles or icons
    node.each((d, i, nodeElements) => {
      const element = nodeElements[i];
      const nodeGroup = d3.select(element as SVGGElement);
      
      if (d.icon === 'skull') {
        this.addSkullIcon(nodeGroup as any, d);
      } else {
        nodeGroup.append('circle')
          .attr('r', d.size)
          .attr('fill', d.color)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);
      }

      // Apply horror effects if theme is enabled
      if (this.config.theme === 'horror' && this.config.enableAnimations) {
        applyHorrorEffects(nodeGroup as any, d, false);
      }
    });

    // Add node labels
    node.append('text')
      .text(d => d.label)
      .attr('x', 0)
      .attr('y', d => d.size + 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('font-family', 'monospace');

    // Add interactive features
    this.addInteractiveFeatures(node as any, link as any, nodes, links);

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as SimulationNode).x!)
        .attr('y1', d => (d.source as SimulationNode).y!)
        .attr('x2', d => (d.target as SimulationNode).x!)
        .attr('y2', d => (d.target as SimulationNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }

  /**
   * Create drag behavior for nodes
   */
  private createDragBehavior(): d3.DragBehavior<Element, SimulationNode, SimulationNode> {
    const self = this;
    
    function dragstarted(event: d3.D3DragEvent<Element, SimulationNode, SimulationNode>) {
      if (!event.active && self.simulation) {
        self.simulation.alphaTarget(0.3).restart();
      }
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<Element, SimulationNode, SimulationNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<Element, SimulationNode, SimulationNode>) {
      if (!event.active && self.simulation) {
        self.simulation.alphaTarget(0);
      }
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag<Element, SimulationNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended) as any;
  }

  /**
   * Add skull icon for critical complexity nodes
   */
  private addSkullIcon(nodeGroup: d3.Selection<d3.BaseType, SimulationNode, SVGGElement, unknown>, node: SimulationNode): void {
    nodeGroup.append('path')
      .attr('d', createSkullPath(node.size))
      .attr('fill', node.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
  }

  /**
   * Add animation to a specific node
   */
  addAnimation(nodeId: string, animation: Animation): void {
    this.nodeAnimations.set(nodeId, animation);
    
    if (!this.svg) return;

    const nodeElement = this.svg.select(`g.node[data-id="${nodeId}"]`);
    if (nodeElement.empty()) return;

    // Apply animation based on type
    switch (animation.type) {
      case 'pulse':
        this.applyPulseAnimation(nodeElement, animation);
        break;
      case 'glow':
        this.applyGlowAnimation(nodeElement, animation);
        break;
      // Other animations will be added in task 5.5
    }
  }

  /**
   * Apply pulse animation
   */
  private applyPulseAnimation(element: d3.Selection<d3.BaseType, unknown, null, undefined>, animation: Animation): void {
    element.select('circle, path')
      .transition()
      .duration(animation.duration)
      .attr('opacity', 0.5)
      .transition()
      .duration(animation.duration)
      .attr('opacity', 1)
      .on('end', function repeat() {
        d3.select(this)
          .transition()
          .duration(animation.duration)
          .attr('opacity', 0.5)
          .transition()
          .duration(animation.duration)
          .attr('opacity', 1)
          .on('end', repeat);
      });
  }

  /**
   * Apply glow animation
   */
  private applyGlowAnimation(element: d3.Selection<d3.BaseType, unknown, null, undefined>, _animation: Animation): void {
    element.select('circle, path')
      .style('filter', 'drop-shadow(0 0 10px rgba(220, 20, 60, 0.8))');
  }

  /**
   * Create tooltip element
   */
  private createTooltip(container: HTMLElement): void {
    this.tooltip = d3.select(container)
      .append('div')
      .attr('class', 'codeblooded-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#fff')
      .style('padding', '10px')
      .style('border-radius', '5px')
      .style('border', '1px solid #666')
      .style('font-family', 'monospace')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('max-width', '300px');
  }

  /**
   * Add interactive features to nodes
   */
  private addInteractiveFeatures(
    node: d3.Selection<SVGGElement, SimulationNode, SVGGElement, unknown>,
    link: d3.Selection<SVGLineElement, SimulationLink, SVGGElement, unknown>,
    _nodes: SimulationNode[],
    links: SimulationLink[]
  ): void {
    const self = this;

    // Hover tooltips
    node
      .on('mouseover', function(event, d) {
        self.showTooltip(event, d);
        // Highlight node
        d3.select(this).select('circle, path')
          .attr('stroke-width', 4)
          .attr('stroke', '#FFD700');
      })
      .on('mousemove', function(event) {
        self.moveTooltip(event);
      })
      .on('mouseout', function(_event, d) {
        self.hideTooltip();
        // Remove highlight if not clicked
        if (!self.highlightedNodes.has(d.id)) {
          d3.select(this).select('circle, path')
            .attr('stroke-width', 2)
            .attr('stroke', '#fff');
        }
      });

    // Click to highlight connected nodes
    node.on('click', function(event, d) {
      event.stopPropagation();
      self.highlightConnectedNodes(d, node, link, links);
    });

    // Click on background to clear highlights
    if (this.svg) {
      this.svg.on('click', () => {
        this.clearHighlights(node, link);
      });
    }
  }

  /**
   * Show tooltip with node details
   */
  private showTooltip(event: MouseEvent, node: SimulationNode): void {
    if (!this.tooltip) return;

    const metrics = node.metrics;
    const tooltipContent = `
      <strong>${node.label}</strong><br/>
      Type: ${node.type}<br/>
      Complexity: ${node.complexity} (${metrics.cyclomaticComplexity})<br/>
      Lines of Code: ${metrics.codeLines}<br/>
      Total Lines: ${metrics.totalLines}<br/>
      ${metrics.maintainabilityIndex > 0 ? `Maintainability: ${metrics.maintainabilityIndex.toFixed(1)}<br/>` : ''}
    `;

    this.tooltip
      .html(tooltipContent)
      .style('visibility', 'visible');

    this.moveTooltip(event);
  }

  /**
   * Move tooltip to follow cursor
   */
  private moveTooltip(event: MouseEvent): void {
    if (!this.tooltip) return;

    this.tooltip
      .style('top', (event.pageY - 10) + 'px')
      .style('left', (event.pageX + 10) + 'px');
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    if (!this.tooltip) return;

    this.tooltip.style('visibility', 'hidden');
  }

  /**
   * Highlight connected nodes
   */
  private highlightConnectedNodes(
    clickedNode: SimulationNode,
    allNodes: d3.Selection<SVGGElement, SimulationNode, SVGGElement, unknown>,
    allLinks: d3.Selection<SVGLineElement, SimulationLink, SVGGElement, unknown>,
    links: SimulationLink[]
  ): void {
    // Find connected node IDs
    const connectedIds = new Set<string>();
    connectedIds.add(clickedNode.id);

    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;

      if (sourceId === clickedNode.id) {
        connectedIds.add(targetId);
      }
      if (targetId === clickedNode.id) {
        connectedIds.add(sourceId);
      }
    });

    this.highlightedNodes = connectedIds;

    // Dim non-connected nodes
    allNodes.each(function(d) {
      const isConnected = connectedIds.has(d.id);
      d3.select(this)
        .style('opacity', isConnected ? 1 : 0.2)
        .select('circle, path')
        .attr('stroke-width', isConnected ? 4 : 2)
        .attr('stroke', isConnected ? '#FFD700' : '#fff');
    });

    // Dim non-connected links
    allLinks.each(function(d) {
      const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
      const targetId = typeof d.target === 'string' ? d.target : d.target.id;
      const isConnected = connectedIds.has(sourceId) && connectedIds.has(targetId);

      d3.select(this)
        .style('opacity', isConnected ? 1 : 0.1)
        .attr('stroke-width', isConnected ? 3 : 2);
    });
  }

  /**
   * Clear all highlights
   */
  private clearHighlights(
    allNodes: d3.Selection<SVGGElement, SimulationNode, SVGGElement, unknown>,
    allLinks: d3.Selection<SVGLineElement, SimulationLink, SVGGElement, unknown>
  ): void {
    this.highlightedNodes.clear();

    allNodes
      .style('opacity', 1)
      .select('circle, path')
      .attr('stroke-width', 2)
      .attr('stroke', '#fff');

    allLinks
      .style('opacity', 0.6)
      .attr('stroke-width', 2);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
    if (this.svg) {
      this.svg.remove();
      this.svg = null;
    }
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    this.nodeAnimations.clear();
    this.highlightedNodes.clear();
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.cleanup();
    if (this.fogSystem) {
      this.fogSystem.dispose();
      this.fogSystem = null;
    }
  }
}
