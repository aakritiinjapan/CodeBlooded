import * as fs from 'fs';
import * as path from 'path';
import { AnalysisResult, generateGraphData, THEME_COLORS } from '@codechroma/core';
import { SummaryMetrics } from '../analyzer/batch-analyzer';

/**
 * Generate HTML report with embedded visualization
 */
export async function generateHTMLReport(
  results: AnalysisResult[],
  summary: SummaryMetrics,
  outputPath: string
): Promise<void> {
  const html = createHTMLTemplate(results, summary);
  await fs.promises.writeFile(outputPath, html, 'utf-8');
}

/**
 * Create HTML template with embedded CSS and JavaScript
 */
function createHTMLTemplate(results: AnalysisResult[], summary: SummaryMetrics): string {
  const graphData = results.length > 0 ? generateGraphData(results[0]) : null;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeChroma Analysis Report</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    ${getCSS()}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>☠️ CodeChroma Analysis Report</h1>
      <p class="subtitle">Horror-themed code complexity analysis</p>
    </header>

    <section class="summary">
      <h2>Summary Dashboard</h2>
      <div class="metrics-grid">
        ${createMetricCard('Total Files', summary.totalFiles)}
        ${createMetricCard('Total Functions', summary.totalFunctions)}
        ${createMetricCard('Avg Complexity', summary.averageComplexity.toFixed(2))}
        ${createMetricCard('Health Score', summary.healthScore.toFixed(1), getHealthColor(summary.healthScore))}
        ${createMetricCard('Total Lines', summary.totalLines)}
        ${createMetricCard('Code Lines', summary.totalCodeLines)}
      </div>
      ${summary.filesAboveThreshold > 0 ? `
        <div class="warning">
          ⚠️ ${summary.filesAboveThreshold} file(s) exceeded complexity threshold
        </div>
      ` : ''}
    </section>

    <section class="file-list">
      <h2>File Analysis</h2>
      <table id="fileTable">
        <thead>
          <tr>
            <th onclick="sortTable(0)">File ▼</th>
            <th onclick="sortTable(1)">Complexity ▼</th>
            <th onclick="sortTable(2)">Functions ▼</th>
            <th onclick="sortTable(3)">Lines ▼</th>
            <th onclick="sortTable(4)">Health ▼</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(createFileRow).join('')}
        </tbody>
      </table>
    </section>

    ${graphData ? `
    <section class="visualization">
      <h2>Code Structure Graph</h2>
      <div id="graph"></div>
    </section>
    ` : ''}
  </div>

  <script>
    ${getJavaScript(graphData)}
  </script>
</body>
</html>`;
}

/**
 * Get CSS styles for horror theme
 */
function getCSS(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', monospace;
      background: ${THEME_COLORS.BACKGROUND};
      color: #e0e0e0;
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem;
      background: linear-gradient(135deg, #2a0a0a 0%, #1a1a1a 100%);
      border: 2px solid ${THEME_COLORS.CRITICAL};
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(220, 20, 60, 0.3);
    }

    h1 {
      font-size: 2.5rem;
      color: ${THEME_COLORS.CRITICAL};
      text-shadow: 0 0 10px rgba(220, 20, 60, 0.5);
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #888;
      font-style: italic;
    }

    h2 {
      color: ${THEME_COLORS.HIGH};
      margin-bottom: 1.5rem;
      font-size: 1.8rem;
      text-shadow: 0 0 5px rgba(204, 85, 0, 0.3);
    }

    section {
      margin-bottom: 3rem;
      padding: 2rem;
      background: #252525;
      border: 1px solid #444;
      border-radius: 8px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .metric-card {
      background: #1a1a1a;
      padding: 1.5rem;
      border-radius: 8px;
      border: 2px solid #333;
      text-align: center;
      transition: transform 0.2s;
    }

    .metric-card:hover {
      transform: translateY(-5px);
      border-color: ${THEME_COLORS.MEDIUM};
    }

    .metric-label {
      font-size: 0.9rem;
      color: #888;
      margin-bottom: 0.5rem;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: bold;
      color: ${THEME_COLORS.MEDIUM};
    }

    .warning {
      background: rgba(220, 20, 60, 0.1);
      border: 2px solid ${THEME_COLORS.CRITICAL};
      padding: 1rem;
      border-radius: 8px;
      color: ${THEME_COLORS.CRITICAL};
      font-weight: bold;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: #1a1a1a;
    }

    th {
      background: #2a2a2a;
      padding: 1rem;
      text-align: left;
      color: ${THEME_COLORS.HIGH};
      cursor: pointer;
      user-select: none;
    }

    th:hover {
      background: #333;
    }

    td {
      padding: 0.8rem 1rem;
      border-bottom: 1px solid #333;
    }

    tr:hover {
      background: #252525;
    }

    .complexity-badge {
      display: inline-block;
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.9rem;
    }

    .complexity-low { background: ${THEME_COLORS.LOW}; color: white; }
    .complexity-medium { background: ${THEME_COLORS.MEDIUM}; color: white; }
    .complexity-high { background: ${THEME_COLORS.HIGH}; color: white; }
    .complexity-critical { background: ${THEME_COLORS.CRITICAL}; color: white; }

    #graph {
      width: 100%;
      height: 600px;
      background: #1a1a1a;
      border: 2px solid #333;
      border-radius: 8px;
    }
  `;
}

