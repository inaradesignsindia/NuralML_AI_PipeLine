const math = require('mathjs');
const logger = require('../logger');

class VolatilityEngine {
  constructor() {
    this.hvWindow = 20; // 20 periods for historical volatility
  }

  /**
   * Calculate Historical Volatility using standard deviation of log returns
   * @param {Array} prices - Array of closing prices
   * @param {number} window - Rolling window size (default 20)
   * @returns {number} Historical volatility as percentage
   */
  calculateHistoricalVolatility(prices, window = this.hvWindow) {
    if (prices.length < window + 1) {
      throw new Error('Insufficient data for historical volatility calculation');
    }

    // Calculate log returns
    const logReturns = [];
    for (let i = 1; i < prices.length; i++) {
      const logReturn = Math.log(prices[i] / prices[i - 1]);
      logReturns.push(logReturn);
    }

    // Use rolling window of most recent returns
    const recentReturns = logReturns.slice(-window);

    // Calculate standard deviation
    const mean = math.mean(recentReturns);
    const variance = math.variance(recentReturns, 'uncorrected');
    const stdDev = Math.sqrt(variance);

    // Annualize (assuming daily data, 252 trading days)
    const annualizedVol = stdDev * Math.sqrt(252);

    return annualizedVol * 100; // Return as percentage
  }

  /**
   * Cumulative normal distribution function
   * @param {number} x
   * @returns {number}
   */
  normCDF(x) {
    return 0.5 * (1 + math.erf(x / Math.sqrt(2)));
  }

  /**
   * Black-Scholes call option price
   * @param {number} S - Spot price
   * @param {number} K - Strike price
   * @param {number} T - Time to expiration (years)
   * @param {number} r - Risk-free rate
   * @param {number} sigma - Volatility
   * @returns {number} Option price
   */
  blackScholesCall(S, K, T, r, sigma) {
    if (T <= 0 || sigma <= 0) return 0;

    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    return S * this.normCDF(d1) - K * Math.exp(-r * T) * this.normCDF(d2);
  }

  /**
   * Black-Scholes put option price
   * @param {number} S - Spot price
   * @param {number} K - Strike price
   * @param {number} T - Time to expiration (years)
   * @param {number} r - Risk-free rate
   * @param {number} sigma - Volatility
   * @returns {number} Option price
   */
  blackScholesPut(S, K, T, r, sigma) {
    if (T <= 0 || sigma <= 0) return 0;

    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    return K * Math.exp(-r * T) * this.normCDF(-d2) - S * this.normCDF(-d1);
  }

  /**
   * Calculate vega (derivative of option price w.r.t. volatility)
   * @param {number} S - Spot price
   * @param {number} K - Strike price
   * @param {number} T - Time to expiration (years)
   * @param {number} r - Risk-free rate
   * @param {number} sigma - Volatility
   * @param {boolean} isCall - True for call, false for put
   * @returns {number} Vega value
   */
  calculateVega(S, K, T, r, sigma, isCall = true) {
    if (T <= 0 || sigma <= 0) return 0;

    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const vega = S * Math.sqrt(T) * Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);

    return vega;
  }

  /**
   * Calculate Implied Volatility using Newton-Raphson method
   * @param {number} marketPrice - Market price of option
   * @param {number} S - Spot price
   * @param {number} K - Strike price
   * @param {number} T - Time to expiration (years)
   * @param {number} r - Risk-free rate
   * @param {boolean} isCall - True for call, false for put
   * @param {number} tolerance - Convergence tolerance
   * @param {number} maxIterations - Maximum iterations
   * @returns {number} Implied volatility
   */
  calculateImpliedVolatility(marketPrice, S, K, T, r, isCall = true, tolerance = 1e-6, maxIterations = 100) {
    if (T <= 0) return 0;

    // Initial guess for volatility (20%)
    let sigma = 0.20;
    let iteration = 0;

    while (iteration < maxIterations) {
      const price = isCall ?
        this.blackScholesCall(S, K, T, r, sigma) :
        this.blackScholesPut(S, K, T, r, sigma);

      const vega = this.calculateVega(S, K, T, r, sigma, isCall);

      if (Math.abs(vega) < 1e-8) {
        // Vega too small, break to avoid division by zero
        break;
      }

      const diff = price - marketPrice;
      if (Math.abs(diff) < tolerance) {
        return sigma * 100; // Return as percentage
      }

      // Newton-Raphson update
      sigma = sigma - diff / vega;

      // Ensure sigma stays positive
      if (sigma <= 0) sigma = 0.01;

      iteration++;
    }

    // If not converged, return last sigma
    return sigma * 100;
  }

  /**
   * Calculate implied volatility for multiple options
   * @param {Array} options - Array of option data {price, strike, expiration, type}
   * @param {number} spotPrice - Current spot price
   * @param {number} riskFreeRate - Risk-free rate
   * @returns {number} Average implied volatility
   */
  calculateAverageIV(options, spotPrice, riskFreeRate = 0.05) {
    const ivs = [];

    for (const option of options) {
      try {
        const T = option.expiration / 365; // Convert days to years
        const iv = this.calculateImpliedVolatility(
          option.price,
          spotPrice,
          option.strike,
          T,
          riskFreeRate,
          option.type === 'call'
        );
        if (iv > 0 && iv < 500) { // Reasonable bounds
          ivs.push(iv);
        }
      } catch (error) {
        logger.warn('Error calculating IV for option:', { error: error.message, option });
      }
    }

    if (ivs.length === 0) return null;

    return math.mean(ivs);
  }
}

module.exports = VolatilityEngine;