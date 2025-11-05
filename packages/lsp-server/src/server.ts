#!/usr/bin/env node

/**
 * CodeChroma LSP Server
 *
 * Language Server Protocol implementation providing IDE-agnostic
 * code analysis integration with real-time diagnostics and code actions.
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  DidChangeConfigurationNotification,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { DocumentAnalyzer } from './handlers/DocumentAnalyzer';
import { DiagnosticsProvider } from './handlers/DiagnosticsProvider';
import { CodeActionProvider } from './handlers/CodeActionProvider';
import { CommandHandler } from './handlers/CommandHandler';

// Create LSP connection using Node IPC
const connection = createConnection(ProposedFeatures.all);

// Create text document manager
const documents = new TextDocuments(TextDocument);

// Initialize handlers
let documentAnalyzer: DocumentAnalyzer;
let diagnosticsProvider: DiagnosticsProvider;
// @ts-ignore - Used for side effects (registers handlers with connection)
let codeActionProvider: CodeActionProvider;
// @ts-ignore - Used for side effects (registers handlers with connection)
let commandHandler: CommandHandler;

// Configuration
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

/**
 * Initialize handler - called when client connects
 */
connection.onInitialize((params: InitializeParams): InitializeResult => {
  const capabilities = params.capabilities;

  // Check if client supports configuration
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );

  // Check if client supports workspace folders
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  connection.console.log('CodeChroma LSP Server initializing...');

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: {
        openClose: true,
        change: TextDocumentSyncKind.Incremental,
      },
      // Provide diagnostics
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false,
      },
      // Provide code actions
      codeActionProvider: {
        codeActionKinds: [
          'quickfix',
          'refactor',
          'refactor.extract',
          'refactor.rewrite',
        ],
      },
      // Execute commands
      executeCommandProvider: {
        commands: [
          'codechroma.playAudio',
          'codechroma.showGraph',
          'codechroma.analyzeFile',
        ],
      },
    },
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }

  return result;
});

/**
 * Initialized handler - called after initialize response
 */
connection.onInitialized(() => {
  connection.console.log('CodeChroma LSP Server initialized');

  // Initialize handlers
  documentAnalyzer = new DocumentAnalyzer(connection);
  diagnosticsProvider = new DiagnosticsProvider(connection, documentAnalyzer);
  codeActionProvider = new CodeActionProvider(connection, documentAnalyzer);
  commandHandler = new CommandHandler(connection, documentAnalyzer);

  if (hasConfigurationCapability) {
    // Register for configuration changes
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
});

/**
 * Configuration change handler
 */
connection.onDidChangeConfiguration(() => {
  connection.console.log('Configuration changed');
  
  // Re-validate all open documents
  documents.all().forEach((document) => {
    diagnosticsProvider.validateTextDocument(document);
  });
});

/**
 * Document open handler
 */
documents.onDidOpen((event) => {
  connection.console.log(`Document opened: ${event.document.uri}`);
  diagnosticsProvider.validateTextDocument(event.document);
});

/**
 * Document change handler - handled in DocumentAnalyzer with debouncing
 */
documents.onDidChangeContent((change) => {
  connection.console.log(`Document changed: ${change.document.uri}`);
  diagnosticsProvider.validateTextDocument(change.document);
});

/**
 * Document close handler
 */
documents.onDidClose((event) => {
  connection.console.log(`Document closed: ${event.document.uri}`);
  documentAnalyzer.clearAnalysis(event.document.uri);
});

// Make the text document manager listen on the connection
documents.listen(connection);

// Start listening for messages
connection.listen();

connection.console.log('CodeChroma LSP Server started and listening...');
