/**
 * Graph Data Generator
 * 
 * Converts AnalysisResult to GraphData structure for visualization.
 */

import {
  AnalysisResult,
  GraphData,
  GraphNode,
  GraphEdge,
  GraphMetadata,
  ComplexityLevel,
  FunctionMetric,
  Dependency,
} from '../types';
import { classifyComplexity, mapToVisual } from '../sensory-mapper';

/**
 * Generate graph data from analysis results
 * Creates nodes for files and functions, edges for dependencies
 */
export function generateGraphData(analysis: AnalysisResult): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create file node
  const fileComplexity = classifyComplexity(analysis.metrics.cyclomaticComplexity);
  const fileVisual = mapToVisual(analysis.metrics.cyclomaticComplexity);
  
  const fileNode: GraphNode = {
    id: `file:${analysis.file}`,
    label: getFileName(analysis.file),
    type: 'file',
    metrics: analysis.metrics,
    complexity: fileComplexity,
    color: fileVisual.color,
    size: calculateNodeSize(analysis.metrics.codeLines),
    icon: fileComplexity === ComplexityLevel.Critical ? 'skull' : 'default',
  };
  nodes.push(fileNode);

  // Create function nodes
  analysis.functions.forEach((func: FunctionMetric) => {
    const funcComplexity = classifyComplexity(func.cyclomaticComplexity);
    const funcVisual = mapToVisual(func.cyclomaticComplexity);
    
    const funcNode: GraphNode = {
      id: `func:${analysis.file}:${func.name}:${func.startLine}`,
      label: func.name,
      type: 'function',
      metrics: {
        totalLines: func.linesOfCode,
        codeLines: func.linesOfCode,
        commentLines: 0,
        cyclomaticComplexity: func.cyclomaticComplexity,
        maintainabilityIndex: 0,
      },
      complexity: funcComplexity,
      color: funcVisual.color,
      size: calculateNodeSize(func.linesOfCode),
      icon: funcComplexity === ComplexityLevel.Critical ? 'skull' : 
            (funcComplexity === ComplexityLevel.High ? 'cobweb' : 'default'),
    };
    nodes.push(funcNode);

    // Create edge from file to function
    edges.push({
      source: fileNode.id,
      target: funcNode.id,
      type: 'call',
      weight: 1,
    });
  });

  // Create dependency edges
  analysis.dependencies.forEach((dep: Dependency) => {
    const sourceId = `file:${dep.from}`;
    const targetId = `file:${dep.to}`;
    
    edges.push({
      source: sourceId,
      target: targetId,
      type: dep.type,
      weight: 1,
    });
  });

  // Calculate metadata
  const metadata = calculateMetadata(nodes, edges);

  return {
    nodes,
    edges,
    metadata,
  };
}

/**
 * Extract filename from full path
 */
function getFileName(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
}

/**
 * Calculate node size based on lines of code
 * Returns a value between 10 and 50
 */
function calculateNodeSize(linesOfCode: number): number {
  const minSize = 10;
  const maxSize = 50;
  const minLines = 1;
  const maxLines = 500;
  
  // Logarithmic scaling for better visual distribution
  const normalized = Math.log(Math.max(linesOfCode, minLines)) / Math.log(maxLines);
  const size = minSize + (maxSize - minSize) * Math.min(normalized, 1);
  
  return Math.round(size);
}

/**
 * Calculate graph metadata
 */
function calculateMetadata(nodes: GraphNode[], edges: GraphEdge[]): GraphMetadata {
  const totalNodes = nodes.length;
  const totalEdges = edges.length;
  
  // Calculate average complexity
  const complexitySum = nodes.reduce((sum, node) => {
    return sum + node.metrics.cyclomaticComplexity;
  }, 0);
  const averageComplexity = totalNodes > 0 ? complexitySum / totalNodes : 0;
  
  // Calculate health score (0-100)
  // Lower complexity = higher health score
  const healthScore = calculateHealthScore(nodes);
  
  return {
    totalNodes,
    totalEdges,
    averageComplexity: Math.round(averageComplexity * 10) / 10,
    healthScore,
  };
}

/**
 * Calculate health score based on complexity distribution
 * Returns a value between 0 and 100
 */
function calculateHealthScore(nodes: GraphNode[]): number {
  if (nodes.length === 0) return 100;
  
  let score = 100;
  
  nodes.forEach((node) => {
    const complexity = node.metrics.cyclomaticComplexity;
    const weight = node.metrics.codeLines / 100; // Weight by code size
    
    // Deduct points based on complexity level
    if (complexity >= 16) {
      score -= 20 * weight; // Critical
    } else if (complexity >= 11) {
      score -= 10 * weight; // High
    } else if (complexity >= 6) {
      score -= 5 * weight; // Medium
    }
    // Low complexity (1-5) doesn't deduct points
  });
  
  return Math.max(0, Math.min(100, Math.round(score)));
}
