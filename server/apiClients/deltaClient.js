const axios = require('axios');
const crypto = require('crypto');
const WebSocket = require('ws');

class DeltaClient {
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.baseUrl = 'https://api.delta.exchange';
    this.wsUrl = 'wss://socket.delta.exchange';
    this.connections = new Map(); // symbol -> ws connection
    this.subscriptions = new Map(); // symbol -> Set of streams
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.dataCallbacks = new Map();
  }

  async getTickerPrice(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/tickers/${symbol}`);
      return response.data;
    } catch (error) {
      throw new Error(`Delta API error: ${error.message}`);
    }
  }

  async getHistoricalData(symbol, resolution = '1D', limit = 100) {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/history/candles`, {
        params: { symbol, resolution, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Delta API error: ${error.message}`);
    }
  }

  async getOptionsData(underlyingSymbol = 'BTCUSD') {
    try {
      // Get options chain for the underlying asset
      const response = await axios.get(`${this.baseUrl}/v2/options/index`, {
        params: {
          underlying_asset: underlyingSymbol,
          contract_type: 'call_put' // Get both calls and puts
        }
      });

      const options = response.data.result || [];

      // Format options data for IV calculation
      return options.map(option => ({
        symbol: option.symbol,
        underlying: option.underlying_asset,
        strike: parseFloat(option.strike_price),
        type: option.contract_type.toLowerCase(), // 'call' or 'put'
        price: parseFloat(option.mark_price || option.last_price),
        expiration: option.expiry_date, // ISO date string
        expirationDays: this.calculateDaysToExpiration(option.expiry_date),
        volume: parseInt(option.volume_24h || 0),
        openInterest: parseInt(option.open_interest || 0)
      })).filter(option => option.price > 0 && option.expirationDays > 0);
    } catch (error) {
      console.warn(`Delta options API error for ${underlyingSymbol}:`, error.message);
      // Return empty array as fallback
      return [];
    }
  }

  calculateDaysToExpiration(expiryDate) {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(0, diffDays);
  }

  // WebSocket connection management
  connect(symbol, streams = ['ticker', 'l2_orderbook', 'trades']) {
    if (this.connections.has(symbol)) {
      return this.connections.get(symbol);
    }

    const ws = new WebSocket(this.wsUrl);

    ws.on('open', () => {
      console.log(`Delta WebSocket connected for ${symbol}`);
      this.reconnectAttempts.set(symbol, 0);

      // Subscribe to streams
      const subscriptionMessage = {
        type: 'subscribe',
        payload: {
          channels: streams.map(stream => {
            switch (stream) {
              case 'ticker': return { name: 'ticker', symbol: symbol };
              case 'l2_orderbook': return { name: 'l2_orderbook', symbol: symbol };
              case 'trades': return { name: 'trades', symbol: symbol };
              default: return { name: stream, symbol: symbol };
            }
          })
        }
      };

      ws.send(JSON.stringify(subscriptionMessage));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(symbol, message);
      } catch (error) {
        console.error('Error parsing Delta WebSocket message:', error);
      }
    });

    ws.on('error', (error) => {
      console.error(`Delta WebSocket error for ${symbol}:`, error);
    });

    ws.on('close', () => {
      console.log(`Delta WebSocket closed for ${symbol}`);
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
      console.log(`Reconnecting Delta WebSocket for ${symbol} in ${delay}ms (attempt ${attempts + 1})`);
      setTimeout(() => {
        this.reconnectAttempts.set(symbol, attempts + 1);
        this.connections.delete(symbol);
        this.connect(symbol, streams);
      }, delay);
    } else {
      console.error(`Max reconnection attempts reached for Delta ${symbol}`);
    }
  }

  handleMessage(symbol, message) {
    const callback = this.dataCallbacks.get(symbol);
    if (callback && message.type === 'data') {
      let normalizedData = {};

      if (message.channel === 'ticker') {
        const data = message.data;
        normalizedData.ticker = {
          symbol: data.symbol,
          price: parseFloat(data.close),
          volume: parseFloat(data.volume),
          priceChange: parseFloat(data.change_24h),
          priceChangePercent: parseFloat(data.change_percentage_24h),
          high: parseFloat(data.high_24h),
          low: parseFloat(data.low_24h),
          timestamp: data.timestamp
        };
      } else if (message.channel === 'l2_orderbook') {
        const data = message.data;
        normalizedData.orderBook = {
          symbol: data.symbol,
          bids: data.bids.map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity)
          })),
          asks: data.asks.map(([price, quantity]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity)
          })),
          timestamp: data.timestamp
        };
      } else if (message.channel === 'trades') {
        const data = message.data;
        normalizedData.trade = {
          symbol: data.symbol,
          price: parseFloat(data.price),
          quantity: parseFloat(data.size),
          timestamp: data.timestamp,
          isBuyerMaker: data.side === 'sell', // Delta uses 'buy'/'sell', map to maker logic
          tradeId: data.trade_id
        };
      }

      callback(normalizedData);
    }
  }

  subscribe(symbol, callback, streams = ['ticker', 'l2_orderbook', 'trades']) {
    this.dataCallbacks.set(symbol, callback);
    this.connect(symbol, streams);
  }

  unsubscribe(symbol) {
    const ws = this.connections.get(symbol);
    if (ws) {
      // Send unsubscribe message
      const unsubscribeMessage = {
        type: 'unsubscribe',
        payload: {
          channels: Array.from(this.subscriptions.get(symbol) || []).map(stream => ({
            name: stream,
            symbol: symbol
          }))
        }
      };
      ws.send(JSON.stringify(unsubscribeMessage));

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

module.exports = DeltaClient;