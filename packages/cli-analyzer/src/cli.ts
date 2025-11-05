#!/usr/bin/env node

import { Command } from 'commander';
import { VERSION } from '@codechroma/core';
import { analyzeCommand } from './commands/analyze';

const program = new Command();

program
  .name('codechroma')
  .description('Multi-sensory code analysis framework with horror-themed audio-visual feedback')
  .version(VERSION);

program
  .command('analyze')
  .description('Analyze source code files for complexity metrics')
  .argument('<path>', 'Path to file or directory to analyze')
  .option('-r, --recursive', 'Recursively analyze all files in directory', false)
  .option('-t, --threshold <number>', 'Complexity threshold for CI/CD (exit with error if exceeded)', parseFloat)
  .option('-o, --output <path>', 'Output path for report')
  .option('-f, --format <type>', 'Output format: html, json, or text', 'text')
  .option('--export-audio', 'Export audio signatures as WAV files', false)
  .option('--audio-path <path>', 'Directory path for audio exports', './audio')
  .action(analyzeCommand);

program.parse();
