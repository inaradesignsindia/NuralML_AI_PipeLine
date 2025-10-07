const axios = require('axios');
const crypto = require('crypto');
const WebSocket = require('ws');

class BinanceClient {
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.baseUrl = 'https://api.binance.com';
    this.wsUrl = 'wss://stream.binance.com:9443/ws';
    this.connections = new Map(); // symbol -> ws connection
    this.subscriptions = new Map(); // symbol -> Set of streams
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.dataCallbacks = new Map();
  }

  async getTickerPrice(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/ticker/price`, {
        params: { symbol }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Binance API error: ${error.message}`);
    }
  }

  async getHistoricalData(symbol, interval = '1d', limit = 100) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/klines`, {
        params: { symbol, interval, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Binance API error: ${error.message}`);
    }
  }

  // WebSocket connection management
  connect(symbol, streams = ['ticker', 'depth', 'trade']) {
    if (this.connections.has(symbol)) {
      return this.connections.get(symbol);
    }

    const streamsParam = streams.map(stream => {
      switch (stream) {
        case 'ticker': return `${symbol.toLowerCase()}@ticker`;
        case 'depth': return `${symbol.toLowerCase()}@depth@100ms`; // Level 2 order book
        case 'trade': return `${symbol.toLowerCase()}@trade`;
        default: return stream;
      }
    }).join('/');

    const wsUrl = `${this.wsUrl}/${streamsParam}`;
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log(`Binance WebSocket connected for ${symbol}`);
      this.reconnectAttempts.set(symbol, 0);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(symbol, message);
      } catch (error) {
        console.error('Error parsing Binance WebSocket message:', error);
      }
    });

    ws.on('error', (error) => {
      console.error(`Binance WebSocket error for ${symbol}:`, error);
    });

    ws.on('close', () => {
      console.log(`Binance WebSocket closed for ${symbol}`);
      this.handleReconnect(symbol, streams);
    });

    this.connections.set(symbol, ws);
    this.subscriptions.set(symbol, new Set(streams));
    return ws;
  }

  handleReconnect(symbol, streams) {
    const attempts = this.reconnectAttempts.get(symbol) || 0;
    if (attempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, attempts); // Exponential backoff
      console.log(`Reconnecting Binance WebSocket for ${symbol} in ${delay}ms (attempt ${attempts + 1})`);
      setTimeout(() => {
        this.reconnectAttempts.set(symbol, attempts + 1);
        this.connections.delete(symbol);
        this.connect(symbol, streams);
      }, delay);
    } else {
      console.error(`Max reconnection attempts reached for Binance ${symbol}`);
    }
  }

  handleMessage(symbol, message) {
    const callback = this.dataCallbacks.get(symbol);
    if (callback) {
      let normalizedData = {};

      if (message.stream?.includes('ticker')) {
        normalizedData.ticker = {
          symbol: message.data.s,
          price: parseFloat(message.data.c),
          volume: parseFloat(message.data.v),
          priceChange: parseFloat(message.data.p),
          priceChangePercent: parseFloat(message.data.P),
          high: parseFloat(message.data.h),
          low: parseFloat(message.data.l),
          timestamp: message.data.E
        };
      } else if (message.stream?.includes('depth')) {
        normalizedData.orderBook = {
          symbol: message.data.s,
          bids: message.data.bids.map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity)
          })),
          asks: message.data.asks.map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity)
          })),
          timestamp: message.data.E
        };
      } else if (message.stream?.includes('trade')) {
        normalizedData.trade = {
          symbol: message.data.s,
          price: parseFloat(message.data.p),
          quantity: parseFloat(message.data.q),
          timestamp: message.data.T,
          isBuyerMaker: message.data.m,
          tradeId: message.data.t
        };
      }

      callback(normalizedData);
    }
  }

  subscribe(symbol, callback, streams = ['ticker', 'depth', 'trade']) {
    this.dataCallbacks.set(symbol, callback);
    this.connect(symbol, streams);
  }

  unsubscribe(symbol) {
    const ws = this.connections.get(symbol);
    if (ws) {
      ws.close();
      this.connections.delete(symbol);
      this.subscriptions.delete(symbol);
      this.dataCallbacks.delete(symbol);
      this.reconnectAttempts.delete(symbol);
    }
  }

  // Rate limiting helper
  async throttleRequest(requestFn, delay = 100) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        resolve(await requestFn());
      }, delay);
    });
  }
}

module.exports = BinanceClient;