 const CoinGeckoClient = require('../apiClients/coinGeckoClient');
const DeltaClient = require('../apiClients/deltaClient');
const VolatilityEngine = require('./volatilityEngine');
const SentimentAnalyzer = require('./sentimentAnalyzer');
const AlertManager = require('./alertManager');
const { CircuitBreaker } = require('../middleware/errorHandler');
const NodeCache = require('node-cache');
const logger = require('../logger');

class DataAcquisitionPipeline {
  constructor(options = {}) {
    this.interval = options.interval || 5000; // 5 seconds default
    this.assets = options.assets || ['bitcoin', 'ethereum'];
    this.symbols = options.symbols || ['BTCUSDT', 'ETHUSDT'];
    this.cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache
    this.io = options.io; // Socket.io instance
    this.alertManager = options.alertManager; // Use shared AlertManager instance

    // Initialize Circuit Breakers for external services
    this.coinGeckoCircuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 min recovery
    this.deltaCircuitBreaker = new CircuitBreaker(5, 60000);
    this.sentimentCircuitBreaker = new CircuitBreaker(3, 300000); // 3 failures, 5 min recovery

    // Initialize clients
    this.coinGecko = new CoinGeckoClient();
    this.delta = new DeltaClient(
      process.env.DELTA_API_KEY,
      process.env.DELTA_SECRET_KEY
    );
    this.volatilityEngine = new VolatilityEngine();
    this.sentimentAnalyzer = new SentimentAnalyzer(
      process.env.HUGGINGFACE_API_KEY,
      process.env.NEWS_API_KEY
    );

    this.isRunning = false;
    this.intervalId = null;
    this.marketContext = null;
    this.lastUpdate = null;
  }

