const DataAcquisitionPipeline = require('../../modules/dataAcquisitionPipeline');
const CoinGeckoClient = require('../../apiClients/coinGeckoClient');
const DeltaClient = require('../../apiClients/deltaClient');
const VolatilityEngine = require('../../modules/volatilityEngine');
const SentimentAnalyzer = require('../../modules/sentimentAnalyzer');

// Mock all dependencies
jest.mock('../../apiClients/coinGeckoClient');
jest.mock('../../apiClients/deltaClient');
jest.mock('../../modules/volatilityEngine');
jest.mock('../../modules/sentimentAnalyzer');
jest.mock('../../middleware/errorHandler');
jest.mock('node-cache');
jest.mock('../../logger');

describe('DataAcquisitionPipeline', () => {
  let pipeline;
  let mockMarketContext;
  let mockCoinGecko;
  let mockDelta;
  let mockVolatilityEngine;
  let mockSentimentAnalyzer;
  let mockCache;
  let mockCircuitBreaker;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mocks
    mockCoinGecko = {
      getHistoricalData: jest.fn()
    };
    CoinGeckoClient.mockImplementation(() => mockCoinGecko);

    mockDelta = {
      getOptionsData: jest.fn()
    };
    DeltaClient.mockImplementation(() => mockDelta);

    mockVolatilityEngine = {
      calculateHistoricalVolatility: jest.fn(),
      calculateAverageIV: jest.fn()
    };
    VolatilityEngine.mockImplementation(() => mockVolatilityEngine);

    mockSentimentAnalyzer = {
      getMarketSentiment: jest.fn(),
      clearCache: jest.fn()
    };
    SentimentAnalyzer.mockImplementation(() => mockSentimentAnalyzer);

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      flushAll: jest.fn(),
      getStats: jest.fn().mockReturnValue({ keys: 0, hits: 0, misses: 0 })
    };
    const NodeCache = require('node-cache');
    NodeCache.mockImplementation(() => mockCache);

    mockCircuitBreaker = {
      execute: jest.fn()
    };
    const { CircuitBreaker } = require('../../middleware/errorHandler');
    CircuitBreaker.mockImplementation(() => mockCircuitBreaker);

    mockMarketContext = {
      updateData: jest.fn()
    };

    pipeline = new DataAcquisitionPipeline({
      interval: 1000,
      assets: ['bitcoin'],
      symbols: ['BTCUSDT']
    });
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultPipeline = new DataAcquisitionPipeline();

      expect(defaultPipeline.interval).toBe(5000);
      expect(defaultPipeline.assets).toEqual(['bitcoin', 'ethereum']);
      expect(defaultPipeline.symbols).toEqual(['BTCUSDT', 'ETHUSDT']);
    });

    it('should initialize with custom options', () => {
      expect(pipeline.interval).toBe(1000);
      expect(pipeline.assets).toEqual(['bitcoin']);
      expect(pipeline.symbols).toEqual(['BTCUSDT']);
    });
  });

  describe('start and stop', () => {
    it('should start the pipeline', () => {
      jest.useFakeTimers();

      pipeline.start(mockMarketContext);

      expect(pipeline.isRunning).toBe(true);
      expect(pipeline.marketContext).toBe(mockMarketContext);
      expect(pipeline.intervalId).toBeDefined();

      pipeline.stop();
      jest.useRealTimers();
    });

    it('should not start if already running', () => {
      pipeline.isRunning = true;

      pipeline.start(mockMarketContext);

      expect(pipeline.marketContext).not.toBe(mockMarketContext);
    });

    it('should stop the pipeline', () => {
      pipeline.intervalId = setInterval(() => {}, 1000);
      pipeline.isRunning = true;

      pipeline.stop();

      expect(pipeline.isRunning).toBe(false);
      expect(pipeline.intervalId).toBeNull();
    });
  });

  describe('run', () => {
    beforeEach(() => {
      // Setup successful mock responses
      mockCircuitBreaker.execute.mockImplementation((fn) => fn());

      mockCoinGecko.getHistoricalData.mockResolvedValue({
        prices: [[Date.now(), '45000']]
      });

      mockSentimentAnalyzer.getMarketSentiment.mockResolvedValue({
        overall: { positive: 0.5, negative: 0.3, neutral: 0.2, compound: 0.2 }
      });

      mockVolatilityEngine.calculateHistoricalVolatility.mockReturnValue(25);
      mockVolatilityEngine.calculateAverageIV.mockReturnValue(30);

      mockDelta.getOptionsData.mockResolvedValue([]);

      pipeline.marketContext = mockMarketContext;
    });

    it('should execute full pipeline successfully', async () => {
      await pipeline.run();

      expect(mockCoinGecko.getHistoricalData).toHaveBeenCalledWith('bitcoin', 30);
      expect(mockSentimentAnalyzer.getMarketSentiment).toHaveBeenCalled();
      expect(mockVolatilityEngine.calculateHistoricalVolatility).toHaveBeenCalled();
      expect(mockMarketContext.updateData).toHaveBeenCalled();
      expect(pipeline.lastUpdate).toBeInstanceOf(Date);
    });

    it('should handle errors gracefully', async () => {
      mockCoinGecko.getHistoricalData.mockRejectedValue(new Error('API Error'));

      // Setup cached data for fallback
      mockCache.get.mockImplementation((key) => {
        if (key === 'historical_data') return [{ asset: 'bitcoin', data: [] }];
        if (key === 'market_sentiment') return pipeline.getFallbackSentiment();
        return undefined;
      });

      await pipeline.run();

      expect(mockMarketContext.updateData).toHaveBeenCalled();
    });
  });

  describe('fetchHistoricalData', () => {
    it('should return cached data if available', async () => {
      const cachedData = [{ asset: 'bitcoin', data: [] }];
      mockCache.get.mockReturnValue(cachedData);

      const result = await pipeline.fetchHistoricalData();

      expect(result).toBe(cachedData);
      expect(mockCoinGecko.getHistoricalData).not.toHaveBeenCalled();
    });

    it('should fetch fresh data and cache it', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockCircuitBreaker.execute.mockImplementation((fn) => fn());
      mockCoinGecko.getHistoricalData.mockResolvedValue({
        prices: [[Date.now(), '45000']]
      });

      const result = await pipeline.fetchHistoricalData();

      expect(result).toHaveLength(1);
      expect(result[0].asset).toBe('bitcoin');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should handle API errors with fallback', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockCircuitBreaker.execute.mockImplementation((fn, fallback) => fallback());
      mockCoinGecko.getHistoricalData.mockRejectedValue(new Error('API Error'));

      const result = await pipeline.fetchHistoricalData();

      expect(result).toEqual([]);
    });
  });

  describe('fetchMarketSentiment', () => {
    it('should return cached sentiment if available', async () => {
      const cachedSentiment = { overall: { positive: 0.5 } };
      mockCache.get.mockReturnValue(cachedSentiment);

      const result = await pipeline.fetchMarketSentiment();

      expect(result).toBe(cachedSentiment);
      expect(mockSentimentAnalyzer.getMarketSentiment).not.toHaveBeenCalled();
    });

    it('should fetch fresh sentiment and cache it', async () => {
      const sentimentData = { overall: { positive: 0.6 } };
      mockCache.get.mockReturnValue(undefined);
      mockCircuitBreaker.execute.mockImplementation((fn) => fn());
      mockSentimentAnalyzer.getMarketSentiment.mockResolvedValue(sentimentData);

      const result = await pipeline.fetchMarketSentiment();

      expect(result).toBe(sentimentData);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should use fallback sentiment on error', async () => {
      mockCache.get.mockReturnValue(undefined);
      mockCircuitBreaker.execute.mockImplementation((fn, fallback) => fallback());
      mockSentimentAnalyzer.getMarketSentiment.mockRejectedValue(new Error('API Error'));

      const result = await pipeline.fetchMarketSentiment();

      expect(result.overall.positive).toBe(0.33);
      expect(result.error).toBe('Using fallback sentiment data');
    });
  });

  describe('calculateVolatilityMetrics', () => {
    it('should calculate volatility for valid data', async () => {
      const historicalData = [{
        asset: 'bitcoin',
        data: Array(25).fill(0).map((_, i) => ({ price: 40000 + i * 100 }))
      }];

      mockVolatilityEngine.calculateHistoricalVolatility.mockReturnValue(25);
      mockVolatilityEngine.calculateAverageIV.mockReturnValue(30);
      mockDelta.getOptionsData.mockResolvedValue([]);

      const result = await pipeline.calculateVolatilityMetrics(historicalData);

      expect(result.bitcoin).toHaveProperty('historicalVolatility', 25);
      expect(result.bitcoin).toHaveProperty('impliedVolatility', 30);
      expect(result.bitcoin).toHaveProperty('spotPrice');
    });

    it('should skip assets with insufficient data', async () => {
      const historicalData = [{
        asset: 'bitcoin',
        data: [{ price: 40000 }] // Insufficient data
      }];

      const result = await pipeline.calculateVolatilityMetrics(historicalData);

      expect(result.bitcoin).toBeUndefined();
    });

    it('should handle calculation errors', async () => {
      const historicalData = [{
        asset: 'bitcoin',
        data: Array(25).fill(0).map((_, i) => ({ price: 40000 + i * 100 }))
      }];

      mockVolatilityEngine.calculateHistoricalVolatility.mockImplementation(() => {
        throw new Error('Calculation error');
      });

      const result = await pipeline.calculateVolatilityMetrics(historicalData);

      expect(result.bitcoin).toHaveProperty('error', 'Calculation error');
    });
  });

  describe('updateMarketContext', () => {
    it('should update market context with results', () => {
      const results = {
        sentiment: { overall: { compound: 0.2 } },
        volatility: { historicalVolatility: 25, spotPrice: 45000 },
        accountBalance: { total: 10000 }
      };

      pipeline.marketContext = mockMarketContext;

      pipeline.updateMarketContext(results);

      expect(mockMarketContext.updateData).toHaveBeenCalledWith(
        'dapp',
        'BTCUSDT',
        expect.objectContaining({
          sentiment: results.sentiment,
          volatility: results.volatility,
          accountBalance: results.accountBalance
        })
      );
    });

    it('should skip if no market context', () => {
      pipeline.marketContext = null;

      pipeline.updateMarketContext({});

      expect(mockMarketContext.updateData).not.toHaveBeenCalled();
    });
  });

  describe('getFallbackSentiment', () => {
    it('should return neutral fallback sentiment', () => {
      const result = pipeline.getFallbackSentiment();

      expect(result.overall.positive).toBe(0.33);
      expect(result.overall.negative).toBe(0.33);
      expect(result.overall.neutral).toBe(0.34);
      expect(result.overall.compound).toBe(0);
      expect(result.articleCount).toBe(0);
      expect(result).toHaveProperty('error');
    });
  });

  describe('getStatus', () => {
    it('should return pipeline status', () => {
      pipeline.isRunning = true;
      pipeline.lastUpdate = new Date();

      const status = pipeline.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.interval).toBe(1000);
      expect(status.assets).toEqual(['bitcoin']);
      expect(status.symbols).toEqual(['BTCUSDT']);
      expect(status.lastUpdate).toBeInstanceOf(Date);
      expect(status).toHaveProperty('cacheStats');
    });
  });

  describe('clearCache', () => {
    it('should clear all caches', () => {
      pipeline.clearCache();

      expect(mockCache.flushAll).toHaveBeenCalled();
      expect(mockSentimentAnalyzer.clearCache).toHaveBeenCalled();
    });
  });
});