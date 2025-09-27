# ProofMint Backend with 0G Storage Integration

This backend service integrates ProofMint with 0G Storage network using the official TypeScript SDK.

## Features

- **File Upload**: Upload files to 0G Storage network
- **File Download**: Download files with cryptographic proof verification
- **Receipt Attachments**: Store and retrieve receipt-related documents
- **Key-Value Storage**: Store metadata using 0G KV storage
- **Health Monitoring**: Health check endpoints for service monitoring

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- 0G Storage testnet access
- Private key with testnet tokens

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# 0G Storage Configuration
ZERO_G_RPC_URL=https://evmrpc-testnet.0g.ai/
ZERO_G_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
ZERO_G_PRIVATE_KEY=your_private_key_here

# KV Storage Configuration  
ZERO_G_KV_NODE_URL=http://3.101.147.150:6789

# Security
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Development

Start the development server:
```bash
npm run dev
```

### Production

Build and start:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health - Server health check
GET /api/storage/health - 0G Storage service health check
```

### File Operations
```
POST /api/storage/upload - Upload single file
POST /api/storage/upload-multiple - Upload multiple files
GET /api/storage/download/:rootHash - Download file by root hash
```

### Receipt Operations
```
POST /api/storage/receipt/:receiptId/attachment - Upload receipt attachment
GET /api/storage/receipt/:receiptId/attachments - Get receipt attachments
POST /api/storage/receipt/:receiptId/metadata - Store receipt metadata
GET /api/storage/receipt/:receiptId/metadata - Get receipt metadata
```

### Key-Value Storage
```
POST /api/storage/kv - Store key-value data
GET /api/storage/kv/:streamId/:key - Retrieve key-value data
```

## ProofMint Integration

This backend is specifically designed for ProofMint's receipt and document management needs:

### Receipt Attachments
- Upload invoices, images, and supporting documents
- Automatic metadata storage in 0G KV store
- Cryptographic proof verification for data integrity

### Decentralized Storage Benefits
- **Immutability**: Files stored on 0G cannot be altered
- **Availability**: Distributed storage ensures high availability
- **Verification**: Cryptographic proofs ensure data integrity
- **Censorship Resistance**: Decentralized nature prevents censorship

### Use Cases
1. **Invoice Storage**: Store original invoices with cryptographic proof
2. **Receipt Images**: Upload and verify receipt photos
3. **Supporting Documents**: Store contracts, warranties, etc.
4. **Metadata Management**: Store receipt metadata in KV store
5. **Audit Trail**: Immutable record of all uploads

## Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS Protection**: Configurable origin restrictions
- **File Type Validation**: Only allows approved file types
- **Size Limits**: Configurable file size restrictions
- **Error Handling**: Comprehensive error handling and logging

## File Types Supported

- Images: JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX, TXT
- Maximum file size: 50MB (configurable)
- Maximum files per request: 10 (configurable)

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "error": "Error description"
}
```

Common error codes:
- `400` - Bad Request (missing parameters, invalid file type)
- `413` - Payload Too Large (file size exceeded)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error (storage service issues)

## Monitoring

### Health Checks

The service provides comprehensive health checks:

```bash
# Server health
curl http://localhost:3001/health

# 0G Storage health
curl http://localhost:3001/api/storage/health
```

### Logging

The service uses Morgan for HTTP request logging and console logging for application events.

## Development

### TypeScript

The project is written in TypeScript with strict type checking enabled.

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Deployment

### Environment Variables

Ensure all required environment variables are set in production:

- `ZERO_G_PRIVATE_KEY`: Your 0G testnet private key
- `CORS_ORIGIN`: Your frontend URL
- `NODE_ENV=production`

### Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Private Key Issues**: Ensure your private key has testnet tokens
2. **Network Issues**: Verify 0G testnet endpoints are accessible
3. **File Upload Failures**: Check file size and type restrictions
4. **CORS Errors**: Verify CORS_ORIGIN matches your frontend URL

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development npm run dev
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Use conventional commit messages

## License

MIT License