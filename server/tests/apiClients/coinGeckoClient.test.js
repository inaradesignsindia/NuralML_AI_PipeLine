const nock = require('nock');
const CoinGeckoClient = require('../../apiClients/coinGeckoClient');
const { mockApiResponses } = require('../mocks/mockData');

describe('CoinGeckoClient', () => {
  let client;

  beforeEach(() => {
    client = new CoinGeckoClient();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getHistoricalData', () => {
    it('should return historical market data', async () => {
      nock('https://api.coingecko.com')
        .get('/api/v3/coins/bitcoin/market_chart')
        .query({ vs_currency: 'usd', days: 30, interval: 'daily' })
        .reply(200, mockApiResponses.coinGecko.priceData);

      const result = await client.getHistoricalData('bitcoin', 30);

      expect(result).toEqual(mockApiResponses.coinGecko.priceData);
    });

    it('should handle API errors', async () => {
      nock('https://api.coingecko.com')
        .get('/api/v3/coins/invalid/market_chart')
        .query({ vs_currency: 'usd', days: 30, interval: 'daily' })
        .reply(404, { error: 'Coin not found' });

      await expect(client.getHistoricalData('invalid', 30)).rejects.toThrow('CoinGecko API error');
    });
  });

  describe('getCoinList', () => {
    it('should return list of coins', async () => {
      nock('https://api.coingecko.com')
        .get('/api/v3/coins/list')
        .reply(200, mockApiResponses.coinGecko.marketData);

      const result = await client.getCoinList();

      expect(result).toEqual(mockApiResponses.coinGecko.marketData);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle network errors', async () => {
      nock('https://api.coingecko.com')
        .get('/api/v3/coins/list')
        .replyWithError('Network error');

      await expect(client.getCoinList()).rejects.toThrow('CoinGecko API error');
    });
  });
});