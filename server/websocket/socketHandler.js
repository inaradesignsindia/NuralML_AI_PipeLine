const BinanceClient = require('../apiClients/binanceClient');
const DeltaClient = require('../apiClients/deltaClient');
const { wsRateLimiter } = require('../middleware/rateLimit');
const AlertManager = require('../modules/alertManager');
const logger = require('../logger');

const binance = new BinanceClient(process.env.BINANCE_API_KEY, process.env.BINANCE_SECRET_KEY);
const delta = new DeltaClient(process.env.DELTA_API_KEY, process.env.DELTA_SECRET_KEY);

// MarketContext to aggregate data from multiple exchanges
class MarketContext {
  constructor() {
    this.data = new Map(); // symbol -> { binance: {...}, delta: {...} }
    this.subscribers = new Map(); // symbol -> Set of socket IDs
    this.activeSubscriptions = new Map(); // symbol -> { binance: boolean, delta: boolean }
  }

  updateData(exchange, symbol, data) {
    if (!this.data.has(symbol)) {
      this.data.set(symbol, {});
    }

    const symbolData = this.data.get(symbol);
    symbolData[exchange] = {
      ...symbolData[exchange],
      ...data,
      lastUpdate: Date.now()
    };

    // Broadcast to subscribers
    this.broadcastUpdate(symbol);
  }

  broadcastUpdate(symbol) {
    const subscribers = this.subscribers.get(symbol);
    if (subscribers && subscribers.size > 0) {
      const marketData = this.getMarketData(symbol);
      subscribers.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('market-update', { symbol, data: marketData });
        }
      });
    }
  }

  getMarketData(symbol) {
    const symbolData = this.data.get(symbol) || {};
    return {
      symbol,
      exchanges: {
        binance: symbolData.binance || null,
        delta: symbolData.delta || null
      },
      aggregated: this.aggregateData(symbolData)
    };
  }

  aggregateData(symbolData) {
    const binance = symbolData.binance || {};
    const delta = symbolData.delta || {};
    const dapp = symbolData.dapp || {};

    // Aggregate ticker data
    const aggregatedTicker = this.aggregateTicker(binance.ticker, delta.ticker);

    // Aggregate order book
    const aggregatedOrderBook = this.aggregateOrderBook(binance.orderBook, delta.orderBook);

    // Recent trades (combine from both exchanges)
    const recentTrades = this.combineTrades(binance.trade, delta.trade);

    // Include DAPP data
    const sentiment = dapp.sentiment;
    const volatility = dapp.volatility;
    const accountBalance = dapp.accountBalance;

    return {
      ticker: aggregatedTicker,
      orderBook: aggregatedOrderBook,
      recentTrades: recentTrades,
      sentiment: sentiment,
      volatility: volatility,
      accountBalance: accountBalance,
      lastUpdate: Math.max(
        binance.lastUpdate || 0,
        delta.lastUpdate || 0,
        dapp.lastDAPPUpdate || 0
      )
    };
  }

  aggregateTicker(binanceTicker, deltaTicker) {
    if (!binanceTicker && !deltaTicker) return null;

    // Use Binance as primary, Delta as secondary
    const primary = binanceTicker || deltaTicker;
    const secondary = binanceTicker ? deltaTicker : null;

    return {
      symbol: primary.symbol,
      price: primary.price,
      volume: primary.volume,
      priceChange: primary.priceChange,
      priceChangePercent: primary.priceChangePercent,
      high: primary.high,
      low: primary.low,
      exchanges: {
        binance: binanceTicker ? {
          price: binanceTicker.price,
          volume: binanceTicker.volume
        } : null,
        delta: deltaTicker ? {
          price: deltaTicker.price,
          volume: deltaTicker.volume
        } : null
      },
      timestamp: primary.timestamp
    };
  }

  aggregateOrderBook(binanceOrderBook, deltaOrderBook) {
    if (!binanceOrderBook && !deltaOrderBook) return null;

    // Combine order books from both exchanges
    const combinedBids = [];
    const combinedAsks = [];

    if (binanceOrderBook) {
      combinedBids.push(...binanceOrderBook.bids);
      combinedAsks.push(...binanceOrderBook.asks);
    }

    if (deltaOrderBook) {
      combinedBids.push(...deltaOrderBook.bids);
      combinedAsks.push(...deltaOrderBook.asks);
    }

    // Sort and limit to top 20 levels
    combinedBids.sort((a, b) => b.price - a.price).splice(20);
    combinedAsks.sort((a, b) => a.price - b.price).splice(20);

    return {
      bids: combinedBids,
      asks: combinedAsks,
      timestamp: Math.max(
        binanceOrderBook?.timestamp || 0,
        deltaOrderBook?.timestamp || 0
      )
    };
  }

  combineTrades(binanceTrade, deltaTrade) {
    const trades = [];

    if (binanceTrade) {
      trades.push({
        ...binanceTrade,
        exchange: 'binance'
      });
    }

    if (deltaTrade) {
      trades.push({
        ...deltaTrade,
        exchange: 'delta'
      });
    }

    // Sort by timestamp, most recent first
    return trades.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }

  subscribe(socket, symbol) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol).add(socket.id);

    // Start WebSocket subscriptions if not already active
    this.ensureSubscription(symbol);

    // Send current data
    const marketData = this.getMarketData(symbol);
    socket.emit('market-update', { symbol, data: marketData });
  }

  unsubscribe(socket, symbol) {
    const subscribers = this.subscribers.get(symbol);
    if (subscribers) {
      subscribers.delete(socket.id);
      if (subscribers.size === 0) {
        this.cleanupSubscription(symbol);
      }
    }
  }

  ensureSubscription(symbol) {
    const active = this.activeSubscriptions.get(symbol) || { binance: false, delta: false };

    if (!active.binance) {
      binance.subscribe(symbol, (data) => {
        this.updateData('binance', symbol, data);
      });
      active.binance = true;
    }

    if (!active.delta) {
      delta.subscribe(symbol, (data) => {
        this.updateData('delta', symbol, data);
      });
      active.delta = true;
    }

    this.activeSubscriptions.set(symbol, active);
  }

  cleanupSubscription(symbol) {
    const active = this.activeSubscriptions.get(symbol);
    if (active) {
      if (active.binance) {
        binance.unsubscribe(symbol);
      }
      if (active.delta) {
        delta.unsubscribe(symbol);
      }
      this.activeSubscriptions.delete(symbol);
    }
    this.subscribers.delete(symbol);
    this.data.delete(symbol);
  }

  setIO(io) {
    this.io = io;
  }
}

