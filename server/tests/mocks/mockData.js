// Mock data utilities for consistent testing

// Mock API responses
const mockApiResponses = {
  binance: {
    tickerPrice: {
      symbol: 'BTCUSDT',
      price: '45000.00'
    },
    historicalData: [
      [1640995200000, '43000.00', '44000.00', '42000.00', '43500.00', '100.0', 1641081600000, '4350000.00', 1000, '50.0', '2175000.00'],
      [1641081600000, '43500.00', '45000.00', '43000.00', '44500.00', '120.0', 1641168000000, '5340000.00', 1200, '60.0', '2670000.00']
    ],
    websocketMessage: {
      stream: 'btcusdt@ticker',
      data: {
        e: '24hrTicker',
        E: 1641168000000,
        s: 'BTCUSDT',
        p: '1500.00',
        P: '3.41',
        w: '44234.56',
        x: '43000.00',
        c: '44500.00',
        Q: '0.00100000',
        b: '44499.00',
        B: '5.00000000',
        a: '44500.00',
        A: '10.00000000',
        o: '43000.00',
        h: '45000.00',
        l: '42000.00',
        v: '1000.00000000',
        q: '44234560.00',
        O: 1641081600000,
        C: 1641168000000,
        F: 1000000,
        L: 1100000,
        n: 100000
      }
    }
  },

  coinGecko: {
    priceData: {
      bitcoin: {
        usd: 45000,
        usd_24h_change: 3.5
      }
    },
    marketData: [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        current_price: 45000,
        market_cap: 850000000000,
        market_cap_rank: 1,
        fully_diluted_valuation: 950000000000,
        total_volume: 25000000000,
        high_24h: 46000,
        low_24h: 43000,
        price_change_24h: 1500,
        price_change_percentage_24h: 3.45,
        market_cap_change_24h: 25000000000,
        market_cap_change_percentage_24h: 3.03,
        circulating_supply: 18800000,
        total_supply: 21000000,
        max_supply: 21000000,
        ath: 69000,
        ath_change_percentage: -34.78,
        ath_date: '2021-11-10T14:24:11.849Z',
        atl: 67.81,
        atl_change_percentage: 66235.45,
        atl_date: '2013-07-05T00:00:00.000Z',
        roi: null,
        last_updated: '2023-10-07T12:00:00.000Z'
      }
    ]
  },

  newsApi: {
    articles: [
      {
        source: { id: 'crypto-news', name: 'Crypto News' },
        author: 'John Doe',
        title: 'Bitcoin surges past $45,000 as institutional adoption grows',
        description: 'Bitcoin has reached new heights as more institutional investors enter the market.',
        url: 'https://crypto-news.com/bitcoin-surges',
        urlToImage: 'https://crypto-news.com/images/bitcoin.jpg',
        publishedAt: '2023-10-07T10:00:00Z',
        content: 'Bitcoin continues its upward trajectory...'
      },
      {
        source: { id: 'blockchain-insider', name: 'Blockchain Insider' },
        author: 'Jane Smith',
        title: 'Ethereum upgrades boost network efficiency',
        description: 'Recent upgrades have significantly improved Ethereum\'s transaction processing.',
        url: 'https://blockchain-insider.com/ethereum-upgrades',
        urlToImage: 'https://blockchain-insider.com/images/ethereum.jpg',
        publishedAt: '2023-10-07T08:00:00Z',
        content: 'Ethereum\'s latest upgrades are showing promising results...'
      }
    ]
  },

  delta: {
    orderBook: {
      symbol: 'BTCUSDT',
      bids: [
        ['44400.00', '1.5'],
        ['44350.00', '2.0'],
        ['44300.00', '3.5']
      ],
      asks: [
        ['44500.00', '1.2'],
        ['44550.00', '2.8'],
        ['44600.00', '4.1']
      ],
      timestamp: 1641168000000
    },
    ticker: {
      symbol: 'BTCUSDT',
      lastPrice: '44500.00',
      bidPrice: '44499.00',
      askPrice: '44501.00',
      volume: '1000.0',
      timestamp: 1641168000000
    }
  },

  gemini: {
    generateJSONResponse: {
      trend_summary: 'Strong bullish momentum with increasing volume',
      support_resistance_levels: {
        support: [43000, 42000, 41000],
        resistance: [45000, 46000, 47000]
      },
      volatility_bias: 'Current IV at 45%, HV at 35% - volatility premium present',
      sentiment_impact: 'Positive sentiment driving upward pressure'
    }
  },

  cohere: {
    generateJSONResponse: {
      trade_type: 'CALL',
      strike_price: 45500,
      expiration: '2023-10-14T16:00:00Z',
      quantity: 10,
      hedge_action: 'SPOT',
      hedge_quantity: 0.1,
      exchange_selection: 'Binance',
      slippage_tolerance: 0.01
    }
  }
};

