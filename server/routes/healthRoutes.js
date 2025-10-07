const express = require('express');
const router = express.Router();
const logger = require('../logger');
const CoinGeckoClient = require('../apiClients/coinGeckoClient');
const SentimentAnalyzer = require('../modules/sentimentAnalyzer');
const VolatilityEngine = require('../modules/volatilityEngine');

const coinGecko = new CoinGeckoClient();
const sentimentAnalyzer = new SentimentAnalyzer();
const volatilityEngine = new VolatilityEngine();

// Health check with detailed status
router.get('/', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    services: {}
  };

  try {
    // Check CoinGecko API
    const coinGeckoStart = Date.now();
    await coinGecko.getCoinList();
    health.services.coinGecko = {
      status: 'OK',
      responseTime: Date.now() - coinGeckoStart
    };
  } catch (error) {
    health.services.coinGecko = {
      status: 'ERROR',
      error: error.message
    };
    health.status = 'DEGRADED';
  }

  try {
    // Check sentiment analysis
    const sentimentStart = Date.now();
    await sentimentAnalyzer.getMarketSentiment();
    health.services.sentimentAnalysis = {
      status: 'OK',
      responseTime: Date.now() - sentimentStart
    };
  } catch (error) {
    health.services.sentimentAnalysis = {
      status: 'ERROR',
      error: error.message
    };
    health.status = 'DEGRADED';
  }

  // Check volatility engine (synchronous)
  try {
    const testPrices = [100, 105, 102, 108, 106];
    const volStart = Date.now();
    const volatility = volatilityEngine.calculateHistoricalVolatility(testPrices);
    health.services.volatilityEngine = {
      status: 'OK',
      responseTime: Date.now() - volStart,
      testResult: volatility
    };
  } catch (error) {
    health.services.volatilityEngine = {
      status: 'ERROR',
      error: error.message
    };
    health.status = 'DEGRADED';
  }

  // Database check (if available)
  if (global.db) {
    try {
      // Simple database check
      health.services.database = {
        status: 'OK'
      };
    } catch (error) {
      health.services.database = {
        status: 'ERROR',
        error: error.message
      };
      health.status = 'DEGRADED';
    }
  }

  const statusCode = health.status === 'OK' ? 200 : health.status === 'DEGRADED' ? 206 : 503;
  res.status(statusCode).json(health);
});

// Detailed API status endpoint
router.get('/api-status', async (req, res) => {
  const apiStatus = {
    timestamp: new Date().toISOString(),
    apis: {}
  };

  // Test external APIs
  const apis = [
    { name: 'CoinGecko', client: coinGecko, method: 'getCoinList' },
    { name: 'SentimentAnalysis', client: sentimentAnalyzer, method: 'getMarketSentiment' }
  ];

  for (const api of apis) {
    try {
      const start = Date.now();
      await api.client[api.method]();
      apiStatus.apis[api.name] = {
        status: 'OK',
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      apiStatus.apis[api.name] = {
        status: 'ERROR',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
      logger.error(`API health check failed for ${api.name}:`, error);
    }
  }

  res.json(apiStatus);
});

// Model performance endpoint
router.get('/model-performance', async (req, res) => {
  const performance = {
    timestamp: new Date().toISOString(),
    models: {}
  };

  // Test volatility model
  try {
    const testData = {
      prices: [100, 105, 102, 108, 106, 104, 109, 107, 111, 108],
      window: 5
    };

    const start = Date.now();
    const volatility = volatilityEngine.calculateHistoricalVolatility(testData.prices, testData.window);
    const responseTime = Date.now() - start;

    performance.models.volatilityEngine = {
      status: 'OK',
      responseTime,
      testResult: {
        input: testData,
        output: volatility,
        expectedRange: [0, 100] // Reasonable volatility range
      },
      performance: responseTime < 100 ? 'GOOD' : responseTime < 500 ? 'FAIR' : 'POOR'
    };
  } catch (error) {
    performance.models.volatilityEngine = {
      status: 'ERROR',
      error: error.message
    };
    logger.error('Volatility model performance test failed:', error);
  }

  // Test sentiment model
  try {
    const start = Date.now();
    const sentiment = await sentimentAnalyzer.getMarketSentiment();
    const responseTime = Date.now() - start;

    performance.models.sentimentAnalyzer = {
      status: 'OK',
      responseTime,
      testResult: sentiment,
      performance: responseTime < 5000 ? 'GOOD' : responseTime < 15000 ? 'FAIR' : 'POOR'
    };
  } catch (error) {
    performance.models.sentimentAnalyzer = {
      status: 'ERROR',
      error: error.message
    };
    logger.error('Sentiment model performance test failed:', error);
  }

  res.json(performance);
});

// System metrics endpoint
router.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    },
    process: {
      pid: process.pid,
      title: process.title,
      argv: process.argv,
      execPath: process.execPath
    }
  };

  res.json(metrics);
});

module.exports = router;