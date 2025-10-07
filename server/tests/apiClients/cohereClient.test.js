const CohereClient = require('../../apiClients/cohereClient');
const { mockApiResponses } = require('../mocks/mockData');

// Mock the Cohere AI library
jest.mock('cohere-ai', () => {
  const mockResponse = {
    generations: [{ text: 'Mocked Cohere response' }]
  };

  const mockClient = {
    generate: jest.fn().mockResolvedValue(mockResponse)
  };

  return {
    CohereClient: jest.fn().mockImplementation(() => mockClient)
  };
});

describe('CohereClient', () => {
  let client;
  let mockCohereClient;

  beforeEach(() => {
    const { CohereClient: Cohere } = require('cohere-ai');
    mockCohereClient = new Cohere();
    client = new CohereClient('test-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      const mockText = 'Generated content from Cohere';
      mockCohereClient.generate.mockResolvedValueOnce({
        generations: [{ text: mockText }]
      });

      const prompt = 'Test prompt';
      const result = await client.generateContent(prompt);

      expect(result).toBe(mockText);
      expect(mockCohereClient.generate).toHaveBeenCalledWith({
        model: 'command-r',
        prompt: prompt,
        max_tokens: 2048,
        temperature: 0.7,
        k: 0,
        p: 0.75,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
      });
    });

    it('should use custom options', async () => {
      const mockText = 'Custom generated content';
      mockCohereClient.generate.mockResolvedValueOnce({
        generations: [{ text: mockText }]
      });

      const prompt = 'Test prompt';
      const options = { temperature: 0.5, maxTokens: 1024, topK: 50 };
      const result = await client.generateContent(prompt, options);

      expect(result).toBe(mockText);
      expect(mockCohereClient.generate).toHaveBeenCalledWith({
        model: 'command-r',
        prompt: prompt,
        max_tokens: 1024,
        temperature: 0.5,
        k: 50,
        p: 0.75,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
      });
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API rate limit exceeded';
      mockCohereClient.generate.mockRejectedValueOnce(new Error(errorMessage));

      const prompt = 'Test prompt';
      await expect(client.generateContent(prompt)).rejects.toThrow(`Cohere API error: ${errorMessage}`);
    });
  });

  describe('generateJSON', () => {
    it('should generate valid JSON response', async () => {
      const mockResponse = JSON.stringify(mockApiResponses.cohere.generateJSONResponse);
      mockCohereClient.generate.mockResolvedValueOnce({
        generations: [{ text: mockResponse }]
      });

      const prompt = 'Generate trade object';
      const schema = { type: 'object' };
      const result = await client.generateJSON(prompt, schema);

      expect(result).toEqual(mockApiResponses.cohere.generateJSONResponse);
      expect(result.trade_type).toBeDefined();
      expect(result.strike_price).toBeDefined();
    });

    it('should generate JSON without schema', async () => {
      const mockResponse = JSON.stringify({ test: 'data' });
      mockCohereClient.generate.mockResolvedValueOnce({
        generations: [{ text: mockResponse }]
      });

      const prompt = 'Generate test data';
      const result = await client.generateJSON(prompt);

      expect(result).toEqual({ test: 'data' });
    });

    it('should handle invalid JSON in response', async () => {
      mockCohereClient.generate.mockResolvedValueOnce({
        generations: [{ text: 'Invalid JSON response' }]
      });

      const prompt = 'Generate JSON';
      await expect(client.generateJSON(prompt)).rejects.toThrow('No JSON found in response');
    });

    it('should handle malformed JSON', async () => {
      mockCohereClient.generate.mockResolvedValueOnce({
        generations: [{ text: '{ invalid json' }]
      });

      const prompt = 'Generate JSON';
      await expect(client.generateJSON(prompt)).rejects.toThrow('Failed to generate valid JSON');
    });
  });

  describe('isConfigured', () => {
    it('should return true when API key is provided', () => {
      expect(client.isConfigured()).toBe(true);
    });

    it('should return false when API key is not provided', () => {
      const clientWithoutKey = new CohereClient();
      expect(clientWithoutKey.isConfigured()).toBe(false);
    });
  });
});