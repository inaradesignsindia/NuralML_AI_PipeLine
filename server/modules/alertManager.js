const logger = require('../logger');

class AlertManager {
  constructor(io) {
    this.io = io;
    this.alerts = [];
    this.previousData = new Map(); // Store previous values for comparison
    this.alertThresholds = {
      volatilitySpike: 50, // 50% increase
      sentimentShift: 20,  // 20% change
      priceGap: 10         // 10% sudden change
    };
  }

  /**
   * Check for market anomalies and generate alerts
   * @param {Object} marketData - Current market data
   * @param {string} symbol - Trading symbol
   */
  checkForAlerts(marketData, symbol) {
    const alerts = [];

    // Check volatility spike
    if (marketData.volatility !== undefined) {
      const prevVolatility = this.previousData.get(`${symbol}_volatility`);
      if (prevVolatility && marketData.volatility > prevVolatility * (1 + this.alertThresholds.volatilitySpike / 100)) {
        const alert = {
          id: Date.now() + Math.random(),
          type: 'volatility_spike',
          symbol,
          message: `Volatility spike detected for ${symbol}: ${marketData.volatility.toFixed(2)}% (previous: ${prevVolatility.toFixed(2)}%)`,
          severity: 'high',
          timestamp: new Date().toISOString(),
          data: {
            current: marketData.volatility,
            previous: prevVolatility,
            change: ((marketData.volatility - prevVolatility) / prevVolatility * 100).toFixed(2)
          }
        };
        alerts.push(alert);
        logger.warn('Volatility spike alert', alert);
      }
      this.previousData.set(`${symbol}_volatility`, marketData.volatility);
    }

    // Check sentiment shift
    if (marketData.sentiment !== undefined) {
      const prevSentiment = this.previousData.get(`${symbol}_sentiment`);
      if (prevSentiment !== undefined) {
        const sentimentChange = Math.abs(marketData.sentiment - prevSentiment);
        if (sentimentChange > this.alertThresholds.sentimentShift) {
          const alert = {
            id: Date.now() + Math.random(),
            type: 'sentiment_shift',
            symbol,
            message: `Sentiment shift detected for ${symbol}: ${marketData.sentiment.toFixed(2)} (previous: ${prevSentiment.toFixed(2)})`,
            severity: 'medium',
            timestamp: new Date().toISOString(),
            data: {
              current: marketData.sentiment,
              previous: prevSentiment,
              change: sentimentChange.toFixed(2)
            }
          };
          alerts.push(alert);
          logger.info('Sentiment shift alert', alert);
        }
      }
      this.previousData.set(`${symbol}_sentiment`, marketData.sentiment);
    }

    // Check price gap
    if (marketData.price !== undefined) {
      const prevPrice = this.previousData.get(`${symbol}_price`);
      if (prevPrice) {
        const priceChange = Math.abs((marketData.price - prevPrice) / prevPrice * 100);
        if (priceChange > this.alertThresholds.priceGap) {
          const alert = {
            id: Date.now() + Math.random(),
            type: 'price_gap',
            symbol,
            message: `Price gap detected for ${symbol}: ${marketData.price.toFixed(2)} (previous: ${prevPrice.toFixed(2)})`,
            severity: 'high',
            timestamp: new Date().toISOString(),
            data: {
              current: marketData.price,
              previous: prevPrice,
              changePercent: priceChange.toFixed(2)
            }
          };
          alerts.push(alert);
          logger.warn('Price gap alert', alert);
        }
      }
      this.previousData.set(`${symbol}_price`, marketData.price);
    }

    // Emit alerts via WebSocket
    alerts.forEach(alert => {
      this.emitAlert(alert);
    });

    return alerts;
  }

  /**
   * Emit alert to connected clients
   * @param {Object} alert - Alert object
   */
  emitAlert(alert) {
    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Emit to all connected clients
    this.io.emit('alert', alert);

    logger.info(`Alert emitted: ${alert.type} for ${alert.symbol}`);
  }

  /**
   * Get recent alerts
   * @param {number} limit - Number of alerts to return
   * @returns {Array} Recent alerts
   */
  getRecentAlerts(limit = 50) {
    return this.alerts.slice(-limit);
  }

  /**
   * Update alert thresholds
   * @param {Object} thresholds - New thresholds
   */
  updateThresholds(thresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    logger.info('Alert thresholds updated', this.alertThresholds);
  }

  /**
   * Clear previous data for a symbol
   * @param {string} symbol - Trading symbol
   */
  clearSymbolData(symbol) {
    const keysToDelete = [];
    this.previousData.forEach((value, key) => {
      if (key.startsWith(`${symbol}_`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.previousData.delete(key));
    logger.info(`Cleared previous data for symbol: ${symbol}`);
  }
}

module.exports = AlertManager;