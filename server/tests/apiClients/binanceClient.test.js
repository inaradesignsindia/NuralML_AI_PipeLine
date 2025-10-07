const nock = require('nock');
const BinanceClient = require('../../apiClients/binanceClient');
const { mockApiResponses } = require('../mocks/mockData');

// Mock WebSocket
jest.mock('ws', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
    send: jest.fn()
  }));
});

describe('BinanceClient', () => {
  let client;

  beforeEach(() => {
    client = new BinanceClient('test-api-key', 'test-secret-key');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getTickerPrice', () => {
    it('should return ticker price data', async () => {
      nock('https://api.binance.com')
        .get('/api/v3/ticker/price')
        .query({ symbol: 'BTCUSDT' })
        .reply(200, mockApiResponses.binance.tickerPrice);

      const result = await client.getTickerPrice('BTCUSDT');

      expect(result).toEqual(mockApiResponses.binance.tickerPrice);
      expect(result.symbol).toBe('BTCUSDT');
      expect(result.price).toBe('45000.00');
    });

    it('should handle API errors', async () => {
      nock('https://api.binance.com')
        .get('/api/v3/ticker/price')
        .query({ symbol: 'INVALID' })
        .reply(400, { code: -1121, msg: 'Invalid symbol' });

      await expect(client.getTickerPrice('INVALID')).rejects.toThrow('Binance API error');
    });
  });

  describe('getHistoricalData', () => {
    it('should return historical kline data', async () => {
      nock('https://api.binance.com')
        .get('/api/v3/klines')
        .query({ symbol: 'BTCUSDT', interval: '1d', limit: 100 })
        .reply(200, mockApiResponses.binance.historicalData);

      const result = await client.getHistoricalData('BTCUSDT', '1d', 100);

      expect(result).toEqual(mockApiResponses.binance.historicalData);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should use default parameters', async () => {
      nock('https://api.binance.com')
        .get('/api/v3/klines')
        .query({ symbol: 'BTCUSDT', interval: '1d', limit: 100 })
        .reply(200, mockApiResponses.binance.historicalData);

      const result = await client.getHistoricalData('BTCUSDT');

      expect(result).toEqual(mockApiResponses.binance.historicalData);
    });

    it('should handle network errors', async () => {
      nock('https://api.binance.com')
        .get('/api/v3/klines')
        .query({ symbol: 'BTCUSDT', interval: '1d', limit: 100 })
        .replyWithError('Network error');

      await expect(client.getHistoricalData('BTCUSDT')).rejects.toThrow('Binance API error');
    });
  });

  describe('WebSocket functionality', () => {
    it('should create WebSocket connection', () => {
      const ws = client.connect('BTCUSDT', ['ticker']);

      expect(ws).toBeDefined();
      expect(client.connections.has('BTCUSDT')).toBe(true);
      expect(client.subscriptions.get('BTCUSDT')).toEqual(new Set(['ticker']));
    });

    it('should handle message parsing for ticker data', () => {
      const mockCallback = jest.fn();
      client.dataCallbacks.set('BTCUSDT', mockCallback);

      // Mock WebSocket message handling
      const message = mockApiResponses.binance.websocketMessage;
      client.handleMessage('BTCUSDT', message);

      expect(mockCallback).toHaveBeenCalled();
      const calledData = mockCallback.mock.calls[0][0];
      expect(calledData.ticker).toBeDefined();
      expect(calledData.ticker.symbol).toBe('BTCUSDT');
      expect(calledData.ticker.price).toBe(44500);
    });

    it('should unsubscribe from WebSocket', () => {
      client.connect('BTCUSDT');
      expect(client.connections.has('BTCUSDT')).toBe(true);

      client.unsubscribe('BTCUSDT');
      expect(client.connections.has('BTCUSDT')).toBe(false);
      expect(client.subscriptions.has('BTCUSDT')).toBe(false);
      expect(client.dataCallbacks.has('BTCUSDT')).toBe(false);
    });
  });

  describe('throttleRequest', () => {
    it('should throttle requests', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const startTime = Date.now();

      const result = await client.throttleRequest(mockFn, 50);

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(45); // Allow some tolerance
      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});