"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const ZeroGStorageService_1 = require("../services/ZeroGStorageService");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 10
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    }
});
const storageService = new ZeroGStorageService_1.ZeroGStorageService();
router.get('/health', async (req, res) => {
    try {
        const health = await storageService.healthCheck();
        res.status(health.healthy ? 200 : 503).json(health);
    }
    catch (error) {
        res.status(500).json({
            healthy: false,
            error: error instanceof Error ? error.message : 'Health check failed'
        });
    }
});
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file provided'
            });
        }
        const { buffer, originalname, mimetype } = req.file;
        const result = await storageService.uploadBuffer(buffer, originalname);
        if (result.success) {
            res.json({
                success: true,
                rootHash: result.rootHash,
                txHash: result.txHash,
                filename: originalname,
                size: buffer.length,
                type: mimetype
            });
        }
        else {
            res.status(500).json(result);
        }
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        });
    }
});
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files provided'
            });
        }
        const uploadPromises = req.files.map(async (file) => {
            const result = await storageService.uploadBuffer(file.buffer, file.originalname);
            return {
                filename: file.originalname,
                size: file.size,
                type: file.mimetype,
                ...result
            };
        });
        const results = await Promise.all(uploadPromises);
        res.json({
            success: true,
            uploads: results,
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        });
    }
    catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Multiple upload failed'
        });
    }
});
router.get('/download/:rootHash', async (req, res) => {
    try {
        const { rootHash } = req.params;
        const { filename } = req.query;
        if (!rootHash) {
            return res.status(400).json({
                success: false,
                error: 'Root hash is required'
            });
        }
        const downloadDir = '/tmp/downloads';
        await promises_1.default.mkdir(downloadDir, { recursive: true });
        const outputFilename = filename || `file_${Date.now()}`;
        const outputPath = path_1.default.join(downloadDir, outputFilename);
        const result = await storageService.downloadFile(rootHash, outputPath, true);
        if (result.success && result.filePath) {
            const fileBuffer = await promises_1.default.readFile(result.filePath);
            res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(fileBuffer);
            try {
                await promises_1.default.unlink(result.filePath);
            }
            catch (cleanupError) {
                console.warn('Failed to cleanup downloaded file:', cleanupError);
            }
        }
        else {
            res.status(404).json(result);
        }
    }
    catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Download failed'
        });
    }
});
router.post('/receipt/:receiptId/attachment', upload.single('file'), async (req, res) => {
    try {
        const { receiptId } = req.params;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file provided'
            });
        }
        if (!receiptId) {
            return res.status(400).json({
                success: false,
                error: 'Receipt ID is required'
            });
        }
        const { buffer, originalname, mimetype } = req.file;
        const result = await storageService.uploadReceiptAttachment(buffer, originalname, receiptId, mimetype);
        if (result.success) {
            res.json({
                success: true,
                rootHash: result.rootHash,
                txHash: result.txHash,
                metadata: result.metadata
            });
        }
        else {
            res.status(500).json(result);
        }
    }
    catch (error) {
        console.error('Receipt attachment upload error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Receipt attachment upload failed'
        });
    }
});
router.get('/receipt/:receiptId/attachments', async (req, res) => {
    try {
        const { receiptId } = req.params;
        if (!receiptId) {
            return res.status(400).json({
                success: false,
                error: 'Receipt ID is required'
            });
        }
        const attachments = await storageService.getReceiptAttachments(receiptId);
        res.json({
            success: true,
            receiptId,
            attachments,
            count: attachments.length
        });
    }
    catch (error) {
        console.error('Get receipt attachments error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get receipt attachments'
        });
    }
});
router.post('/receipt/:receiptId/metadata', async (req, res) => {
    try {
        const { receiptId } = req.params;
        const metadata = req.body;
        if (!receiptId) {
            return res.status(400).json({
                success: false,
                error: 'Receipt ID is required'
            });
        }
        const result = await storageService.storeReceiptMetadata(receiptId, metadata);
        res.json(result);
    }
    catch (error) {
        console.error('Store receipt metadata error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to store receipt metadata'
        });
    }
});
router.get('/receipt/:receiptId/metadata', async (req, res) => {
    try {
        const { receiptId } = req.params;
        if (!receiptId) {
            return res.status(400).json({
                success: false,
                error: 'Receipt ID is required'
            });
        }
        const result = await storageService.getReceiptMetadata(receiptId);
        if (result.success) {
            res.json({
                success: true,
                receiptId,
                metadata: result.data
            });
        }
        else {
            res.status(404).json(result);
        }
    }
    catch (error) {
        console.error('Get receipt metadata error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get receipt metadata'
        });
    }
});
router.post('/kv', async (req, res) => {
    try {
        const { streamId, key, value } = req.body;
        if (!streamId || !key || !value) {
            return res.status(400).json({
                success: false,
                error: 'streamId, key, and value are required'
            });
        }
        const result = await storageService.uploadToKV(streamId, key, value);
        res.json(result);
    }
    catch (error) {
        console.error('KV store error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'KV store operation failed'
        });
    }
});
router.get('/kv/:streamId/:key', async (req, res) => {
    try {
        const { streamId, key } = req.params;
        if (!streamId || !key) {
            return res.status(400).json({
                success: false,
                error: 'streamId and key are required'
            });
        }
        const result = await storageService.downloadFromKV(parseInt(streamId), key);
        res.json(result);
    }
    catch (error) {
        console.error('KV get error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'KV get operation failed'
        });
    }
});
router.get('/nodes/select', async (req, res) => {
    try {
        const { segmentNumber, expectedReplicas, excludedNodes } = req.query;
        const segNum = segmentNumber ? parseInt(segmentNumber) : undefined;
        const replicas = expectedReplicas ? parseInt(expectedReplicas) : undefined;
        const excluded = excludedNodes ? excludedNodes.split(',') : undefined;
        const result = await storageService.selectStorageNodes(segNum, replicas, excluded);
        if (result.error) {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
        else {
            res.json({
                success: true,
                nodes: result.nodes,
                count: result.nodes.length
            });
        }
    }
    catch (error) {
        console.error('Node selection error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Node selection failed'
        });
    }
});
router.post('/upload-enhanced', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file provided'
            });
        }
        const { buffer, originalname } = req.file;
        const { segmentNumber, expectedReplicas } = req.body;
        const tempDir = '/tmp';
        const tempFilePath = path_1.default.join(tempDir, `temp_${Date.now()}_${originalname}`);
        await promises_1.default.writeFile(tempFilePath, buffer);
        try {
            const segNum = segmentNumber ? parseInt(segmentNumber) : undefined;
            const replicas = expectedReplicas ? parseInt(expectedReplicas) : undefined;
            const result = await storageService.uploadFileWithNodes(tempFilePath, segNum, replicas);
            res.json({
                ...result,
                filename: originalname,
                size: buffer.length
            });
        }
        finally {
            try {
                await promises_1.default.unlink(tempFilePath);
            }
            catch (cleanupError) {
                console.warn('Failed to cleanup temp file:', cleanupError);
            }
        }
    }
    catch (error) {
        console.error('Enhanced upload error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Enhanced upload failed'
        });
    }
});
router.post('/upload-batch', upload.array('files', 20), async (req, res) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files provided'
            });
        }
        const { segmentNumber, expectedReplicas } = req.body;
        const tempDir = '/tmp/batch_uploads';
        await promises_1.default.mkdir(tempDir, { recursive: true });
        const tempFilePaths = [];
        try {
            for (const file of req.files) {
                const tempFilePath = path_1.default.join(tempDir, `${Date.now()}_${file.originalname}`);
                await promises_1.default.writeFile(tempFilePath, file.buffer);
                tempFilePaths.push(tempFilePath);
            }
            const segNum = segmentNumber ? parseInt(segmentNumber) : undefined;
            const replicas = expectedReplicas ? parseInt(expectedReplicas) : undefined;
            const result = await storageService.batchUploadFiles(tempFilePaths, segNum, replicas);
            res.json(result);
        }
        finally {
            for (const tempFilePath of tempFilePaths) {
                try {
                    await promises_1.default.unlink(tempFilePath);
                }
                catch (cleanupError) {
                    console.warn('Failed to cleanup temp file:', cleanupError);
                }
            }
            try {
                await promises_1.default.rmdir(tempDir);
            }
            catch (cleanupError) {
                console.warn('Failed to cleanup temp directory:', cleanupError);
            }
        }
    }
    catch (error) {
        console.error('Batch upload error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Batch upload failed'
        });
    }
});
router.get('/download-enhanced/:rootHash', async (req, res) => {
    try {
        const { rootHash } = req.params;
        const { filename, withProof } = req.query;
        if (!rootHash) {
            return res.status(400).json({
                success: false,
                error: 'Root hash is required'
            });
        }
        const downloadDir = '/tmp/downloads';
        await promises_1.default.mkdir(downloadDir, { recursive: true });
        const outputFilename = filename || `file_${Date.now()}`;
        const outputPath = path_1.default.join(downloadDir, outputFilename);
        const enableProof = withProof !== 'false';
        const result = await storageService.downloadFileWithVerification(rootHash, outputPath, enableProof);
        if (result.success && result.filePath) {
            const fileBuffer = await promises_1.default.readFile(result.filePath);
            res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(fileBuffer);
            try {
                await promises_1.default.unlink(result.filePath);
            }
            catch (cleanupError) {
                console.warn('Failed to cleanup downloaded file:', cleanupError);
            }
        }
        else {
            res.status(404).json(result);
        }
    }
    catch (error) {
        console.error('Enhanced download error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Enhanced download failed'
        });
    }
});
router.post('/log-layer/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file provided'
            });
        }
        const { buffer, originalname, mimetype } = req.file;
        const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : undefined;
        const result = await storageService.uploadToLogLayer(buffer, originalname, metadata);
        res.json(result);
    }
    catch (error) {
        console.error('Log layer upload error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Log layer upload failed'
        });
    }
});
router.post('/kv/batch', async (req, res) => {
    try {
        const { operations } = req.body;
        if (!operations || !Array.isArray(operations)) {
            return res.status(400).json({
                success: false,
                error: 'Operations array is required'
            });
        }
        const result = await storageService.batchKVOperations(operations);
        res.json(result);
    }
    catch (error) {
        console.error('Batch KV operations error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Batch KV operations failed'
        });
    }
});
router.get('/layers', async (req, res) => {
    try {
        const layers = storageService.getStorageLayers();
        res.json({
            success: true,
            layers,
            count: layers.length
        });
    }
    catch (error) {
        console.error('Get storage layers error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get storage layers'
        });
    }
});
exports.default = router;
//# sourceMappingURL=storage.js.map