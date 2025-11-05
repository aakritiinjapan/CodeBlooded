/**
 * Webview Manager
 * 
 * Manages webview panel for AST graph visualization
 */

import * as vscode from 'vscode';
import { generateGraphData } from '@codechroma/core';

export class WebviewManager {
  private panel: vscode.WebviewPanel | undefined;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Show webview panel
   */
  show() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    // Create new webview panel
    this.panel = vscode.window.createWebviewPanel(
      'codechromaGraph',
      'CodeChroma AST Graph',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: []
      }
    );

    // Set initial HTML content
    this.panel.webview.html = this.getWebviewContent();

    // Handle panel disposal
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'alert':
            vscode.window.showInformationMessage(message.text);
            break;
          case 'error':
            vscode.window.showErrorMessage(message.text);
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  /**
   * Update graph with new analysis results
   */
  updateGraph(analysisResult: any) {
    if (!this.panel) {
      return;
    }

    try {
      // Generate graph data from analysis result
      const graphData = generateGraphData(analysisResult);

      // Send graph data to webview
      this.panel.webview.postMessage({
        command: 'updateGraph',
        data: graphData
      });
    } catch (error) {
      console.error('Failed to update graph:', error);
      vscode.window.showErrorMessage('CodeChroma: Failed to update graph visualization');
    }
  }

  /**
   * Get webview HTML content
   */
  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeChroma AST Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #1C1C1C;
      color: #E0E0E0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
    }

    #container {
      width: 100vw;
      height: 100vh;
      position: relative;
    }

    #graph {
      width: 100%;
      height: 100%;
    }

    #info {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(28, 28, 28, 0.9);
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #444;
      max-width: 300px;
      z-index: 1000;
    }

    #info h3 {
      margin: 0 0 10px 0;
      color: #DC143C;
      font-size: 18px;
    }

    #info p {
      margin: 5px 0;
      font-size: 14px;
    }

    .node {
      cursor: pointer;
      stroke: #fff;
      stroke-width: 1.5px;
    }

    .link {
      stroke: #666;
      stroke-opacity: 0.6;
      stroke-width: 1.5px;
    }

    .node-label {
      font-size: 10px;
      fill: #E0E0E0;
      pointer-events: none;
      text-anchor: middle;
    }

    .tooltip {
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      padding: 10px;
      border-radius: 5px;
      pointer-events: none;
      font-size: 12px;
      z-index: 1001;
      display: none;
    }

    /* Horror theme effects */
    .critical-node {
      filter: drop-shadow(0 0 10px #DC143C);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .high-node {
      filter: drop-shadow(0 0 5px #CC5500);
    }

    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 24px;
      color: #DC143C;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="loading">🎭 Waiting for analysis...</div>
    <svg id="graph"></svg>
    <div id="info" style="display: none;">
      <h3>📊 Graph Info</h3>
      <p id="nodeCount">Nodes: 0</p>
      <p id="edgeCount">Edges: 0</p>
      <p id="avgComplexity">Avg Complexity: 0</p>
    </div>
    <div class="tooltip" id="tooltip"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let simulation;
    let graphData = null;

    // Listen for messages from extension
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        case 'updateGraph':
          graphData = message.data;
          renderGraph(graphData);
          break;
      }
    });

    function renderGraph(data) {
      if (!data || !data.nodes || !data.edges) {
        return;
      }

      // Hide loading message
      document.getElementById('loading').style.display = 'none';

      // Show info panel
      const info = document.getElementById('info');
      info.style.display = 'block';
      document.getElementById('nodeCount').textContent = \`Nodes: \${data.nodes.length}\`;
      document.getElementById('edgeCount').textContent = \`Edges: \${data.edges.length}\`;
      document.getElementById('avgComplexity').textContent = \`Avg Complexity: \${data.metadata?.averageComplexity?.toFixed(1) || 0}\`;

      // Clear existing graph
      const svg = d3.select('#graph');
      svg.selectAll('*').remove();

      const width = window.innerWidth;
      const height = window.innerHeight;

      svg.attr('width', width).attr('height', height);

      // Create force simulation
      simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(data.edges).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));

      // Create links
      const link = svg.append('g')
        .selectAll('line')
        .data(data.edges)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', d => Math.sqrt(d.weight || 1));

      // Create nodes
      const node = svg.append('g')
        .selectAll('circle')
        .data(data.nodes)
        .enter()
        .append('circle')
        .attr('class', d => {
          let classes = 'node';
          if (d.complexity === 'critical') classes += ' critical-node';
          else if (d.complexity === 'high') classes += ' high-node';
          return classes;
        })
        .attr('r', d => d.size || 10)
        .attr('fill', d => d.color || '#666')
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))
        .on('mouseover', showTooltip)
        .on('mouseout', hideTooltip);

      // Create labels
      const label = svg.append('g')
        .selectAll('text')
        .data(data.nodes)
        .enter()
        .append('text')
        .attr('class', 'node-label')
        .attr('dy', 25)
        .text(d => d.label);

      // Update positions on tick
      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);

        label
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      });
    }

    function showTooltip(event, d) {
      const tooltip = document.getElementById('tooltip');
      tooltip.style.display = 'block';
      tooltip.style.left = (event.pageX + 10) + 'px';
      tooltip.style.top = (event.pageY + 10) + 'px';
      tooltip.innerHTML = \`
        <strong>\${d.label}</strong><br/>
        Type: \${d.type}<br/>
        Complexity: \${d.metrics?.cyclomaticComplexity || 'N/A'}<br/>
        LOC: \${d.metrics?.codeLines || 'N/A'}
      \`;
    }

    function hideTooltip() {
      document.getElementById('tooltip').style.display = 'none';
    }

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      if (graphData) {
        renderGraph(graphData);
      }
    });
  </script>
</body>
</html>`;
  }

  /**
   * Dispose webview panel
   */
  dispose() {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
  }
}