  /**
   * Start the pipeline
   * @param {Object} marketContext - MarketContext instance to update
   */
  start(marketContext) {
    if (this.isRunning) {
      logger.info('Pipeline already running');
      return;
    }

    this.marketContext = marketContext;
    this.isRunning = true;

    logger.info(`Starting DAPP with ${this.interval}ms interval`);

    // Run immediately
    this.run();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.run();
    }, this.interval);
  }

  /**
   * Stop the pipeline
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('DAPP stopped');
  }

  /**
   * Main pipeline execution
   */
  async run() {
    try {
      logger.debug('DAPP: Starting data acquisition cycle');

      const startTime = Date.now();
      const results = {};

      // 1. Fetch historical OHLCV data
      results.historicalData = await this.fetchHistoricalData();

      // 2. Fetch market sentiment
      results.sentiment = await this.fetchMarketSentiment();

      // 3. Calculate volatility metrics
      results.volatility = await this.calculateVolatilityMetrics(results.historicalData);

      // 4. Get account balance (placeholder - would need actual implementation)
      results.accountBalance = await this.getAccountBalance();

      // 5. Aggregate and update MarketContext
      await this.updateMarketContext(results);

      this.lastUpdate = new Date();
      const duration = Date.now() - startTime;

      logger.debug(`DAPP: Cycle completed in ${duration}ms`);

    } catch (error) {
      logger.error('DAPP: Pipeline error:', error);
      // Continue with cached data if available
      await this.handlePipelineError(error);
    }
  }

  /**
   * Fetch historical OHLCV data from CoinGecko
   */
  async fetchHistoricalData() {
    const cacheKey = 'historical_data';
    let data = this.cache.get(cacheKey);

    if (!data) {
      console.log('DAPP: Fetching historical data from CoinGecko');

      const promises = this.assets.map(async (asset) => {
        try {
          const response = await this.coinGeckoCircuitBreaker.execute(
            () => this.coinGecko.getHistoricalData(asset, 30), // 30 days
            () => {
              logger.warn(`Circuit breaker fallback for CoinGecko ${asset}`);
              return this.cache.get('historical_data')?.find(d => d.asset === asset)?.data || [];
            }
          );
          return {
            asset,
            data: response.prices.map(([timestamp, price]) => ({
              timestamp,
              price: parseFloat(price)
            }))
          };
        } catch (error) {
          logger.warn(`Failed to fetch ${asset} data:`, error.message);
          return { asset, data: [], error: error.message };
        }
      });

      data = await Promise.all(promises);
      this.cache.set(cacheKey, data);
    }

    return data;
  }

  /**
   * Fetch market sentiment using FinBERT
   */
  async fetchMarketSentiment() {
    const cacheKey = 'market_sentiment';
    let sentiment = this.cache.get(cacheKey);

    if (!sentiment) {
      console.log('DAPP: Analyzing market sentiment');

      try {
        sentiment = await this.sentimentCircuitBreaker.execute(
          () => this.sentimentAnalyzer.getMarketSentiment(),
          () => {
            logger.warn('Circuit breaker fallback for sentiment analysis');
            return this.getFallbackSentiment();
          }
        );
        this.cache.set(cacheKey, sentiment);
      } catch (error) {
        logger.warn('Sentiment analysis failed:', error.message);
        sentiment = this.getFallbackSentiment();
      }
    }

    return sentiment;
  }

  /**
   * Calculate volatility metrics (HV and IV)
   */
  async calculateVolatilityMetrics(historicalData) {
    console.log('DAPP: Calculating volatility metrics');

    const volatility = {};

    for (const assetData of historicalData) {
      const { asset, data } = assetData;

      if (data.length < 21) continue; // Need at least 21 data points

      const prices = data.map(d => d.price);

      try {
        // Calculate Historical Volatility
        const hv = this.volatilityEngine.calculateHistoricalVolatility(prices);

        // Get current spot price for IV calculation
        const spotPrice = prices[prices.length - 1];

        // Fetch options data for IV calculation
        const optionsData = await this.fetchOptionsData(asset);

        // Calculate Implied Volatility
        let iv = null;
        if (optionsData.length > 0) {
          iv = this.volatilityEngine.calculateAverageIV(optionsData, spotPrice);
        }

        volatility[asset] = {
          historicalVolatility: hv,
          impliedVolatility: iv,
          spotPrice,
          timestamp: Date.now()
        };

      } catch (error) {
        console.warn(`Volatility calculation failed for ${asset}:`, error.message);
        volatility[asset] = {
          error: error.message,
          timestamp: Date.now()
        };
      }
    }

    return volatility;
  }

  /**
   * Fetch options data for IV calculation
   */
  async fetchOptionsData(asset) {
    const cacheKey = `options_${asset}`;
    let options = this.cache.get(cacheKey);

    if (!options) {
      try {
        // Map asset names to Delta symbols
        const symbolMap = {
          bitcoin: 'BTCUSD',
          ethereum: 'ETHUSD'
        };

        const deltaSymbol = symbolMap[asset] || 'BTCUSD';
        options = await this.delta.getOptionsData(deltaSymbol);
        this.cache.set(cacheKey, options, 60); // Cache for 1 minute
      } catch (error) {
        console.warn(`Options data fetch failed for ${asset}:`, error.message);
        options = [];
      }
    }

    return options;
  }

  /**
   * Get account balance (placeholder implementation)
   */
  async getAccountBalance() {
    // This would need actual implementation based on exchange APIs
    // For now, return a placeholder
    return {
      total: 10000,
      available: 9500,
      inOrders: 500,
      timestamp: Date.now()
    };
  }

  /**
   * Update MarketContext with aggregated data
   */
  async updateMarketContext(results) {
    if (!this.marketContext) return;

    // Update each symbol with the new data
    for (const symbol of this.symbols) {
      const asset = symbol.replace('USDT', '').toLowerCase();
      const assetKey = asset === 'btc' ? 'bitcoin' : asset === 'eth' ? 'ethereum' : asset;

      const marketData = {
        sentiment: results.sentiment,
        volatility: results.volatility[assetKey],
        accountBalance: results.accountBalance,
        lastDAPPUpdate: Date.now()
      };

      // Update the market context
      this.marketContext.updateData('dapp', symbol, marketData);

      // Check for alerts
      if (this.alertManager) {
        const alertData = {
          volatility: marketData.volatility?.historicalVolatility,
          sentiment: marketData.sentiment?.overall?.compound,
          price: marketData.volatility?.spotPrice
        };
        this.alertManager.checkForAlerts(alertData, symbol);
      }
    }
  }

  /**
   * Handle pipeline errors with fallback to cached data
   */
  async handlePipelineError(error) {
    console.log('DAPP: Attempting to use cached data');

    try {
      // Try to update with cached data
      const cachedHistorical = this.cache.get('historical_data');
      const cachedSentiment = this.cache.get('market_sentiment');

      if (cachedHistorical || cachedSentiment) {
        const fallbackResults = {
          historicalData: cachedHistorical || [],
          sentiment: cachedSentiment || this.getFallbackSentiment(),
          volatility: {},
          accountBalance: await this.getAccountBalance()
        };

        await this.updateMarketContext(fallbackResults);
        console.log('DAPP: Updated with cached data');
      }
    } catch (cacheError) {
      console.error('DAPP: Cache fallback failed:', cacheError.message);
    }
  }

  /**
   * Get fallback sentiment data
   */
  getFallbackSentiment() {
    return {
      overall: {
        positive: 0.33,
        negative: 0.33,
        neutral: 0.34,
        compound: 0
      },
      articleCount: 0,
      timestamp: Date.now(),
      error: 'Using fallback sentiment data'
    };
  }

  /**
   * Get pipeline status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.interval,
      assets: this.assets,
      symbols: this.symbols,
      lastUpdate: this.lastUpdate,
      cacheStats: this.cache.getStats()
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.flushAll();
    this.sentimentAnalyzer.clearCache();
    console.log('DAPP: All caches cleared');
  }
}

module.exports = DataAcquisitionPipeline;