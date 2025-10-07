/**
 * Technical Indicators Utility Module
 * Provides calculations for various technical indicators used in charting
 */

export class TechnicalIndicators {
  /**
   * Calculate Simple Moving Average
   * @param {Array<number>} prices - Array of price values
   * @param {number} period - Period for SMA calculation
   * @returns {Array<number|null>} Array of SMA values
   */
  static calculateSMA(prices, period) {
    if (!Array.isArray(prices) || prices.length < period) {
      return new Array(prices.length).fill(null);
    }

    const sma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  }

  /**
   * Calculate Exponential Moving Average
   * @param {Array<number>} prices - Array of price values
   * @param {number} period - Period for EMA calculation
   * @returns {Array<number|null>} Array of EMA values
   */
  static calculateEMA(prices, period) {
    if (!Array.isArray(prices) || prices.length < period) {
      return new Array(prices.length).fill(null);
    }

    const ema = [];
    const multiplier = 2 / (period + 1);

    // First EMA is SMA
    let sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
    ema.push(sum / period);

    // Calculate remaining EMAs
    for (let i = period; i < prices.length; i++) {
      const currentEMA = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(currentEMA);
    }

    // Pad with nulls for initial values
    while (ema.length < prices.length) {
      ema.unshift(null);
    }

    return ema;
  }

  /**
   * Calculate Relative Strength Index (RSI)
   * @param {Array<number>} prices - Array of price values
   * @param {number} period - Period for RSI calculation (default: 14)
   * @returns {Array<number|null>} Array of RSI values
   */
  static calculateRSI(prices, period = 14) {
    if (!Array.isArray(prices) || prices.length < period + 1) {
      return new Array(prices.length).fill(null);
    }

    const rsi = [];
    const gains = [];
    const losses = [];

    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calculate initial averages
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // Calculate RSI values
    for (let i = 0; i < prices.length; i++) {
      if (i < period) {
        rsi.push(null);
      } else if (i === period) {
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      } else {
        // Smoothed averages for subsequent values
        avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   * @param {Array<number>} prices - Array of price values
   * @param {number} fastPeriod - Fast EMA period (default: 12)
   * @param {number} slowPeriod - Slow EMA period (default: 26)
   * @param {number} signalPeriod - Signal line EMA period (default: 9)
   * @returns {Array<{macd: number|null, signal: number|null, histogram: number|null}>} Array of MACD data
   */
  static calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (!Array.isArray(prices) || prices.length < slowPeriod) {
      return new Array(prices.length).fill({ macd: null, signal: null, histogram: null });
    }

    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);

    const macdLine = [];
    for (let i = 0; i < prices.length; i++) {
      if (fastEMA[i] === null || slowEMA[i] === null) {
        macdLine.push(null);
      } else {
        macdLine.push(fastEMA[i] - slowEMA[i]);
      }
    }

    const signalLine = this.calculateEMA(macdLine.filter(v => v !== null), signalPeriod);

    // Pad signal line to match price array length
    const paddedSignal = new Array(macdLine.length - signalLine.length).fill(null).concat(signalLine);

    const result = [];
    for (let i = 0; i < macdLine.length; i++) {
      const macd = macdLine[i];
      const signal = paddedSignal[i];
      const histogram = (macd !== null && signal !== null) ? macd - signal : null;
      result.push({ macd, signal, histogram });
    }

    return result;
  }

  /**
   * Calculate Bollinger Bands
   * @param {Array<number>} prices - Array of price values
   * @param {number} period - Period for moving average (default: 20)
   * @param {number} stdDev - Standard deviation multiplier (default: 2)
   * @returns {Array<{upper: number|null, middle: number|null, lower: number|null}>} Array of Bollinger Band data
   */
  static calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (!Array.isArray(prices) || prices.length < period) {
      return new Array(prices.length).fill({ upper: null, middle: null, lower: null });
    }

    const sma = this.calculateSMA(prices, period);
    const result = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        result.push({ upper: null, middle: null, lower: null });
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
        const std = Math.sqrt(variance);

        result.push({
          upper: mean + (stdDev * std),
          middle: mean,
          lower: mean - (stdDev * std)
        });
      }
    }

    return result;
  }

  /**
   * Calculate Volume Profile
   * @param {Array<{high: number, low: number, volume: number}>} candles - Array of candle data
   * @param {number} bins - Number of price bins (default: 50)
   * @returns {Array<{price: number, volume: number}>} Volume profile data
   */
  static calculateVolumeProfile(candles, bins = 50) {
    if (!Array.isArray(candles) || candles.length === 0) {
      return [];
    }

    // Find price range
    const prices = candles.flatMap(candle => [candle.high, candle.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    if (priceRange === 0) return [];

    const binSize = priceRange / bins;
    const volumeProfile = new Array(bins).fill(0).map((_, i) => ({
      price: minPrice + (i * binSize) + (binSize / 2),
      volume: 0
    }));

    // Distribute volume across price bins
    candles.forEach(candle => {
      const candleRange = candle.high - candle.low;
      if (candleRange === 0) {
        // Handle zero-range candles (like some crypto data)
        const binIndex = Math.floor((candle.high - minPrice) / binSize);
        if (binIndex >= 0 && binIndex < bins) {
          volumeProfile[binIndex].volume += candle.volume || 0;
        }
      } else {
        // Distribute volume evenly across the candle's price range
        const volumePerPrice = (candle.volume || 0) / candleRange;
        const startBin = Math.floor((candle.low - minPrice) / binSize);
        const endBin = Math.floor((candle.high - minPrice) / binSize);

        for (let bin = Math.max(0, startBin); bin <= Math.min(bins - 1, endBin); bin++) {
          const binStart = minPrice + (bin * binSize);
          const binEnd = binStart + binSize;
          const overlapStart = Math.max(binStart, candle.low);
          const overlapEnd = Math.min(binEnd, candle.high);
          const overlap = Math.max(0, overlapEnd - overlapStart);

          volumeProfile[bin].volume += volumePerPrice * overlap;
        }
      }
    });

    return volumeProfile;
  }

  /**
   * Calculate Fibonacci Retracement Levels
   * @param {number} high - High price
   * @param {number} low - Low price
   * @returns {Object} Fibonacci levels
   */
  static calculateFibonacciLevels(high, low) {
    const range = high - low;
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

    return levels.reduce((acc, level) => {
      acc[level] = high - (range * level);
      return acc;
    }, {});
  }

  /**
   * Calculate Historical Volatility
   * @param {Array<number>} prices - Array of closing prices
   * @param {number} window - Rolling window size (default: 20)
   * @returns {Array<number|null>} Array of volatility values
   */
  static calculateHistoricalVolatility(prices, window = 20) {
    if (!Array.isArray(prices) || prices.length < window + 1) {
      return new Array(prices.length).fill(null);
    }

    const volatility = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < window) {
        volatility.push(null);
      } else {
        // Calculate log returns
        const returns = [];
        for (let j = i - window + 1; j <= i; j++) {
          const logReturn = Math.log(prices[j] / prices[j - 1]);
          returns.push(logReturn);
        }

        // Calculate standard deviation
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
        const stdDev = Math.sqrt(variance);

        // Annualize (assuming daily data, 252 trading days)
        const annualizedVol = stdDev * Math.sqrt(252) * 100; // Return as percentage
        volatility.push(annualizedVol);
      }
    }

    return volatility;
  }
}

export default TechnicalIndicators;