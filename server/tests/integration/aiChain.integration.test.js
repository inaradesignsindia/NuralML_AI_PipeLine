const AIAgentChain = require('../../modules/aiAgentChain');
const { mockAIChainData } = require('../mocks/mockData');

// Mock all external dependencies
jest.mock('../../apiClients/geminiClient');
jest.mock('../../apiClients/cohereClient');

describe('AI Agent Chain Integration Tests', () => {
  let aiChain;

  beforeEach(() => {
    jest.clearAllMocks();
    aiChain = new AIAgentChain();
  });

  describe('Full AI Chain Execution', () => {
    it('should execute complete AI agent chain successfully', async () => {
      // Mock the Gemini client responses
      const mockGeminiClient = aiChain.geminiClient;
      mockGeminiClient.generateJSON
        .mockResolvedValueOnce(mockAIChainData.marketStateReport) // Market analysis
        .mockResolvedValueOnce(mockAIChainData.strategyRecommendations); // Strategy reasoning

      // Mock the Cohere client response
      const mockCohereClient = aiChain.cohereClient;
      mockCohereClient.generateJSON.mockResolvedValueOnce(mockAIChainData.executableTradeObject);

      // Mock rate limiting to allow requests
      jest.spyOn(aiChain, 'checkRateLimit').mockResolvedValue();

      const result = await aiChain.executeChain(
        mockAIChainData.marketContext,
        mockAIChainData.accountBalance
      );

      // Verify the result structure
      expect(result).toHaveProperty('marketStateReport');
      expect(result).toHaveProperty('strategyRecommendations');
      expect(result).toHaveProperty('executableTrade');
      expect(result).toHaveProperty('timestamp');

      // Verify market state report
      expect(result.marketStateReport).toEqual(mockAIChainData.marketStateReport);
      expect(result.marketStateReport).toHaveProperty('trend_summary');
      expect(result.marketStateReport).toHaveProperty('support_resistance_levels');
      expect(result.marketStateReport.support_resistance_levels).toHaveProperty('support');
      expect(result.marketStateReport.support_resistance_levels).toHaveProperty('resistance');

      // Verify strategy recommendations
      expect(Array.isArray(result.strategyRecommendations)).toBe(true);
      expect(result.strategyRecommendations).toHaveLength(3);
      result.strategyRecommendations.forEach(rec => {
        expect(rec).toHaveProperty('confidence_score');
        expect(rec).toHaveProperty('rationale');
        expect(rec).toHaveProperty('delta');
        expect(rec).toHaveProperty('gamma');
        expect(rec).toHaveProperty('vega');
        expect(rec).toHaveProperty('exchange_preference');
        expect(rec.confidence_score).toBeGreaterThanOrEqual(0);
        expect(rec.confidence_score).toBeLessThanOrEqual(1);
      });

      // Verify highest confidence strategy is selected
      const highestConfidence = Math.max(...result.strategyRecommendations.map(r => r.confidence_score));
      const selectedStrategy = result.strategyRecommendations.find(r => r.confidence_score === highestConfidence);
      expect(mockCohereClient.generateJSON).toHaveBeenCalledWith(
        expect.stringContaining(selectedStrategy.rationale),
        expect.any(Object)
      );

      // Verify executable trade object
      expect(result.executableTrade).toEqual(mockAIChainData.executableTradeObject);
      expect(result.executableTrade).toHaveProperty('trade_type');
      expect(result.executableTrade).toHaveProperty('strike_price');
      expect(result.executableTrade).toHaveProperty('expiration');
      expect(result.executableTrade).toHaveProperty('quantity');
      expect(result.executableTrade).toHaveProperty('hedge_action');
      expect(result.executableTrade).toHaveProperty('hedge_quantity');
      expect(result.executableTrade).toHaveProperty('exchange_selection');
      expect(result.executableTrade).toHaveProperty('slippage_tolerance');

      // Verify API call counts
      expect(mockGeminiClient.generateJSON).toHaveBeenCalledTimes(2);
      expect(mockCohereClient.generateJSON).toHaveBeenCalledTimes(1);
    });

    it('should handle market analysis failure gracefully', async () => {
      const mockGeminiClient = aiChain.geminiClient;
      mockGeminiClient.generateJSON.mockRejectedValueOnce(new Error('Gemini API error'));

      await expect(aiChain.executeChain(
        mockAIChainData.marketContext,
        mockAIChainData.accountBalance
      )).rejects.toThrow('AI Agent Chain execution failed: Gemini API error');
    });

    it('should handle strategy reasoning failure', async () => {
      const mockGeminiClient = aiChain.geminiClient;
      mockGeminiClient.generateJSON
        .mockResolvedValueOnce(mockAIChainData.marketStateReport) // Market analysis succeeds
        .mockRejectedValueOnce(new Error('Strategy reasoning failed')); // Strategy reasoning fails

      await expect(aiChain.executeChain(
        mockAIChainData.marketContext,
        mockAIChainData.accountBalance
      )).rejects.toThrow('AI Agent Chain execution failed: Strategy reasoning failed');
    });

    it('should handle logic implementation failure', async () => {
      const mockGeminiClient = aiChain.geminiClient;
      const mockCohereClient = aiChain.cohereClient;

      mockGeminiClient.generateJSON
        .mockResolvedValueOnce(mockAIChainData.marketStateReport)
        .mockResolvedValueOnce(mockAIChainData.strategyRecommendations);

      mockCohereClient.generateJSON.mockRejectedValueOnce(new Error('Cohere API error'));

      await expect(aiChain.executeChain(
        mockAIChainData.marketContext,
        mockAIChainData.accountBalance
      )).rejects.toThrow('AI Agent Chain execution failed: Cohere API error');
    });

    it('should validate JSON schemas correctly', async () => {
      const mockGeminiClient = aiChain.geminiClient;
      mockGeminiClient.generateJSON
        .mockResolvedValueOnce(mockAIChainData.marketStateReport)
        .mockResolvedValueOnce(mockAIChainData.strategyRecommendations);

      const mockCohereClient = aiChain.cohereClient;
      mockCohereClient.generateJSON.mockResolvedValueOnce(mockAIChainData.executableTradeObject);

      const result = await aiChain.executeChain(
        mockAIChainData.marketContext,
        mockAIChainData.accountBalance
      );

      // Test schema validation by checking required fields
      expect(() => aiChain.validateJSON(result.marketStateReport, aiChain.constructor.schemas.marketStateReport)).not.toThrow();
      expect(() => aiChain.validateJSON(result.strategyRecommendations, aiChain.constructor.schemas.strategyRecommendations)).not.toThrow();
      expect(() => aiChain.validateJSON(result.executableTrade, aiChain.constructor.schemas.executableTradeObject)).not.toThrow();
    });

    it('should handle rate limiting correctly', async () => {
      const mockGeminiClient = aiChain.geminiClient;
      mockGeminiClient.generateJSON
        .mockResolvedValueOnce(mockAIChainData.marketStateReport)
        .mockResolvedValueOnce(mockAIChainData.strategyRecommendations);

      const mockCohereClient = aiChain.cohereClient;
      mockCohereClient.generateJSON.mockResolvedValueOnce(mockAIChainData.executableTradeObject);

      // Mock rate limiting to fail on first call
      let callCount = 0;
      jest.spyOn(aiChain, 'checkRateLimit').mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(); // Allow first call
        if (callCount === 2) return Promise.resolve(); // Allow second call
        if (callCount === 3) return Promise.reject(new Error('Rate limit exceeded for cohere'));
      });

      await expect(aiChain.executeChain(
        mockAIChainData.marketContext,
        mockAIChainData.accountBalance
      )).rejects.toThrow('AI Agent Chain execution failed: Rate limit exceeded for cohere');
    });

    it('should select highest confidence strategy for execution', async () => {
      const mockGeminiClient = aiChain.geminiClient;
      const mockCohereClient = aiChain.cohereClient;

      // Create strategy recommendations with different confidence scores
      const strategies = [
        { confidence_score: 0.6, rationale: 'Medium confidence', delta: 0.5, gamma: 0.1, vega: 0.2, exchange_preference: 'Binance' },
        { confidence_score: 0.9, rationale: 'High confidence', delta: 0.7, gamma: 0.15, vega: 0.25, exchange_preference: 'Delta' },
        { confidence_score: 0.7, rationale: 'Good confidence', delta: 0.6, gamma: 0.12, vega: 0.22, exchange_preference: 'Binance' }
      ];

      mockGeminiClient.generateJSON
        .mockResolvedValueOnce(mockAIChainData.marketStateReport)
        .mockResolvedValueOnce(strategies);

      mockCohereClient.generateJSON.mockResolvedValueOnce(mockAIChainData.executableTradeObject);

      await aiChain.executeChain(mockAIChainData.marketContext, mockAIChainData.accountBalance);

      // Verify that the highest confidence strategy (0.9) was passed to logic implementation
      expect(mockCohereClient.generateJSON).toHaveBeenCalledWith(
        expect.stringContaining('High confidence'),
        expect.any(Object)
      );
    });
  });

  describe('End-to-End Data Flow', () => {
    it('should maintain data integrity through the entire chain', async () => {
      const mockGeminiClient = aiChain.geminiClient;
      const mockCohereClient = aiChain.cohereClient;

      mockGeminiClient.generateJSON
        .mockResolvedValueOnce(mockAIChainData.marketStateReport)
        .mockResolvedValueOnce(mockAIChainData.strategyRecommendations);

      mockCohereClient.generateJSON.mockResolvedValueOnce(mockAIChainData.executableTradeObject);

      const result = await aiChain.executeChain(
        mockAIChainData.marketContext,
        mockAIChainData.accountBalance
      );

      // Verify that market context data flows through to market analysis
      expect(mockGeminiClient.generateJSON).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(mockAIChainData.marketContext)),
        expect.any(Object)
      );

      // Verify that market state report and account balance flow to strategy reasoning
      expect(mockGeminiClient.generateJSON).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(mockAIChainData.marketStateReport)),
        expect.any(Object)
      );

      expect(mockGeminiClient.generateJSON).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(mockAIChainData.accountBalance)),
        expect.any(Object)
      );

      // Verify that highest confidence strategy flows to logic implementation
      const highestConfidenceStrategy = mockAIChainData.strategyRecommendations[0]; // Mock data has highest first
      expect(mockCohereClient.generateJSON).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(highestConfidenceStrategy)),
        expect.any(Object)
      );
    });
  });
});