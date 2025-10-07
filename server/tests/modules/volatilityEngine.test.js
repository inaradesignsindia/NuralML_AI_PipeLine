const VolatilityEngine = require('../../modules/volatilityEngine');
const { mockVolatilityData } = require('../mocks/mockData');

describe('VolatilityEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new VolatilityEngine();
  });

  describe('calculateHistoricalVolatility', () => {
    it('should calculate historical volatility correctly', () => {
      const prices = mockVolatilityData.priceHistory.map(p => parseFloat(p.price));

      const hv = engine.calculateHistoricalVolatility(prices, 5);

      expect(hv).toBeDefined();
      expect(typeof hv).toBe('number');
      expect(hv).toBeGreaterThan(0);
      // With the mock data, we expect some volatility
      expect(hv).toBeCloseTo(mockVolatilityData.expectedHV * 100, 0); // Allow some tolerance
    });

    it('should throw error for insufficient data', () => {
      const prices = [100, 101, 102]; // Less than window + 1

      expect(() => engine.calculateHistoricalVolatility(prices, 20)).toThrow('Insufficient data');
    });

    it('should use default window size', () => {
      const prices = Array(25).fill(0).map((_, i) => 100 + i); // 25 prices

      const hv = engine.calculateHistoricalVolatility(prices);

      expect(hv).toBeDefined();
      expect(typeof hv).toBe('number');
    });
  });

  describe('Black-Scholes calculations', () => {
    const S = 100; // Spot price
    const K = 100; // Strike price
    const T = 1; // 1 year
    const r = 0.05; // 5% risk-free rate
    const sigma = 0.20; // 20% volatility

    describe('blackScholesCall', () => {
      it('should calculate call option price', () => {
        const price = engine.blackScholesCall(S, K, T, r, sigma);

        expect(price).toBeDefined();
        expect(typeof price).toBe('number');
        expect(price).toBeGreaterThan(0);
        // At-the-money call should be worth something
        expect(price).toBeCloseTo(10.45, 1); // Approximate value
      });

      it('should return 0 for expired options', () => {
        const price = engine.blackScholesCall(S, K, 0, r, sigma);

        expect(price).toBe(0);
      });

      it('should return 0 for zero volatility', () => {
        const price = engine.blackScholesCall(S, K, T, r, 0);

        expect(price).toBe(0);
      });
    });

    describe('blackScholesPut', () => {
      it('should calculate put option price', () => {
        const price = engine.blackScholesPut(S, K, T, r, sigma);

        expect(price).toBeDefined();
        expect(typeof price).toBe('number');
        expect(price).toBeGreaterThan(0);
        // At-the-money put should be worth something
        expect(price).toBeCloseTo(5.57, 1); // Approximate value
      });

      it('should return 0 for expired options', () => {
        const price = engine.blackScholesPut(S, K, 0, r, sigma);

        expect(price).toBe(0);
      });

      it('should return 0 for zero volatility', () => {
        const price = engine.blackScholesPut(S, K, T, r, 0);

        expect(price).toBe(0);
      });
    });
  });

  describe('calculateVega', () => {
    it('should calculate vega for call option', () => {
      const S = 100, K = 100, T = 1, r = 0.05, sigma = 0.20;

      const vega = engine.calculateVega(S, K, T, r, sigma, true);

      expect(vega).toBeDefined();
      expect(typeof vega).toBe('number');
      expect(vega).toBeGreaterThan(0);
      expect(vega).toBeCloseTo(37.52, 1); // Approximate value
    });

    it('should calculate vega for put option', () => {
      const S = 100, K = 100, T = 1, r = 0.05, sigma = 0.20;

      const vega = engine.calculateVega(S, K, T, r, sigma, false);

      expect(vega).toBeDefined();
      expect(typeof vega).toBe('number');
      expect(vega).toBeGreaterThan(0);
    });

    it('should return 0 for expired options', () => {
      const vega = engine.calculateVega(100, 100, 0, 0.05, 0.20, true);

      expect(vega).toBe(0);
    });

    it('should return 0 for zero volatility', () => {
      const vega = engine.calculateVega(100, 100, 1, 0.05, 0, true);

      expect(vega).toBe(0);
    });
  });

  describe('calculateImpliedVolatility', () => {
    it('should calculate implied volatility for call option', () => {
      const marketPrice = 10.45; // Approximate BS price
      const S = 100, K = 100, T = 1, r = 0.05;

      const iv = engine.calculateImpliedVolatility(marketPrice, S, K, T, r, true);

      expect(iv).toBeDefined();
      expect(typeof iv).toBe('number');
      expect(iv).toBeGreaterThan(0);
      expect(iv).toBeCloseTo(20, 1); // Should converge to 20%
    });

    it('should calculate implied volatility for put option', () => {
      const marketPrice = 5.57; // Approximate BS price
      const S = 100, K = 100, T = 1, r = 0.05;

      const iv = engine.calculateImpliedVolatility(marketPrice, S, K, T, r, false);

      expect(iv).toBeDefined();
      expect(typeof iv).toBe('number');
      expect(iv).toBeGreaterThan(0);
    });

    it('should return 0 for expired options', () => {
      const iv = engine.calculateImpliedVolatility(10, 100, 100, 0, 0.05, true);

      expect(iv).toBe(0);
    });

    it('should handle convergence issues gracefully', () => {
      // Test with extreme parameters that might not converge well
      const iv = engine.calculateImpliedVolatility(1000, 100, 100, 1, 0.05, true);

      expect(iv).toBeDefined();
      expect(typeof iv).toBe('number');
    });
  });

  describe('calculateAverageIV', () => {
    it('should calculate average implied volatility from options data', () => {
      const options = [
        { price: 10.45, strike: 100, expiration: 365, type: 'call' },
        { price: 5.57, strike: 100, expiration: 365, type: 'put' },
        { price: 15.23, strike: 105, expiration: 365, type: 'call' }
      ];
      const spotPrice = 100;

      const avgIV = engine.calculateAverageIV(options, spotPrice);

      expect(avgIV).toBeDefined();
      expect(typeof avgIV).toBe('number');
      expect(avgIV).toBeGreaterThan(0);
    });

    it('should return null for empty options array', () => {
      const avgIV = engine.calculateAverageIV([], 100);

      expect(avgIV).toBeNull();
    });

    it('should filter out invalid IV calculations', () => {
      const options = [
        { price: -1, strike: 100, expiration: 365, type: 'call' }, // Invalid price
        { price: 10.45, strike: 100, expiration: 365, type: 'call' } // Valid
      ];
      const spotPrice = 100;

      const avgIV = engine.calculateAverageIV(options, spotPrice);

      expect(avgIV).toBeDefined();
      expect(typeof avgIV).toBe('number');
    });
  });

  describe('normCDF', () => {
    it('should calculate cumulative normal distribution', () => {
      expect(engine.normCDF(0)).toBeCloseTo(0.5, 3);
      expect(engine.normCDF(1)).toBeCloseTo(0.8413, 3);
      expect(engine.normCDF(-1)).toBeCloseTo(0.1587, 3);
    });
  });
});