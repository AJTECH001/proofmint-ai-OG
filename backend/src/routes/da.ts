import express from 'express';
import { zeroGDAService, DABlobData } from '../services/ZeroGDAService';
import { upload } from '../middleware/multer';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const status = await zeroGDAService.getNodeStatus();
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

// Initialize DA service
router.post('/initialize', async (req, res) => {
  try {
    const customConfig = req.body;
    const initialized = await zeroGDAService.initialize(customConfig);
    
    if (initialized) {
      res.json({
        success: true,
        message: '0G DA Service initialized successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to initialize 0G DA Service'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Initialization failed'
    });
  }
});

// Submit receipt data to DA
router.post('/submit', async (req, res) => {
  try {
    const receiptData: DABlobData = req.body;
    
    // Validate required fields
    if (!receiptData.receiptId || !receiptData.metadata) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: receiptId and metadata'
      });
    }

    const result = await zeroGDAService.submitReceiptData(receiptData);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Submission failed'
    });
  }
});

// Batch submit receipt data
router.post('/submit-batch', async (req, res) => {
  try {
    const receiptDataArray: DABlobData[] = req.body.receipts;
    
    if (!Array.isArray(receiptDataArray) || receiptDataArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or empty receipts array'
      });
    }

    const results = await zeroGDAService.batchSubmitReceiptData(receiptDataArray);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      results,
      summary: {
        total: receiptDataArray.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch submission failed'
    });
  }
});

// Retrieve receipt data from DA
router.get('/retrieve/:commitment', async (req, res) => {
  try {
    const { commitment } = req.params;
    
    if (!commitment) {
      return res.status(400).json({
        success: false,
        error: 'Commitment parameter is required'
      });
    }

    const result = await zeroGDAService.getReceiptData(commitment);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Retrieval failed'
    });
  }
});

// Check data availability
router.get('/verify/:commitment', async (req, res) => {
  try {
    const { commitment } = req.params;
    
    if (!commitment) {
      return res.status(400).json({
        success: false,
        error: 'Commitment parameter is required'
      });
    }

    const isAvailable = await zeroGDAService.verifyDataAvailability(commitment);
    res.json({
      success: true,
      available: isAvailable,
      commitment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    });
  }
});

// Get blob status
router.get('/status/:commitment', async (req, res) => {
  try {
    const { commitment } = req.params;
    
    if (!commitment) {
      return res.status(400).json({
        success: false,
        error: 'Commitment parameter is required'
      });
    }

    const status = await zeroGDAService.getBlobStatus(commitment);
    
    if (status) {
      res.json({
        success: true,
        status
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Blob status not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

// Estimate cost for data submission
router.post('/estimate-cost', async (req, res) => {
  try {
    const { dataSize } = req.body;
    
    if (!dataSize || typeof dataSize !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'dataSize (number) is required'
      });
    }

    const costEstimate = await zeroGDAService.estimateCost(dataSize);
    res.json({
      success: true,
      ...costEstimate,
      dataSize
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Cost estimation failed'
    });
  }
});

// Get analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await zeroGDAService.getAnalytics();
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analytics retrieval failed'
    });
  }
});

// Create DA-optimized receipt data helper
router.post('/create-receipt-data', async (req, res) => {
  try {
    const { receiptId, deviceInfo, purchaseInfo, additionalData } = req.body;
    
    if (!receiptId || !deviceInfo || !purchaseInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: receiptId, deviceInfo, purchaseInfo'
      });
    }

    const receiptData = zeroGDAService.constructor.createDAReceiptData(
      receiptId,
      deviceInfo,
      purchaseInfo,
      additionalData
    );
    
    res.json({
      success: true,
      receiptData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Receipt data creation failed'
    });
  }
});

// Upload receipt files and submit to DA
router.post('/upload-and-submit', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const { receiptId, deviceInfo, purchaseInfo, additionalData } = req.body;
    
    if (!receiptId || !deviceInfo || !purchaseInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: receiptId, deviceInfo, purchaseInfo'
      });
    }

    // Process uploaded files
    const attachments = {
      images: [] as string[],
      documents: [] as string[],
      certificates: [] as string[]
    };

    for (const file of req.files) {
      // In a real implementation, you would upload these files to 0G Storage
      // and get the root hashes to include in the DA data
      const fileType = file.mimetype.startsWith('image/') ? 'images' : 
                      file.mimetype.includes('pdf') || file.mimetype.includes('document') ? 'documents' : 
                      'certificates';
      
      attachments[fileType].push(`mock_hash_${Date.now()}_${file.originalname}`);
    }

    // Create DA receipt data with file attachments
    const enhancedAdditionalData = {
      ...additionalData,
      attachments
    };

    const receiptData = zeroGDAService.constructor.createDAReceiptData(
      receiptId,
      deviceInfo,
      purchaseInfo,
      enhancedAdditionalData
    );

    // Submit to DA
    const result = await zeroGDAService.submitReceiptData(receiptData);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload and submission failed'
    });
  }
});

// Search receipts by commitment or receipt ID
router.get('/search', async (req, res) => {
  try {
    const { commitment, receiptId, status } = req.query;
    
    // This is a simplified search - in a real implementation,
    // you would have a database to store commitments and metadata
    // for efficient searching
    
    if (commitment) {
      const status = await zeroGDAService.getBlobStatus(commitment as string);
      if (status) {
        return res.json({
          success: true,
          results: [status]
        });
      }
    }
    
    res.json({
      success: true,
      results: [],
      message: 'Search functionality requires database integration'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    });
  }
});

export default router;
