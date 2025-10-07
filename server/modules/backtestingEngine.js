const CoinGeckoClient = require('../apiClients/coinGeckoClient');
const AIAgentChain = require('./aiAgentChain');
const SimulationEngine = require('./simulationEngine');
const SentimentAnalyzer = require('./sentimentAnalyzer');
const VolatilityEngine = require('./volatilityEngine');

class BacktestingEngine {
  constructor(options = {}) {
    this.assets = options.assets || ['bitcoin', 'ethereum'];
    this.days = options.days || 30;
    this.speed = options.speed || 1; // Replay speed multiplier
    this.initialBalance = options.initialBalance || 10000;

    // Initialize clients
    this.coinGecko = new CoinGeckoClient();
    this.aiChain = new AIAgentChain();
    this.sentimentAnalyzer = new SentimentAnalyzer(
      process.env.HUGGINGFACE_API_KEY,
      process.env.NEWS_API_KEY
    );
    this.volatilityEngine = new VolatilityEngine();

    this.isRunning = false;
    this.progress = 0;
    this.results = null;
  }

  /**
   * Run backtest for specified assets and time period
   * @param {Object} options - Backtest options
   */
  async runBacktest(options = {}) {
    const {
      assets = this.assets,
      days = this.days,
      speed = this.speed,
      initialBalance = this.initialBalance
    } = options;

    this.isRunning = true;
    this.progress = 0;

    try {
      console.log(`Backtesting Engine: Starting backtest for ${assets.join(', ')} over ${days} days`);

      // Initialize simulation engine
      this.simulationEngine = new SimulationEngine({ initialBalance });
      this.simulationEngine.startSimulation();

      // Fetch historical data
      const historicalData = await this.fetchHistoricalData(assets, days);
      this.progress = 10;

      // Process data day by day
      const totalDataPoints = historicalData.reduce((sum, asset) => sum + asset.data.length, 0);
      let processedPoints = 0;

      for (const assetData of historicalData) {
        const { asset, data } = assetData;

        for (let i = 0; i < data.length; i++) {
          if (!this.isRunning) break; // Allow cancellation

          const dataPoint = data[i];
          const timestamp = new Date(dataPoint.timestamp);

          // Create market context for this data point
          const marketContext = await this.createMarketContext(asset, data, i);

          // Get account balance from simulation
          const accountBalance = this.simulationEngine.getPortfolioStatus();

          // Run AI chain if configured
          if (this.aiChain.isConfigured()) {
            try {
              const aiResult = await this.aiChain.executeChain(marketContext, accountBalance);

              // Execute trade in simulation if recommendation is generated
              if (aiResult.executableTrade) {
                await this.simulationEngine.executeTrade(aiResult.executableTrade);

                // Update market data for P&L calculation
                this.simulationEngine.updateMarketData(
                  `${aiResult.executableTrade.trade_type}_${aiResult.executableTrade.strike_price}`,
                  { price: dataPoint.price, timestamp: dataPoint.timestamp }
                );
              }
            } catch (aiError) {
              console.warn(`AI Chain error for ${asset} at ${timestamp.toISOString()}:`, aiError.message);
            }
          }

          processedPoints++;
          this.progress = 10 + (processedPoints / totalDataPoints) * 80;

          // Speed control
          if (speed < 10) { // Don't delay if speed is too high
            await new Promise(resolve => setTimeout(resolve, 1000 / speed));
          }
        }

        if (!this.isRunning) break;
      }

      // Stop simulation and get results
      this.simulationEngine.stopSimulation();
      this.results = this.simulationEngine.getPerformanceReport();
      this.progress = 100;

      console.log(`Backtesting Engine: Completed backtest with ${this.results.summary.totalTrades} trades`);

      return {
        success: true,
        results: this.results,
        metadata: {
          assets: assets,
          days: days,
          speed: speed,
          initialBalance: initialBalance,
          totalDataPoints: processedPoints,
          completedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Backtesting Engine error:', error);
      this.isRunning = false;
      throw new Error(`Backtest failed: ${error.message}`);
    }
  }

  /**
   * Fetch historical data from CoinGecko
   * @param {Array} assets - Asset symbols
   * @param {number} days - Number of days
   */
  async fetchHistoricalData(assets, days) {
    const promises = assets.map(async (asset) => {
      try {
        const response = await this.coinGecko.getHistoricalData(asset, days);
        return {
          asset,
          data: response.prices.map(([timestamp, price]) => ({
            timestamp,
            price: parseFloat(price),
            volume: 0, // CoinGecko doesn't provide volume in simple API
            high: parseFloat(price),
            low: parseFloat(price),
            open: parseFloat(price),
            close: parseFloat(price)
          }))
        };
      } catch (error) {
        console.warn(`Failed to fetch ${asset} data:`, error.message);
        return { asset, data: [] };
      }
    });

    return await Promise.all(promises);
  }

  /**
   * Create market context for AI chain
   * @param {string} asset - Asset symbol
   * @param {Array} data - Historical data array
   * @param {number} index - Current index in data
   */
  async createMarketContext(asset, data, index) {
    const currentData = data[index];
    const lookbackPeriod = Math.min(21, index + 1); // At least 21 periods for volatility

    // Get price data for volatility calculation
    const priceData = data.slice(Math.max(0, index - lookbackPeriod + 1), index + 1);
    const prices = priceData.map(d => d.price);

    // Calculate volatility
    let volatility = { historicalVolatility: 0, impliedVolatility: null };
    try {
      if (prices.length >= 21) {
        volatility.historicalVolatility = this.volatilityEngine.calculateHistoricalVolatility(prices);
      }
    } catch (error) {
      console.warn(`Volatility calculation failed for ${asset}:`, error.message);
    }

    // Get sentiment (cached, as it's expensive)
    let sentiment = {
      overall: { positive: 0.33, negative: 0.33, neutral: 0.34, compound: 0 },
      articleCount: 0
    };

    try {
      // Only fetch sentiment occasionally to avoid rate limits
      if (index % 24 === 0) { // Once per day equivalent
        sentiment = await this.sentimentAnalyzer.getMarketSentiment();
      }
    } catch (error) {
      console.warn('Sentiment analysis failed:', error.message);
    }

    // Create market context similar to DAPP
    const marketContext = {
      symbol: asset.toUpperCase(),
      timestamp: currentData.timestamp,
      price: {
        current: currentData.price,
        high: currentData.high,
        low: currentData.low,
        open: currentData.open,
        close: currentData.close,
        volume: currentData.volume
      },
      volatility: volatility,
      sentiment: sentiment,
      orderBook: {
        bids: [], // Simplified for backtesting
        asks: []
      },
      recentTrades: [], // Simplified for backtesting
      technicalIndicators: {
        sma20: this.calculateSMA(prices, 20),
        sma50: this.calculateSMA(prices, 50),
        rsi: this.calculateRSI(prices, 14),
        macd: this.calculateMACD(prices)
      }
    };

    return marketContext;
  }

  /**
   * Calculate Simple Moving Average
   */
  calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * Calculate RSI
   */
  calculateRSI(prices, period) {
    if (prices.length < period + 1) return null;

    const gains = [];
    const losses = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD (simplified)
   */
  calculateMACD(prices) {
    if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };

    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    const signal = this.calculateEMA([macd], 9) || 0;

    return {
      macd: macd,
      signal: signal,
      histogram: macd - signal
    };
  }

  /**
   * Calculate Exponential Moving Average
   */
  calculateEMA(prices, period) {
    if (prices.length < period) return null;

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  /**
   * Stop backtest execution
   */
  stopBacktest() {
    this.isRunning = false;
    if (this.simulationEngine) {
      this.simulationEngine.stopSimulation();
    }
    console.log('Backtesting Engine: Stopped');
  }

  /**
   * Get current backtest status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      progress: this.progress,
      results: this.results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get detailed backtest results
   */
  getResults() {
    if (!this.results) {
      throw new Error('No backtest results available');
    }

    return {
      ...this.results,
      equityCurve: this.calculateEquityCurve(),
      monthlyReturns: this.calculateMonthlyReturns(),
      tradeAnalysis: this.analyzeTrades()
    };
  }

  /**
   * Calculate equity curve from trade history
   */
  calculateEquityCurve() {
    if (!this.simulationEngine) return [];

    const trades = this.simulationEngine.portfolio.tradeHistory;
    const curve = [];
    let balance = this.initialBalance;

    curve.push({ timestamp: new Date(0), balance: this.initialBalance });

    for (const trade of trades) {
      curve.push({
        timestamp: trade.timestamp,
        balance: trade.balance
      });
    }

    return curve;
  }

  /**
   * Calculate monthly returns
   */
  calculateMonthlyReturns() {
    const curve = this.calculateEquityCurve();
    if (curve.length < 2) return [];

    const monthlyReturns = [];
    let currentMonth = null;
    let monthStartBalance = null;

    for (const point of curve) {
      const month = point.timestamp.getMonth();
      const year = point.timestamp.getFullYear();

      if (currentMonth !== `${year}-${month}`) {
        if (monthStartBalance !== null) {
          const monthEndBalance = curve[curve.indexOf(point) - 1].balance;
          const returnPct = (monthEndBalance - monthStartBalance) / monthStartBalance;
          monthlyReturns.push({
            month: currentMonth,
            return: returnPct,
            startBalance: monthStartBalance,
            endBalance: monthEndBalance
          });
        }

        currentMonth = `${year}-${month}`;
        monthStartBalance = point.balance;
      }
    }

    return monthlyReturns;
  }

  /**
   * Analyze trade performance
   */
  analyzeTrades() {
    if (!this.simulationEngine) return {};

    const trades = this.simulationEngine.portfolio.tradeHistory.filter(t => t.type === 'EXIT');
    if (trades.length === 0) return {};

    const profits = trades.filter(t => t.netPnL > 0).map(t => t.netPnL);
    const losses = trades.filter(t => t.netPnL < 0).map(t => t.netPnL);

    return {
      totalTrades: trades.length,
      winningTrades: profits.length,
      losingTrades: losses.length,
      winRate: profits.length / trades.length,
      avgWin: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
      avgLoss: losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0,
      largestWin: profits.length > 0 ? Math.max(...profits) : 0,
      largestLoss: losses.length > 0 ? Math.min(...losses) : 0,
      profitFactor: losses.length > 0 ? profits.reduce((a, b) => a + b, 0) / Math.abs(losses.reduce((a, b) => a + b, 0)) : Infinity
    };
  }
}

module.exports = BacktestingEngine;