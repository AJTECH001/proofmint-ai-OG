export interface UploadResult {
    success: boolean;
    rootHash?: string;
    txHash?: string;
    error?: string;
}
export interface DownloadResult {
    success: boolean;
    filePath?: string;
    error?: string;
}
export interface KVResult {
    success: boolean;
    data?: any;
    txHash?: string;
    error?: string;
}
export interface FileMetadata {
    name: string;
    size: number;
    type: string;
    rootHash: string;
    uploadedAt: Date;
    txHash: string;
    receiptId?: string;
}
export interface StorageLayer {
    type: 'log' | 'kv';
    description: string;
    useCase: string;
}
export interface NodeInfo {
    nodeId: string;
    endpoint: string;
    capacity: number;
    available: boolean;
}
export interface BatchUploadResult {
    success: boolean;
    results: UploadResult[];
    totalFiles: number;
    successfulUploads: number;
    failedUploads: number;
    errors: string[];
}
export declare class ZeroGStorageService {
    private provider;
    private signer;
    private indexer;
    private kvClient;
    constructor();
    uploadFile(filePath: string): Promise<UploadResult>;
    uploadBuffer(buffer: Buffer, filename: string): Promise<UploadResult>;
    downloadFile(rootHash: string, outputPath: string, withProof?: boolean): Promise<DownloadResult>;
    uploadToKV(streamId: number, key: string, value: string): Promise<KVResult>;
    downloadFromKV(streamId: number, key: string): Promise<KVResult>;
    uploadReceiptAttachment(buffer: Buffer, filename: string, receiptId: string, fileType: string): Promise<UploadResult & {
        metadata?: FileMetadata;
    }>;
    getReceiptAttachments(receiptId: string): Promise<FileMetadata[]>;
    storeReceiptMetadata(receiptId: string, metadata: any): Promise<KVResult>;
    getReceiptMetadata(receiptId: string): Promise<KVResult>;
    selectStorageNodes(segmentNumber?: number, expectedReplicas?: number, excludedNodes?: string[]): Promise<{
        nodes: any[];
        error?: string;
    }>;
    uploadFileWithNodes(filePath: string, segmentNumber?: number, expectedReplicas?: number): Promise<UploadResult>;
    batchUploadFiles(filePaths: string[], segmentNumber?: number, expectedReplicas?: number): Promise<BatchUploadResult>;
    downloadFileWithVerification(rootHash: string, outputPath: string, withProof?: boolean): Promise<DownloadResult>;
    getStorageLayers(): StorageLayer[];
    uploadToLogLayer(buffer: Buffer, filename: string, metadata?: any): Promise<UploadResult & {
        metadata?: FileMetadata;
    }>;
    batchKVOperations(operations: Array<{
        streamId: number;
        key: string;
        value: string;
        operation: 'set' | 'delete';
    }>): Promise<KVResult>;
    healthCheck(): Promise<{
        healthy: boolean;
        details: any;
    }>;
}
//# sourceMappingURL=ZeroGStorageService.d.ts.map