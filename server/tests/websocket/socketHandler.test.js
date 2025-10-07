const handleSocketConnection = require('../../websocket/socketHandler');
const BinanceClient = require('../../apiClients/binanceClient');
const DeltaClient = require('../../apiClients/deltaClient');
const { mockWebSocketData } = require('../mocks/mockData');

// Mock dependencies
jest.mock('../../apiClients/binanceClient');
jest.mock('../../apiClients/deltaClient');
jest.mock('../../middleware/rateLimit');
jest.mock('../../modules/alertManager');
jest.mock('../../logger');

describe('Socket Handler', () => {
  let mockIO;
  let mockSocket;
  let mockAlertManager;
  let marketContext;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock clients
    BinanceClient.mockImplementation(() => ({
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    }));

    DeltaClient.mockImplementation(() => ({
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    }));

    // Mock rate limiter
    const { wsRateLimiter } = require('../../middleware/rateLimit');
    wsRateLimiter.canSubscribe = jest.fn().mockReturnValue(true);

    // Mock alert manager
    mockAlertManager = {
      getRecentAlerts: jest.fn().mockReturnValue([]),
      updateThresholds: jest.fn()
    };

    // Mock socket.io
    mockSocket = {
      id: 'socket123',
      emit: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn()
    };

    mockIO = {
      on: jest.fn((event, callback) => {
        if (event === 'connection') {
          callback(mockSocket);
        }
      }),
      sockets: {
        sockets: {
          get: jest.fn().mockReturnValue(mockSocket)
        }
      }
    };

    marketContext = handleSocketConnection(mockIO, mockAlertManager);
  });

  describe('MarketContext', () => {
    describe('updateData', () => {
      it('should update data and broadcast to subscribers', () => {
        const symbol = 'BTCUSDT';
        const data = { ticker: { price: 45000 } };

        // Add a subscriber
        marketContext.subscribers.set(symbol, new Set(['socket123']));

        marketContext.updateData('binance', symbol, data);

        expect(marketContext.data.get(symbol).binance).toEqual({
          ...data,
          lastUpdate: expect.any(Number)
        });
        expect(mockSocket.emit).toHaveBeenCalledWith('market-update', {
          symbol,
          data: expect.objectContaining({
            symbol,
            exchanges: expect.any(Object),
            aggregated: expect.any(Object)
          })
        });
      });

      it('should not broadcast if no subscribers', () => {
        const symbol = 'BTCUSDT';
        const data = { ticker: { price: 45000 } };

        marketContext.updateData('binance', symbol, data);

        expect(mockSocket.emit).not.toHaveBeenCalled();
      });
    });

    describe('getMarketData', () => {
      it('should return formatted market data', () => {
        const symbol = 'BTCUSDT';
        marketContext.data.set(symbol, {
          binance: { ticker: { price: 45000 } },
          delta: { ticker: { price: 44900 } }
        });

        const result = marketContext.getMarketData(symbol);

        expect(result.symbol).toBe(symbol);
        expect(result.exchanges.binance).toBeDefined();
        expect(result.exchanges.delta).toBeDefined();
        expect(result.aggregated).toBeDefined();
      });

      it('should handle missing data', () => {
        const result = marketContext.getMarketData('NONEXISTENT');

        expect(result.exchanges.binance).toBeNull();
        expect(result.exchanges.delta).toBeNull();
      });
    });

    describe('aggregateData', () => {
      it('should aggregate data from multiple exchanges', () => {
        const symbolData = {
          binance: {
            ticker: mockWebSocketData.binance.ticker,
            orderBook: mockWebSocketData.binance.orderBook,
            trade: mockWebSocketData.binance.trade,
            lastUpdate: Date.now()
          },
          delta: {
            ticker: { price: 44900, volume: 1000 },
            lastUpdate: Date.now()
          },
          dapp: {
            sentiment: { overall: { compound: 0.2 } },
            volatility: { historicalVolatility: 25 },
            accountBalance: { total: 10000 }
          }
        };

        const result = marketContext.aggregateData(symbolData);

        expect(result.ticker).toBeDefined();
        expect(result.orderBook).toBeDefined();
        expect(result.recentTrades).toBeDefined();
        expect(result.sentiment).toBeDefined();
        expect(result.volatility).toBeDefined();
        expect(result.accountBalance).toBeDefined();
      });
    });

    describe('aggregateTicker', () => {
      it('should aggregate ticker data from multiple exchanges', () => {
        const binanceTicker = mockWebSocketData.binance.ticker;
        const deltaTicker = { ...binanceTicker, price: 44900 };

        const result = marketContext.aggregateTicker(binanceTicker, deltaTicker);

        expect(result.symbol).toBe(binanceTicker.symbol);
        expect(result.price).toBe(binanceTicker.price); // Primary exchange
        expect(result.exchanges.binance).toBeDefined();
        expect(result.exchanges.delta).toBeDefined();
      });

      it('should handle missing primary exchange', () => {
        const deltaTicker = mockWebSocketData.binance.ticker;

        const result = marketContext.aggregateTicker(null, deltaTicker);

        expect(result.price).toBe(deltaTicker.price);
        expect(result.exchanges.binance).toBeNull();
        expect(result.exchanges.delta).toBeDefined();
      });
    });

    describe('aggregateOrderBook', () => {
      it('should combine order books from multiple exchanges', () => {
        const binanceOrderBook = mockWebSocketData.binance.orderBook;
        const deltaOrderBook = {
          ...binanceOrderBook,
          bids: [{ price: 44300, quantity: 5 }],
          asks: [{ price: 44600, quantity: 3 }]
        };

        const result = marketContext.aggregateOrderBook(binanceOrderBook, deltaOrderBook);

        expect(result.bids).toBeDefined();
        expect(result.asks).toBeDefined();
        expect(result.bids.length).toBeGreaterThan(0);
        expect(result.asks.length).toBeGreaterThan(0);
      });

      it('should handle missing order books', () => {
        const result = marketContext.aggregateOrderBook(null, null);

        expect(result).toBeNull();
      });
    });

    describe('combineTrades', () => {
      it('should combine and sort trades from multiple exchanges', () => {
        const binanceTrade = mockWebSocketData.binance.trade;
        const deltaTrade = { ...binanceTrade, price: 44900, timestamp: Date.now() + 1000 };

        const result = marketContext.combineTrades(binanceTrade, deltaTrade);

        expect(result).toHaveLength(2);
        expect(result[0].exchange).toBeDefined();
        expect(result[0].timestamp).toBeGreaterThanOrEqual(result[1].timestamp);
      });
    });

    describe('subscribe and unsubscribe', () => {
      it('should subscribe to market data', () => {
        const symbol = 'BTCUSDT';

        marketContext.subscribe(mockSocket, symbol);

        expect(marketContext.subscribers.get(symbol)).toContain('socket123');
        expect(mockSocket.emit).toHaveBeenCalledWith('market-update', expect.any(Object));
      });

      it('should unsubscribe from market data', () => {
        const symbol = 'BTCUSDT';
        marketContext.subscribers.set(symbol, new Set(['socket123']));

        marketContext.unsubscribe(mockSocket, symbol);

        expect(marketContext.subscribers.has(symbol)).toBe(false);
      });

      it('should cleanup subscription when no subscribers left', () => {
        const symbol = 'BTCUSDT';
        marketContext.subscribers.set(symbol, new Set(['socket123']));
        marketContext.activeSubscriptions.set(symbol, { binance: true, delta: true });

        marketContext.unsubscribe(mockSocket, symbol);

        expect(marketContext.subscribers.has(symbol)).toBe(false);
        expect(marketContext.activeSubscriptions.has(symbol)).toBe(false);
        expect(marketContext.data.has(symbol)).toBe(false);
      });
    });

    describe('ensureSubscription', () => {
      it('should start WebSocket subscriptions', () => {
        const symbol = 'BTCUSDT';

        marketContext.ensureSubscription(symbol);

        const active = marketContext.activeSubscriptions.get(symbol);
        expect(active.binance).toBe(true);
        expect(active.delta).toBe(true);
      });
    });
  });

  describe('Socket Events', () => {
    it('should handle subscribe-market event', () => {
      // The connection callback should have been called in beforeEach
      // Now trigger the subscribe-market event
      const subscribeCallback = mockSocket.on.mock.calls.find(call => call[0] === 'subscribe-market')[1];
      const symbol = 'BTCUSDT';

      subscribeCallback({ symbol });

      expect(marketContext.subscribers.get(symbol)).toContain('socket123');
    });

    it('should handle unsubscribe-market event', () => {
      // Setup subscription first
      marketContext.subscribers.set('BTCUSDT', new Set(['socket123']));

      const unsubscribeCallback = mockSocket.on.mock.calls.find(call => call[0] === 'unsubscribe-market')[1];

      unsubscribeCallback({ symbol: 'BTCUSDT' });

      expect(marketContext.subscribers.has('BTCUSDT')).toBe(false);
    });

    it('should handle rate limit exceeded', () => {
      const { wsRateLimiter } = require('../../middleware/rateLimit');
      wsRateLimiter.canSubscribe.mockReturnValue(false);

      const subscribeCallback = mockSocket.on.mock.calls.find(call => call[0] === 'subscribe-market')[1];

      subscribeCallback({ symbol: 'BTCUSDT' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Subscription rate limit exceeded. Please try again later.'
      });
    });

    it('should handle get-alert-history event', () => {
      const alertCallback = mockSocket.on.mock.calls.find(call => call[0] === 'get-alert-history')[1];

      alertCallback({ limit: 10 });

      expect(mockAlertManager.getRecentAlerts).toHaveBeenCalledWith(10);
      expect(mockSocket.emit).toHaveBeenCalledWith('alert-history', { alerts: [] });
    });

    it('should handle update-alert-thresholds event', () => {
      const updateCallback = mockSocket.on.mock.calls.find(call => call[0] === 'update-alert-thresholds')[1];

      updateCallback({ thresholds: { volatility: 30 } });

      expect(mockAlertManager.updateThresholds).toHaveBeenCalledWith({ volatility: 30 });
      expect(mockSocket.emit).toHaveBeenCalledWith('alert-thresholds-updated', { success: true });
    });

    it('should handle disconnect event', () => {
      // Setup subscription
      marketContext.subscribers.set('BTCUSDT', new Set(['socket123']));

      const disconnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];

      disconnectCallback();

      expect(marketContext.subscribers.has('BTCUSDT')).toBe(false);
    });
  });
});