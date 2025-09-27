export interface ZeroGConfig {
    rpcUrl: string;
    indexerRpc: string;
    privateKey: string;
    kvNodeUrl: string;
    flowContract?: string;
    segmentNumber?: number;
    expectedReplicas?: number;
}
export declare const zeroGConfig: ZeroGConfig;
export declare const validateZeroGConfig: () => void;
//# sourceMappingURL=zeroG.d.ts.map