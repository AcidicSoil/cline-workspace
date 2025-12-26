export type LmStudioPluginOptions = {
    name: string;
    owner: string;
    version: string;
    description?: string;
    revision?: number;
};
export declare function buildManifest(options: LmStudioPluginOptions): string;
export declare function buildPackageJson(options: LmStudioPluginOptions): string;
export declare function buildTsconfig(): string;
export declare function buildIndexSource(): string;
export declare function buildConfigSource(): string;
