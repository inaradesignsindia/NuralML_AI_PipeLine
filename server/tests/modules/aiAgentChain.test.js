const AIAgentChain = require('../../modules/aiAgentChain');
const { mockAIChainData } = require('../mocks/mockData');

// Mock the API clients
jest.mock('../../apiClients/geminiClient', () => {
  return jest.fn().mockImplementation(() => ({
    generateJSON: jest.fn(),
    isConfigured: jest.fn().mockReturnValue(true)
  }));
});

jest.mock('../../apiClients/cohereClient', () => {
  return jest.fn().mockImplementation(() => ({
    generateJSON: jest.fn(),
    isConfigured: jest.fn().mockReturnValue(true)
  }));
});

describe('AIAgentChain', () => {
  let chain;
  let mockGeminiClient;
  let mockCohereClient;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    chain = new AIAgentChain();
    mockGeminiClient = chain.geminiClient;
    mockCohereClient = chain.cohereClient;
  });

  describe('executeChain', () => {
    it('should execute the complete AI agent chain successfully', async () => {
      // Mock the AI responses
      mockGeminiClient.generateJSON
        .mockResolvedValueOnce(mockAIChainData.marketStateReport) // Market analysis
        .mockResolvedValueOnce(mockAIChainData.strategyRecommendations); // Strategy reasoning

      mockCohereClient.generateJSON.mockResolvedValueOnce(mockAIChainData.executableTradeObject); // Logic implementation

      const result = await chain.executeChain(mockAIChainData.marketContext, mockAIChainData.accountBalance);

      expect(result.marketStateReport).toEqual(mockAIChainData.marketStateReport);
      expect(result.strategyRecommendations).toEqual(mockAIChainData.strategyRecommendations);
      expect(result.executableTrade).toEqual(mockAIChainData.executableTradeObject);
      expect(result.timestamp).toBeDefined();

      expect(mockGeminiClient.generateJSON).toHaveBeenCalledTimes(2);
      expect(mockCohereClient.generateJSON).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in the chain execution', async () => {
      mockGeminiClient.generateJSON.mockRejectedValueOnce(new Error('Gemini API error'));

      await expect(chain.executeChain(mockAIChainData.marketContext, mockAIChainData.accountBalance))
        .rejects.toThrow('AI Agent Chain execution failed');
    });
  });

  describe('marketAnalysisAgent', () => {
    it('should generate market state report', async () => {
      mockGeminiClient.generateJSON.mockResolvedValueOnce(mockAIChainData.marketStateReport);

      const result = await chain.marketAnalysisAgent(mockAIChainData.marketContext);

      expect(result).toEqual(mockAIChainData.marketStateReport);
      expect(mockGeminiClient.generateJSON).toHaveBeenCalledWith(
        expect.stringContaining('MarketContext Data:'),
        expect.any(Object)
      );
    });
  });

  describe('strategyReasoningAgent', () => {
    it('should generate strategy recommendations', async () => {
      mockGeminiClient.generateJSON.mockResolvedValueOnce(mockAIChainData.strategyRecommendations);

      const result = await chain.strategyReasoningAgent(
        mockAIChainData.marketStateReport,
        mockAIChainData.accountBalance
      );

      expect(result).toEqual(mockAIChainData.strategyRecommendations);
      expect(result).toHaveLength(3);
      expect(mockGeminiClient.generateJSON).toHaveBeenCalledWith(
        expect.stringContaining('MarketStateReport:'),
        expect.any(Object)
      );
    });
  });

  describe('logicImplementationAgent', () => {
    it('should generate executable trade object', async () => {
      mockCohereClient.generateJSON.mockResolvedValueOnce(mockAIChainData.executableTradeObject);

      const result = await chain.logicImplementationAgent(mockAIChainData.strategyRecommendations[0]);

      expect(result).toEqual(mockAIChainData.executableTradeObject);
      expect(result.trade_type).toBeDefined();
      expect(result.strike_price).toBeDefined();
    });
  });

  describe('validateJSON', () => {
    it('should validate required fields', () => {
      const data = { trend_summary: 'test', support_resistance_levels: { support: [], resistance: [] }, volatility_bias: 'test', sentiment_impact: 'test' };
      const schema = { required: ['trend_summary', 'support_resistance_levels', 'volatility_bias', 'sentiment_impact'] };

      expect(() => chain.validateJSON(data, schema)).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const data = { trend_summary: 'test' };
      const schema = { required: ['trend_summary', 'missing_field'] };

      expect(() => chain.validateJSON(data, schema)).toThrow('Missing required field: missing_field');
    });

    it('should validate array type', () => {
      const data = [1, 2, 3];
      const schema = { type: 'array' };

      expect(() => chain.validateJSON(data, schema)).not.toThrow();
    });

    it('should throw error for invalid array type', () => {
      const data = 'not an array';
      const schema = { type: 'array' };

      expect(() => chain.validateJSON(data, schema)).toThrow('Expected array');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      await expect(chain.checkRateLimit('gemini')).resolves.not.toThrow();
    });

    it('should throw error when rate limit exceeded', async () => {
      // Simulate rate limit exceeded
      chain.rateLimiter.set('gemini', Array(11).fill(Date.now()));

      await expect(chain.checkRateLimit('gemini')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('isConfigured', () => {
    it('should return true when both clients are configured', () => {
      expect(chain.isConfigured()).toBe(true);
    });

    it('should return false when Gemini is not configured', () => {
      mockGeminiClient.isConfigured.mockReturnValue(false);

      expect(chain.isConfigured()).toBe(false);
    });

    it('should return false when Cohere is not configured', () => {
      mockCohereClient.isConfigured.mockReturnValue(false);

      expect(chain.isConfigured()).toBe(false);
    });
  });
});