function handleSocketConnection(io, alertManager) {
  const marketContext = new MarketContext();
  marketContext.setIO(io);

  // Use shared AlertManager
  marketContext.alertManager = alertManager;

  io.on('connection', (socket) => {
    logger.info('A user connected:', socket.id);

    // Subscribe to market data
    socket.on('subscribe-market', (data) => {
      const { symbol } = data;

      // Rate limiting check
      if (!wsRateLimiter.canSubscribe(socket.id)) {
        socket.emit('error', { message: 'Subscription rate limit exceeded. Please try again later.' });
        return;
      }

      logger.info(`User ${socket.id} subscribing to ${symbol}`);
      marketContext.subscribe(socket, symbol);
    });

    // Unsubscribe from market data
    socket.on('unsubscribe-market', (data) => {
      const { symbol } = data;
      logger.info(`User ${socket.id} unsubscribing from ${symbol}`);
      marketContext.unsubscribe(socket, symbol);
    });

    // Legacy price subscription (for backward compatibility)
    socket.on('subscribe-price', async (data) => {
      const { exchange, symbol } = data;
      // Redirect to new market subscription
      marketContext.subscribe(socket, symbol);
    });

    // Alert-related events
    socket.on('get-alert-history', (data) => {
      const limit = data?.limit || 50;
      const alerts = marketContext.alertManager.getRecentAlerts(limit);
      socket.emit('alert-history', { alerts });
    });

    socket.on('update-alert-thresholds', (data) => {
      if (marketContext.alertManager) {
        marketContext.alertManager.updateThresholds(data.thresholds);
        socket.emit('alert-thresholds-updated', { success: true });
      }
    });

    socket.on('dismiss-alert', (data) => {
      // For now, just acknowledge. In a real app, you'd store dismissed alerts per user
      socket.emit('alert-dismissed', { alertId: data.alertId });
    });

    socket.on('disconnect', () => {
      logger.info('User disconnected:', socket.id);
      // Clean up subscriptions for this socket
      marketContext.subscribers.forEach((subscribers, symbol) => {
        if (subscribers.has(socket.id)) {
          marketContext.unsubscribe(socket, symbol);
        }
      });
    });
  });

  return marketContext;
}

module.exports = handleSocketConnection;