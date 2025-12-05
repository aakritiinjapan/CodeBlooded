/**
 * Status Bar Manager
 * 
 * Manages status bar items for health score and audio state
 */

import * as vscode from 'vscode';

export class StatusBarManager {
  private healthScoreItem: vscode.StatusBarItem;
  private audioStateItem: vscode.StatusBarItem;
  private audioToggleCallback?: () => void;

  constructor() {
    // Create health score status bar item (left side)
    this.healthScoreItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.healthScoreItem.text = '$(pulse) codeblooded: --';
    this.healthScoreItem.tooltip = 'Code health score';

    // Create audio state status bar item (right side)
    this.audioStateItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.audioStateItem.command = 'codeblooded.toggleAudio';
    this.updateAudioState(true); // Default enabled
  }

  /**
   * Update health score display
   */
  updateHealthScore(score: number) {
    const grade = this.getHealthGrade(score);
    const icon = this.getHealthIcon(score);
    const color = this.getHealthColor(score);

    this.healthScoreItem.text = `${icon} codeblooded: ${score.toFixed(0)} (${grade})`;
    this.healthScoreItem.tooltip = `Code Health Score: ${score.toFixed(1)}/100\nGrade: ${grade}\n\nClick to view details`;
    this.healthScoreItem.backgroundColor = score < 50 
      ? new vscode.ThemeColor('statusBarItem.errorBackground')
      : score < 70
      ? new vscode.ThemeColor('statusBarItem.warningBackground')
      : undefined;
  }

  /**
   * Update audio state display
   */
  updateAudioState(enabled: boolean) {
    if (enabled) {
      this.audioStateItem.text = '$(unmute) Audio';
      this.audioStateItem.tooltip = 'Audio feedback enabled\nClick to disable';
      this.audioStateItem.backgroundColor = undefined;
    } else {
      this.audioStateItem.text = '$(mute) Audio';
      this.audioStateItem.tooltip = 'Audio feedback disabled\nClick to enable';
      this.audioStateItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
  }

  /**
   * Set audio status (alias for updateAudioState for consistency)
   */
  setAudioStatus(enabled: boolean) {
    this.updateAudioState(enabled);
  }

  /**
   * Register callback for audio toggle click
   */
  onAudioToggleClick(callback: () => void) {
    this.audioToggleCallback = callback;
  }

  /**
   * Show status bar items
   */
  show() {
    this.healthScoreItem.show();
    this.audioStateItem.show();
  }

  /**
   * Hide status bar items
   */
  hide() {
    this.healthScoreItem.hide();
    this.audioStateItem.hide();
  }

  /**
   * Get health grade letter
   */
  private getHealthGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get health icon based on score
   */
  private getHealthIcon(score: number): string {
    if (score >= 90) return '$(check)';
    if (score >= 70) return '$(info)';
    if (score >= 50) return '$(warning)';
    return '$(error)';
  }

  /**
   * Get health color based on score
   */
  private getHealthColor(score: number): string {
    if (score >= 90) return '#00FF00'; // Green
    if (score >= 70) return '#FFFF00'; // Yellow
    if (score >= 50) return '#FFA500'; // Orange
    return '#FF0000'; // Red
  }

  /**
   * Dispose status bar items
   */
  dispose() {
    this.healthScoreItem.dispose();
    this.audioStateItem.dispose();
  }
}
