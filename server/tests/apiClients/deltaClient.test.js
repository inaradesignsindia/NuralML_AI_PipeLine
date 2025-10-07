const nock = require('nock');
const DeltaClient = require('../../apiClients/deltaClient');
const { mockApiResponses } = require('../mocks/mockData');

// Mock WebSocket
jest.mock('ws', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
    send: jest.fn()
  }));
});

describe('DeltaClient', () => {
  let client;

  beforeEach(() => {
    client = new DeltaClient('test-api-key', 'test-secret-key');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getTickerPrice', () => {
    it('should return ticker price data', async () => {
      nock('https://api.delta.exchange')
        .get('/v2/tickers/BTCUSDT')
        .reply(200, mockApiResponses.delta.ticker);

      const result = await client.getTickerPrice('BTCUSDT');

      expect(result).toEqual(mockApiResponses.delta.ticker);
    });

    it('should handle API errors', async () => {
      nock('https://api.delta.exchange')
        .get('/v2/tickers/INVALID')
        .reply(404, { error: 'Symbol not found' });

      await expect(client.getTickerPrice('INVALID')).rejects.toThrow('Delta API error');
    });
  });

  describe('getOptionsData', () => {
    it('should return formatted options data', async () => {
      const mockOptionsResponse = {
        result: [
          {
            symbol: 'BTCUSDT-20231014-45000-C',
            underlying_asset: 'BTCUSDT',
            strike_price: '45000',
            contract_type: 'CALL',
            mark_price: '1500',
            expiry_date: '2023-10-14T16:00:00Z',
            volume_24h: '100',
            open_interest: '500'
          }
        ]
      };

      nock('https://api.delta.exchange')
        .get('/v2/options/index')
        .query({ underlying_asset: 'BTCUSDT', contract_type: 'call_put' })
        .reply(200, mockOptionsResponse);

      const result = await client.getOptionsData('BTCUSDT');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('strike');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('price');
    });

    it('should handle API errors gracefully', async () => {
      nock('https://api.delta.exchange')
        .get('/v2/options/index')
        .query({ underlying_asset: 'INVALID', contract_type: 'call_put' })
        .reply(500, { error: 'Server error' });

      const result = await client.getOptionsData('INVALID');

      expect(result).toEqual([]);
    });
  });

  describe('calculateDaysToExpiration', () => {
    it('should calculate days to expiration correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const days = client.calculateDaysToExpiration(futureDate.toISOString());

      expect(days).toBeGreaterThan(6);
      expect(days).toBeLessThan(8);
    });

    it('should return 0 for past dates', () => {
      const pastDate = '2020-01-01T00:00:00Z';

      const days = client.calculateDaysToExpiration(pastDate);

      expect(days).toBe(0);
    });
  });
});