// Mock AI chain inputs and outputs
const mockAIChainData = {
  marketContext: {
    symbol: 'BTCUSDT',
    currentPrice: 44500,
    volume24h: 1000000,
    orderBook: {
      bids: [[44400, 10], [44300, 15]],
      asks: [[44600, 12], [44700, 8]]
    },
    recentTrades: [
      { price: 44500, quantity: 1, timestamp: Date.now() }
    ],
    volatility: {
      historical: 0.35,
      implied: 0.45
    },
    sentiment: {
      score: 0.7,
      sources: ['news', 'social']
    }
  },

  accountBalance: {
    total: 10000,
    available: 8000,
    currency: 'USDT'
  },

  marketStateReport: {
    trend_summary: 'Bullish trend with strong momentum',
    support_resistance_levels: {
      support: [43000, 42000],
      resistance: [45000, 46000]
    },
    volatility_bias: 'IV > HV indicating premium',
    sentiment_impact: 'Positive sentiment supporting upside'
  },

  strategyRecommendations: [
    {
      confidence_score: 0.85,
      rationale: 'Strong bullish setup with volatility premium',
      delta: 0.6,
      gamma: 0.1,
      vega: 0.3,
      exchange_preference: 'Binance'
    },
    {
      confidence_score: 0.75,
      rationale: 'Moderate bullish momentum',
      delta: 0.4,
      gamma: 0.08,
      vega: 0.25,
      exchange_preference: 'Delta'
    },
    {
      confidence_score: 0.65,
      rationale: 'Conservative approach with hedge',
      delta: 0.2,
      gamma: 0.05,
      vega: 0.15,
      exchange_preference: 'Binance'
    }
  ],

  executableTradeObject: {
    trade_type: 'CALL',
    strike_price: 45500,
    expiration: '2023-10-14T16:00:00Z',
    quantity: 10,
    hedge_action: 'SPOT',
    hedge_quantity: 0.1,
    exchange_selection: 'Binance',
    slippage_tolerance: 0.01
  }
};

// Mock volatility data for testing
const mockVolatilityData = {
  priceHistory: [
    { timestamp: '2023-10-01', price: 42000 },
    { timestamp: '2023-10-02', price: 42500 },
    { timestamp: '2023-10-03', price: 43000 },
    { timestamp: '2023-10-04', price: 43500 },
    { timestamp: '2023-10-05', price: 44000 },
    { timestamp: '2023-10-06', price: 44500 },
    { timestamp: '2023-10-07', price: 45000 }
  ],
  expectedHV: 0.35,
  expectedIV: 0.45
};

// Mock sentiment data
const mockSentimentData = {
  newsArticles: [
    { title: 'Bitcoin surges to new highs', sentiment: 'positive' },
    { title: 'Market volatility increases', sentiment: 'neutral' },
    { title: 'Regulatory concerns emerge', sentiment: 'negative' }
  ],
  expectedScore: 0.2
};

// Mock WebSocket messages
const mockWebSocketData = {
  binance: {
    ticker: {
      symbol: 'BTCUSDT',
      price: 44500,
      volume: 1000,
      priceChange: 1500,
      priceChangePercent: 3.41,
      high: 45000,
      low: 42000,
      timestamp: Date.now()
    },
    orderBook: {
      symbol: 'BTCUSDT',
      bids: [
        { price: 44400, quantity: 1.5 },
        { price: 44350, quantity: 2.0 }
      ],
      asks: [
        { price: 44500, quantity: 1.2 },
        { price: 44550, quantity: 2.8 }
      ],
      timestamp: Date.now()
    },
    trade: {
      symbol: 'BTCUSDT',
      price: 44500,
      quantity: 0.1,
      timestamp: Date.now(),
      isBuyerMaker: false,
      tradeId: 12345
    }
  }
};

module.exports = {
  mockApiResponses,
  mockAIChainData,
  mockVolatilityData,
  mockSentimentData,
  mockWebSocketData
};