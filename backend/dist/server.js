"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const storage_1 = __importDefault(require("./routes/storage"));
const da_1 = __importDefault(require("./routes/da"));
const fraudDetection_1 = __importDefault(require("./routes/fraudDetection"));
const errorHandler_1 = require("./middleware/errorHandler");
const zeroG_1 = require("./config/zeroG");
dotenv_1.default.config();
try {
    (0, zeroG_1.validateZeroGConfig)();
    console.log('✅ 0G Storage configuration validated');
}
catch (error) {
    console.error('❌ 0G Storage configuration error:', error);
    process.exit(1);
}
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use((0, compression_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.API_RATE_LIMIT_MAX || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined'));
}
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    });
});
app.use('/api/storage', storage_1.default);
app.use('/api/da', da_1.default);
app.use('/api/fraud', fraudDetection_1.default);
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
const server = app.listen(PORT, () => {
    console.log(`🚀 ProofMint Backend Server running on port ${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 0G Storage RPC: ${process.env.ZERO_G_RPC_URL}`);
    console.log(`📊 0G Indexer: ${process.env.ZERO_G_INDEXER_RPC}`);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=server.js.map