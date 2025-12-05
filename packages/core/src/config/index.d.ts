import { CodeBloodedConfig } from '../types';
export declare const DEFAULT_CONFIG: CodeBloodedConfig;
export declare function validateConfig(config: Partial<CodeBloodedConfig>): {
    valid: boolean;
    errors: string[];
};
export declare function mergeConfig(partial: Partial<CodeBloodedConfig>): CodeBloodedConfig;
export declare function loadConfig(configData: Partial<CodeBloodedConfig>): CodeBloodedConfig;
export declare function loadConfigFromJSON(json: string): CodeBloodedConfig;
export declare function loadConfigFromFile(filePath: string): Promise<CodeBloodedConfig>;
export declare function saveConfigToJSON(config: CodeBloodedConfig): string;
export declare function saveConfigToFile(config: CodeBloodedConfig, filePath: string): Promise<void>;
export declare class ConfigManager {
    private config;
    constructor(initialConfig?: Partial<CodeBloodedConfig>);
    getConfig(): CodeBloodedConfig;
    updateConfig(partial: Partial<CodeBloodedConfig>): void;
    reset(): void;
    loadFromFile(filePath: string): Promise<void>;
    saveToFile(filePath: string): Promise<void>;
    get<K extends keyof CodeBloodedConfig>(key: K): CodeBloodedConfig[K];
    set<K extends keyof CodeBloodedConfig>(key: K, value: CodeBloodedConfig[K]): void;
}
//# sourceMappingURL=index.d.ts.map