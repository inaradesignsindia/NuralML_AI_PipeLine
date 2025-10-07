const express = require('express');
const router = express.Router();
const AIAgentChain = require('../modules/aiAgentChain');
const { apiLimiter } = require('../middleware/rateLimit');

const aiChain = new AIAgentChain();

// Execute the complete AI agent chain for crypto scalping recommendations
router.post('/scalping-recommendation', apiLimiter, async (req, res) => {
  try {
    const { symbol, marketContext, accountBalance } = req.body;

    // Validate required inputs
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    if (!marketContext) {
      return res.status(400).json({ error: 'MarketContext is required' });
    }

    if (!accountBalance) {
      return res.status(400).json({ error: 'AccountBalance is required' });
    }

    // Check if AI services are configured
    if (!aiChain.isConfigured()) {
      return res.status(503).json({
        error: 'AI services not configured. Please check API keys for Gemini and Cohere.'
      });
    }

    console.log(`AI Chain: Processing scalping recommendation for ${symbol}`);

    // Execute the AI agent chain
    const result = await aiChain.executeChain(marketContext, accountBalance);

    res.json({
      success: true,
      symbol,
      ...result
    });

  } catch (error) {
    console.error('AI Chain API error:', error);

    // Handle rate limiting errors
    if (error.message.includes('Rate limit exceeded')) {
      return res.status(429).json({
        error: 'AI API rate limit exceeded. Please try again later.',
        retryAfter: 60 // seconds
      });
    }

    // Handle other errors
    res.status(500).json({
      error: 'Failed to generate scalping recommendation',
      details: error.message
    });
  }
});

// Get AI chain status and configuration
router.get('/status', (req, res) => {
  res.json({
    configured: aiChain.isConfigured(),
    services: {
      gemini: aiChain.geminiClient.isConfigured(),
      cohere: aiChain.cohereClient.isConfigured()
    },
    timestamp: new Date().toISOString()
  });
});

// Health check for AI services
router.get('/health', async (req, res) => {
  try {
    const status = {
      aiChain: aiChain.isConfigured(),
      timestamp: new Date().toISOString()
    };

    // Basic connectivity check (without actual API calls)
    if (aiChain.isConfigured()) {
      status.status = 'healthy';
    } else {
      status.status = 'unhealthy';
      status.message = 'AI API keys not configured';
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;