/**
 * Get JavaScript for interactive features
 */
function getJavaScript(graphData: any): string {
  return `
    // Table sorting
    let sortDirection = {};
    
    function sortTable(columnIndex) {
      const table = document.getElementById('fileTable');
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      
      sortDirection[columnIndex] = !sortDirection[columnIndex];
      const ascending = sortDirection[columnIndex];
      
      rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();
        
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return ascending ? aNum - bNum : bNum - aNum;
        }
        
        return ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      });
      
      rows.forEach(row => tbody.appendChild(row));
    }

    ${graphData ? `
    // D3.js graph visualization
    const graphData = ${JSON.stringify(graphData)};
    
    if (graphData && graphData.nodes.length > 0) {
      const width = document.getElementById('graph').clientWidth;
      const height = 600;
      
      const svg = d3.select('#graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
      
      const simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.edges).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));
      
      const link = svg.append('g')
        .selectAll('line')
        .data(graphData.edges)
        .enter()
        .append('line')
        .attr('stroke', '#666')
        .attr('stroke-width', 2);
      
      const node = svg.append('g')
        .selectAll('circle')
        .data(graphData.nodes)
        .enter()
        .append('circle')
        .attr('r', d => d.size || 10)
        .attr('fill', d => d.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));
      
      node.append('title')
        .text(d => d.label + '\\nComplexity: ' + d.complexity);
      
      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
        
        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);
      });
      
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }
    ` : ''}
  `;
}

/**
 * Create metric card HTML
 */
function createMetricCard(label: string, value: number | string, color?: string): string {
  return `
    <div class="metric-card">
      <div class="metric-label">${label}</div>
      <div class="metric-value" style="${color ? `color: ${color}` : ''}">${value}</div>
    </div>
  `;
}

/**
 * Create file row HTML
 */
function createFileRow(result: AnalysisResult): string {
  const complexity = result.metrics.cyclomaticComplexity;
  const complexityClass = getComplexityClass(complexity);
  const fileName = path.basename(result.file);
  
  return `
    <tr>
      <td title="${result.file}">${fileName}</td>
      <td><span class="complexity-badge ${complexityClass}">${complexity}</span></td>
      <td>${result.functions.length}</td>
      <td>${result.metrics.totalLines}</td>
      <td>${result.metrics.maintainabilityIndex.toFixed(1)}</td>
    </tr>
  `;
}

/**
 * Get complexity CSS class
 */
function getComplexityClass(complexity: number): string {
  if (complexity <= 5) return 'complexity-low';
  if (complexity <= 10) return 'complexity-medium';
  if (complexity <= 15) return 'complexity-high';
  return 'complexity-critical';
}

/**
 * Get health score color
 */
function getHealthColor(score: number): string {
  if (score >= 80) return THEME_COLORS.LOW;
  if (score >= 60) return THEME_COLORS.MEDIUM;
  if (score >= 40) return THEME_COLORS.HIGH;
  return THEME_COLORS.CRITICAL;
}
