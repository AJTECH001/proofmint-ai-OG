import express from 'express';
import { getZeroGComputeService, AIAnalysisRequest } from '../services/ZeroGComputeService';

const router = express.Router();

/**
 * Initialize 0G Compute Network service
 * POST /api/compute/initialize
 */
router.post('/initialize', async (req, res) => {
  try {
    const { rpcUrl, privateKey, providerAddress, model } = req.body;

    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Private key is required'
      });
    }

    const computeService = getZeroGComputeService();
    await computeService.initialize({
      rpcUrl: rpcUrl || 'https://evmrpc-testnet.0g.ai',
      privateKey,
      providerAddress,
      model
    });

    res.json({
      success: true,
      message: '0G Compute Network service initialized successfully',
      isReady: computeService.isReady()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Initialization failed'
    });
  }
});

/**
 * Get service status and available models
 * GET /api/compute/status
 */
router.get('/status', async (req, res) => {
  try {
    const computeService = getZeroGComputeService();
    
    const status = {
      isReady: computeService.isReady(),
      availableModels: computeService.getAvailableModels(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

/**
 * Analyze receipt for fraud using 0G Compute AI
 * POST /api/compute/analyze-fraud
 */
router.post('/analyze-fraud', async (req, res) => {
  try {
    const request: AIAnalysisRequest = req.body;

    if (!request.receiptData || !request.receiptData.receiptId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: receiptData with receiptId is required'
      });
    }

    const computeService = getZeroGComputeService();
    
    if (!computeService.isReady()) {
      return res.status(503).json({
        success: false,
        error: '0G Compute service not initialized. Please initialize first.'
      });
    }

    const result = await computeService.analyzeFraud(request);

    res.json({
      success: result.success,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fraud analysis failed'
    });
  }
});

/**
 * Calculate sustainability metrics using 0G Compute AI
 * POST /api/compute/analyze-sustainability
 */
router.post('/analyze-sustainability', async (req, res) => {
  try {
    const request: AIAnalysisRequest = req.body;

    if (!request.receiptData || !request.receiptData.device) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: receiptData with device information is required'
      });
    }

    const computeService = getZeroGComputeService();
    
    if (!computeService.isReady()) {
      return res.status(503).json({
        success: false,
        error: '0G Compute service not initialized. Please initialize first.'
      });
    }

    const result = await computeService.analyzeSustainability(request);

    res.json({
      success: result.success,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sustainability analysis failed'
    });
  }
});

/**
 * Verify receipt using 0G Compute AI
 * POST /api/compute/verify-receipt
 */
router.post('/verify-receipt', async (req, res) => {
  try {
    const request: AIAnalysisRequest = req.body;

    if (!request.receiptData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: receiptData is required'
      });
    }

    const computeService = getZeroGComputeService();
    
    if (!computeService.isReady()) {
      return res.status(503).json({
        success: false,
        error: '0G Compute service not initialized. Please initialize first.'
      });
    }

    const result = await computeService.verifyReceipt(request);

    res.json({
      success: result.success,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Receipt verification failed'
    });
  }
});

/**
 * Get account balance for 0G Compute payments
 * GET /api/compute/balance
 */
router.get('/balance', async (req, res) => {
  try {
    const computeService = getZeroGComputeService();
    
    if (!computeService.isReady()) {
      return res.status(503).json({
        success: false,
        error: '0G Compute service not initialized'
      });
    }

    const balance = await computeService.getBalance();

    res.json({
      success: true,
      balance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Balance check failed'
    });
  }
});

/**
 * Discover available AI services on 0G Compute Network
 * GET /api/compute/discover-services
 */
router.get('/discover-services', async (req, res) => {
  try {
    const computeService = getZeroGComputeService();
    
    if (!computeService.isReady()) {
      return res.status(503).json({
        success: false,
        error: '0G Compute service not initialized'
      });
    }

    const services = await computeService.discoverServices();

    res.json({
      success: true,
      services,
      count: services.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Service discovery failed'
    });
  }
});

/**
 * Batch analyze multiple receipts
 * POST /api/compute/analyze-batch
 */
router.post('/analyze-batch', async (req, res) => {
  try {
    const { receipts, analysisType } = req.body;

    if (!Array.isArray(receipts) || receipts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'receipts array is required'
      });
    }

    const computeService = getZeroGComputeService();
    
    if (!computeService.isReady()) {
      return res.status(503).json({
        success: false,
        error: '0G Compute service not initialized'
      });
    }

    const type = analysisType || 'fraud';
    const results = await Promise.allSettled(
      receipts.map(receiptData => {
        const request: AIAnalysisRequest = { receiptData, analysisType: type };
        
        if (type === 'fraud') {
          return computeService.analyzeFraud(request);
        } else if (type === 'sustainability') {
          return computeService.analyzeSustainability(request);
        } else {
          return computeService.verifyReceipt(request);
        }
      })
    );

    const analyses = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          receiptId: receipts[index].receiptId,
          success: true,
          result: result.value
        };
      } else {
        return {
          receiptId: receipts[index].receiptId,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : 'Analysis failed'
        };
      }
    });

    const successful = analyses.filter(a => a.success).length;
    const failed = analyses.filter(a => !a.success).length;

    res.json({
      success: true,
      summary: {
        total: receipts.length,
        successful,
        failed
      },
      analyses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch analysis failed'
    });
  }
});

export default router;

