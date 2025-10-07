const axios = require('axios');
const { retryWithBackoff, isRetryableError } = require('../utils/retry');
const logger = require('../logger');

class CoinGeckoClient {
  constructor() {
    this.baseUrl = 'https://api.coingecko.com/api/v3';
  }

  async getHistoricalData(coinId, days = 30) {
    try {
      const response = await retryWithBackoff(
        () => axios.get(`${this.baseUrl}/coins/${coinId}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: days,
            interval: 'daily'
          }
        }),
        {
          maxRetries: 3,
          retryCondition: isRetryableError,
          onRetry: (attempt, error, delay) => {
            logger.warn(`Retrying CoinGecko getHistoricalData (attempt ${attempt}) after ${delay}ms: ${error.message}`);
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`CoinGecko API error in getHistoricalData: ${error.message}`, { coinId, days });
      throw new Error(`CoinGecko API error: ${error.message}`);
    }
  }

  async getCoinList() {
    try {
      const response = await retryWithBackoff(
        () => axios.get(`${this.baseUrl}/coins/list`),
        {
          maxRetries: 3,
          retryCondition: isRetryableError,
          onRetry: (attempt, error, delay) => {
            logger.warn(`Retrying CoinGecko getCoinList (attempt ${attempt}) after ${delay}ms: ${error.message}`);
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`CoinGecko API error in getCoinList: ${error.message}`);
      throw new Error(`CoinGecko API error: ${error.message}`);
    }
  }

  // Add more methods as needed
}

module.exports = CoinGeckoClient;