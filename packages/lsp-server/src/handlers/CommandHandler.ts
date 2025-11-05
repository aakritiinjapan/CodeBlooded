/**
 * Command Handler
 *
 * Handles custom LSP commands for CodeChroma.
 * Provides commands for audio playback, graph visualization, and file analysis.
 */

import {
  Connection,
  ExecuteCommandParams,
} from 'vscode-languageserver/node';
import { DocumentAnalyzer } from './DocumentAnalyzer';
import { SensoryMapper, AudioEngine } from '@codechroma/core';
import type { AnalysisResult } from '@codechroma/core';

/**
 * Command Handler class
 */
export class CommandHandler {
  private connection: Connection;
  private documentAnalyzer: DocumentAnalyzer;
  private sensoryMapper: SensoryMapper;
  private audioEngine: AudioEngine | null = null;

  constructor(connection: Connection, documentAnalyzer: DocumentAnalyzer) {
    this.connection = connection;
    this.documentAnalyzer = documentAnalyzer;
    this.sensoryMapper = new SensoryMapper();

    // Initialize audio engine (may not be available in all environments)
    this.initializeAudioEngine();

    // Register command handler
    this.connection.onExecuteCommand(this.handleCommand.bind(this));
  }

  /**
   * Initialize audio engine
   */
  private async initializeAudioEngine(): Promise<void> {
    try {
      this.audioEngine = new AudioEngine();
      await this.audioEngine.initialize();
      this.connection.console.log('Audio engine initialized');
    } catch (error) {
      this.connection.console.warn(
        `Audio engine not available: ${error instanceof Error ? error.message : String(error)}`
      );
      this.audioEngine = null;
    }
  }

  /**
   * Handle command execution requests
   */
  private async handleCommand(
    params: ExecuteCommandParams
  ): Promise<any> {
    this.connection.console.log(`Executing command: ${params.command}`);

    try {
      switch (params.command) {
        case 'codechroma.playAudio':
          return await this.handlePlayAudio(params.arguments);

        case 'codechroma.showGraph':
          return await this.handleShowGraph(params.arguments);

        case 'codechroma.analyzeFile':
          return await this.handleAnalyzeFile(params.arguments);

        default:
          this.connection.console.warn(`Unknown command: ${params.command}`);
          return { error: `Unknown command: ${params.command}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.connection.console.error(
        `Error executing command ${params.command}: ${errorMessage}`
      );
      return { error: errorMessage };
    }
  }

  /**
   * Handle playAudio command
   * Plays audio feedback for a document's complexity
   */
  private async handlePlayAudio(args?: any[]): Promise<any> {
    if (!args || args.length === 0) {
      return { error: 'Missing document URI argument' };
    }

    const uri = args[0] as string;
    const analysisResult = this.documentAnalyzer.getCachedAnalysis(uri);

    if (!analysisResult) {
      return { error: 'No analysis available for document' };
    }

    if (!this.audioEngine) {
      return { error: 'Audio engine not available' };
    }

    try {
      // Get audio mapping for file complexity
      const complexity = analysisResult.metrics.cyclomaticComplexity;
      const audioMapping = this.sensoryMapper.mapToAudio(complexity);

      // Play audio
      await this.audioEngine.play(audioMapping);

      this.connection.console.log(
        `Playing audio for ${uri}: frequency ${audioMapping.frequency}Hz, complexity ${complexity}`
      );

      return {
        success: true,
        complexity,
        frequency: audioMapping.frequency,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: `Failed to play audio: ${errorMessage}` };
    }
  }

  /**
   * Handle showGraph command
   * Returns graph data for visualization
   */
  private async handleShowGraph(args?: any[]): Promise<any> {
    if (!args || args.length === 0) {
      return { error: 'Missing document URI argument' };
    }

    const uri = args[0] as string;
    const analysisResult = this.documentAnalyzer.getCachedAnalysis(uri);

    if (!analysisResult) {
      return { error: 'No analysis available for document' };
    }

    try {
      // Generate graph data from analysis result
      const graphData = this.generateGraphData(analysisResult);

      this.connection.console.log(
        `Generated graph data for ${uri}: ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`
      );

      return {
        success: true,
        graphData,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: `Failed to generate graph: ${errorMessage}` };
    }
  }

  /**
   * Handle analyzeFile command
   * Returns analysis result for a document
   */
  private async handleAnalyzeFile(args?: any[]): Promise<any> {
    if (!args || args.length === 0) {
      return { error: 'Missing document URI argument' };
    }

    const uri = args[0] as string;
    const analysisResult = this.documentAnalyzer.getCachedAnalysis(uri);

    if (!analysisResult) {
      return { error: 'No analysis available for document' };
    }

    this.connection.console.log(
      `Returning analysis for ${uri}: ${analysisResult.functions.length} functions`
    );

    return {
      success: true,
      analysis: analysisResult,
    };
  }

  /**
   * Generate graph data from analysis result
   */
  private generateGraphData(analysisResult: AnalysisResult): any {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Create file node
    const fileComplexity = analysisResult.metrics.cyclomaticComplexity;
    const fileVisualMapping = this.sensoryMapper.mapToVisual(fileComplexity);

    nodes.push({
      id: analysisResult.file,
      label: analysisResult.file.split('/').pop() || analysisResult.file,
      type: 'file',
      complexity: fileComplexity,
      color: fileVisualMapping.color,
      size: analysisResult.metrics.codeLines,
    });

    // Create function nodes
    for (const func of analysisResult.functions) {
      const funcId = `${analysisResult.file}:${func.name}:${func.startLine}`;
      const visualMapping = this.sensoryMapper.mapToVisual(func.cyclomaticComplexity);

      nodes.push({
        id: funcId,
        label: func.name || 'anonymous',
        type: 'function',
        complexity: func.cyclomaticComplexity,
        color: visualMapping.color,
        size: func.linesOfCode,
        startLine: func.startLine,
        endLine: func.endLine,
      });

      // Create edge from file to function
      edges.push({
        source: analysisResult.file,
        target: funcId,
        type: 'contains',
      });
    }

    // Create dependency edges
    for (const dep of analysisResult.dependencies) {
      edges.push({
        source: dep.from,
        target: dep.to,
        type: dep.type,
      });
    }

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        averageComplexity: analysisResult.metrics.cyclomaticComplexity,
        healthScore: this.calculateHealthScore(analysisResult),
      },
    };
  }

  /**
   * Calculate health score from analysis result
   */
  private calculateHealthScore(analysisResult: AnalysisResult): number {
    // Simple health score calculation (0-100)
    // Lower complexity = higher score
    const avgComplexity = analysisResult.metrics.cyclomaticComplexity;
    
    // Map complexity to score (inverse relationship)
    // 0-5: 100-90, 6-10: 89-70, 11-15: 69-50, 16+: 49-0
    let score = 100;
    
    if (avgComplexity <= 5) {
      score = 100 - (avgComplexity * 2);
    } else if (avgComplexity <= 10) {
      score = 90 - ((avgComplexity - 5) * 4);
    } else if (avgComplexity <= 15) {
      score = 70 - ((avgComplexity - 10) * 4);
    } else {
      score = Math.max(0, 50 - ((avgComplexity - 15) * 3));
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }
}
