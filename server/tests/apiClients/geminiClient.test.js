const GeminiClient = require('../../apiClients/geminiClient');
const { mockApiResponses } = require('../mocks/mockData');

// Mock the Google Generative AI library
jest.mock('@google/generative-ai', () => {
  const mockResponse = {
    text: jest.fn()
  };

  const mockResult = {
    response: Promise.resolve(mockResponse)
  };

  const mockModel = {
    generateContent: jest.fn().mockResolvedValue(mockResult)
  };

  const mockGenAI = {
    getGenerativeModel: jest.fn().mockReturnValue(mockModel)
  };

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => mockGenAI)
  };
});

describe('GeminiClient', () => {
  let client;
  let mockModel;

  beforeEach(() => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI();
    mockModel = genAI.getGenerativeModel();
    client = new GeminiClient('test-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      const mockText = 'Generated content from Gemini';
      mockModel.generateContent.mockResolvedValueOnce({
        response: Promise.resolve({ text: () => mockText })
      });

      const prompt = 'Test prompt';
      const result = await client.generateContent(prompt);

      expect(result).toBe(mockText);
      expect(mockModel.generateContent).toHaveBeenCalledWith({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      });
    });

    it('should use custom options', async () => {
      const mockText = 'Custom generated content';
      mockModel.generateContent.mockResolvedValueOnce({
        response: Promise.resolve({ text: () => mockText })
      });

      const prompt = 'Test prompt';
      const options = { temperature: 0.5, maxTokens: 1024 };
      const result = await client.generateContent(prompt, options);

      expect(result).toBe(mockText);
      expect(mockModel.generateContent).toHaveBeenCalledWith({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      });
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API rate limit exceeded';
      mockModel.generateContent.mockRejectedValueOnce(new Error(errorMessage));

      const prompt = 'Test prompt';
      await expect(client.generateContent(prompt)).rejects.toThrow(`Gemini API error: ${errorMessage}`);
    });
  });

  describe('generateJSON', () => {
    it('should generate valid JSON response', async () => {
      const mockResponse = JSON.stringify(mockApiResponses.gemini.generateJSONResponse);
      mockModel.generateContent.mockResolvedValueOnce({
        response: Promise.resolve({ text: () => mockResponse })
      });

      const prompt = 'Generate market analysis';
      const schema = { type: 'object' };
      const result = await client.generateJSON(prompt, schema);

      expect(result).toEqual(mockApiResponses.gemini.generateJSONResponse);
      expect(result.trend_summary).toBeDefined();
      expect(result.support_resistance_levels).toBeDefined();
    });

    it('should generate JSON without schema', async () => {
      const mockResponse = JSON.stringify({ test: 'data' });
      mockModel.generateContent.mockResolvedValueOnce({
        response: Promise.resolve({ text: () => mockResponse })
      });

      const prompt = 'Generate test data';
      const result = await client.generateJSON(prompt);

      expect(result).toEqual({ test: 'data' });
    });

    it('should handle invalid JSON in response', async () => {
      mockModel.generateContent.mockResolvedValueOnce({
        response: Promise.resolve({ text: () => 'Invalid JSON response' })
      });

      const prompt = 'Generate JSON';
      await expect(client.generateJSON(prompt)).rejects.toThrow('No JSON found in response');
    });

    it('should handle malformed JSON', async () => {
      mockModel.generateContent.mockResolvedValueOnce({
        response: Promise.resolve({ text: () => '{ invalid json' })
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
      const clientWithoutKey = new GeminiClient();
      expect(clientWithoutKey.isConfigured()).toBe(false);
    });
  });
});