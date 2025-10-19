import express from 'express';
import { fraudDetectionService, ReceiptData } from '../services/FraudDetectionService';

const router = express.Router();

/**
 * Analyze receipt for fraud
 * POST /api/fraud/analyze
 */
router.post('/analyze', async (req, res) => {
  try {
    const receiptData: ReceiptData = req.body;

    // Validate required fields
    if (!receiptData.receiptId || !receiptData.merchant || !receiptData.buyer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: receiptId, merchant, buyer'
      });
    }

    if (!receiptData.device || !receiptData.device.type || !receiptData.device.brand) {
      return res.status(400).json({
        success: false,
        error: 'Missing required device information'
      });
    }

    // Perform fraud analysis
    const analysis = await fraudDetectionService.analyzeReceipt(receiptData);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Fraud analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fraud analysis failed'
    });
  }
});

/**
 * Calculate sustainability metrics for a device
 * POST /api/fraud/sustainability
 */
router.post('/sustainability', async (req, res) => {
  try {
    const { device } = req.body;

    if (!device || !device.type || !device.brand || !device.model) {
      return res.status(400).json({
        success: false,
        error: 'Missing required device information'
      });
    }

    const metrics = await fraudDetectionService.calculateSustainabilityMetrics(device);

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Sustainability calculation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sustainability calculation failed'
    });
  }
});

/**
 * Add suspicious merchant to blocklist
 * POST /api/fraud/blocklist/add
 */
router.post('/blocklist/add', async (req, res) => {
  try {
    const { merchantAddress } = req.body;

    if (!merchantAddress) {
      return res.status(400).json({
        success: false,
        error: 'merchantAddress is required'
      });
    }

    fraudDetectionService.addSuspiciousMerchant(merchantAddress);

    res.json({
      success: true,
      message: `Merchant ${merchantAddress} added to blocklist`
    });
  } catch (error) {
    console.error('Blocklist add error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add to blocklist'
    });
  }
});

/**
 * Remove merchant from blocklist
 * POST /api/fraud/blocklist/remove
 */
router.post('/blocklist/remove', async (req, res) => {
  try {
    const { merchantAddress } = req.body;

    if (!merchantAddress) {
      return res.status(400).json({
        success: false,
        error: 'merchantAddress is required'
      });
    }

    fraudDetectionService.removeSuspiciousMerchant(merchantAddress);

    res.json({
      success: true,
      message: `Merchant ${merchantAddress} removed from blocklist`
    });
  } catch (error) {
    console.error('Blocklist remove error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove from blocklist'
    });
  }
});

/**
 * Update device price in database
 * POST /api/fraud/prices/update
 */
router.post('/prices/update', async (req, res) => {
  try {
    const { brand, model, price } = req.body;

    if (!brand || !model || typeof price !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'brand, model, and price (number) are required'
      });
    }

    const deviceKey = `${brand}_${model}`;
    fraudDetectionService.updatePrice(deviceKey, price);

    res.json({
      success: true,
      message: `Price updated for ${brand} ${model}: $${price}`
    });
  } catch (error) {
    console.error('Price update error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update price'
    });
  }
});

/**
 * Batch analyze multiple receipts
 * POST /api/fraud/analyze-batch
 */
router.post('/analyze-batch', async (req, res) => {
  try {
    const { receipts } = req.body;

    if (!Array.isArray(receipts) || receipts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'receipts array is required'
      });
    }

    const results = await Promise.allSettled(
      receipts.map(receipt => fraudDetectionService.analyzeReceipt(receipt))
    );

    const analyses = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          receiptId: receipts[index].receiptId,
          success: true,
          analysis: result.value
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
    const fraudulent = analyses.filter(a => a.success && a.analysis?.isFraudulent).length;

    res.json({
      success: true,
      summary: {
        total: receipts.length,
        successful,
        failed,
        fraudulent,
        clean: successful - fraudulent
      },
      analyses
    });
  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch analysis failed'
    });
  }
});

/**
 * Get fraud detection statistics
 * GET /api/fraud/stats
 */
router.get('/stats', async (req, res) => {
  try {
    // In a real implementation, this would query a database for statistics
    res.json({
      success: true,
      stats: {
        totalAnalyzed: 1247,
        fraudDetected: 34,
        falsePositives: 5,
        accuracy: 97.2,
        averageRiskScore: 15.3,
        last24Hours: {
          analyzed: 89,
          fraudDetected: 3,
          highRisk: 12
        }
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats'
    });
  }
});

export default router;

