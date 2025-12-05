/**
 * Configuration Management
 * 
 * Handles loading, validation, and management of codeblooded configuration
 */

import {
  CodeBloodedConfig,
  Language,
  WaveformType,
  ErrorCode,
  CodeBloodedError,
} from '../types';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: CodeBloodedConfig = {
  audio: {
    enabled: true,
    volume: 0.5,
    waveform: WaveformType.Sine,
  },
  visual: {
    theme: 'horror',
    animations: true,
  },
  analysis: {
    threshold: 10,
    languages: [Language.TypeScript, Language.JavaScript],
  },
};

/**
 * Configuration validation schema
 */
interface ConfigValidationRule {
  path: string;
  type: string;
  required: boolean;
  validator?: (value: any) => boolean;
  errorMessage?: string;
}

const VALIDATION_RULES: ConfigValidationRule[] = [
  {
    path: 'audio.enabled',
    type: 'boolean',
    required: true,
  },
  {
    path: 'audio.volume',
    type: 'number',
    required: true,
    validator: (value: number) => value >= 0 && value <= 1,
    errorMessage: 'audio.volume must be between 0 and 1',
  },
  {
    path: 'audio.waveform',
    type: 'string',
    required: true,
    validator: (value: string) =>
      Object.values(WaveformType).includes(value as WaveformType),
    errorMessage: `audio.waveform must be one of: ${Object.values(WaveformType).join(', ')}`,
  },
  {
    path: 'visual.theme',
    type: 'string',
    required: true,
    validator: (value: string) => value === 'horror' || value === 'default',
    errorMessage: "visual.theme must be 'horror' or 'default'",
  },
  {
    path: 'visual.animations',
    type: 'boolean',
    required: true,
  },
  {
    path: 'analysis.threshold',
    type: 'number',
    required: true,
    validator: (value: number) => value > 0 && Number.isInteger(value),
    errorMessage: 'analysis.threshold must be a positive integer',
  },
  {
    path: 'analysis.languages',
    type: 'object',
    required: true,
    validator: (value: any) =>
      Array.isArray(value) &&
      value.every((lang) => Object.values(Language).includes(lang)),
    errorMessage: `analysis.languages must be an array of valid languages: ${Object.values(Language).join(', ')}`,
  },
];

/**
 * Get nested property value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Validate configuration against schema
 */
export function validateConfig(config: Partial<CodeBloodedConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const rule of VALIDATION_RULES) {
    const value = getNestedValue(config, rule.path);

    // Check if required field is missing
    if (rule.required && value === undefined) {
      errors.push(`Missing required field: ${rule.path}`);
      continue;
    }

    // Skip validation if field is optional and not provided
    if (!rule.required && value === undefined) {
      continue;
    }

    // Check type
    const actualType = Array.isArray(value) ? 'object' : typeof value;
    if (actualType !== rule.type) {
      errors.push(
        `Invalid type for ${rule.path}: expected ${rule.type}, got ${actualType}`
      );
      continue;
    }

    // Run custom validator if provided
    if (rule.validator && !rule.validator(value)) {
      errors.push(rule.errorMessage || `Invalid value for ${rule.path}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Merge partial configuration with defaults
 */
export function mergeConfig(
  partial: Partial<CodeBloodedConfig>
): CodeBloodedConfig {
  return {
    audio: {
      ...DEFAULT_CONFIG.audio,
      ...partial.audio,
    },
    visual: {
      ...DEFAULT_CONFIG.visual,
      ...partial.visual,
    },
    analysis: {
      ...DEFAULT_CONFIG.analysis,
      ...partial.analysis,
    },
  };
}

/**
 * Load configuration from JSON object
 */
export function loadConfig(
  configData: Partial<CodeBloodedConfig>
): CodeBloodedConfig {
  // Merge with defaults
  const config = mergeConfig(configData);

  // Validate
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new CodeBloodedError(
      `Invalid configuration: ${validation.errors.join(', ')}`,
      ErrorCode.PARSE_ERROR,
      { errors: validation.errors }
    );
  }

  return config;
}

/**
 * Load configuration from JSON string
 */
export function loadConfigFromJSON(json: string): CodeBloodedConfig {
  try {
    const configData = JSON.parse(json);
    return loadConfig(configData);
  } catch (error) {
    if (error instanceof CodeBloodedError) {
      throw error;
    }
    throw new CodeBloodedError(
      'Failed to parse configuration JSON',
      ErrorCode.PARSE_ERROR,
      { originalError: error }
    );
  }
}

/**
 * Load configuration from file (Node.js environment)
 */
export async function loadConfigFromFile(
  filePath: string
): Promise<CodeBloodedConfig> {
  try {
    // Dynamic import to support both Node.js and browser environments
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    return loadConfigFromJSON(content);
  } catch (error) {
    if (error instanceof CodeBloodedError) {
      throw error;
    }
    throw new CodeBloodedError(
      `Failed to load configuration from file: ${filePath}`,
      ErrorCode.FILE_SYSTEM_ERROR,
      { originalError: error, filePath }
    );
  }
}

/**
 * Save configuration to JSON string
 */
export function saveConfigToJSON(config: CodeBloodedConfig): string {
  try {
    return JSON.stringify(config, null, 2);
  } catch (error) {
    throw new CodeBloodedError(
      'Failed to serialize configuration to JSON',
      ErrorCode.PARSE_ERROR,
      { originalError: error }
    );
  }
}

/**
 * Save configuration to file (Node.js environment)
 */
export async function saveConfigToFile(
  config: CodeBloodedConfig,
  filePath: string
): Promise<void> {
  try {
    const json = saveConfigToJSON(config);
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, json, 'utf-8');
  } catch (error) {
    if (error instanceof CodeBloodedError) {
      throw error;
    }
    throw new CodeBloodedError(
      `Failed to save configuration to file: ${filePath}`,
      ErrorCode.FILE_SYSTEM_ERROR,
      { originalError: error, filePath }
    );
  }
}

/**
 * Configuration Manager class for managing runtime configuration
 */
export class ConfigManager {
  private config: CodeBloodedConfig;

  constructor(initialConfig?: Partial<CodeBloodedConfig>) {
    this.config = initialConfig ? loadConfig(initialConfig) : DEFAULT_CONFIG;
  }

  /**
   * Get current configuration
   */
  getConfig(): CodeBloodedConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(partial: Partial<CodeBloodedConfig>): void {
    const newConfig = mergeConfig({ ...this.config, ...partial });
    const validation = validateConfig(newConfig);

    if (!validation.valid) {
      throw new CodeBloodedError(
        `Invalid configuration update: ${validation.errors.join(', ')}`,
        ErrorCode.PARSE_ERROR,
        { errors: validation.errors }
      );
    }

    this.config = newConfig;
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Load configuration from file
   */
  async loadFromFile(filePath: string): Promise<void> {
    this.config = await loadConfigFromFile(filePath);
  }

  /**
   * Save configuration to file
   */
  async saveToFile(filePath: string): Promise<void> {
    await saveConfigToFile(this.config, filePath);
  }

  /**
   * Get specific configuration value
   */
  get<K extends keyof CodeBloodedConfig>(key: K): CodeBloodedConfig[K] {
    return this.config[key];
  }

  /**
   * Set specific configuration value
   */
  set<K extends keyof CodeBloodedConfig>(
    key: K,
    value: CodeBloodedConfig[K]
  ): void {
    const partial = { [key]: value } as Partial<CodeBloodedConfig>;
    this.updateConfig(partial);
  }
}
