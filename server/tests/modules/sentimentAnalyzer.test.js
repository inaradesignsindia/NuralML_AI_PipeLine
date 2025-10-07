const axios = require('axios');
const SentimentAnalyzer = require('../../modules/sentimentAnalyzer');
const { mockSentimentData } = require('../mocks/mockData');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('SentimentAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new SentimentAnalyzer('test-huggingface-key', 'test-news-key');
    jest.clearAllMocks();
  });

  afterEach(() => {
    analyzer.clearCache();
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment using FinBERT', async () => {
      const mockResponse = [
        [
          { label: 'POSITIVE', score: 0.8 },
          { label: 'NEGATIVE', score: 0.1 },
          { label: 'NEUTRAL', score: 0.1 }
        ]
      ];

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await analyzer.analyzeSentiment('Bitcoin surges to new highs!');

      expect(result).toHaveProperty('positive', 0.8);
      expect(result).toHaveProperty('negative', 0.1);
      expect(result).toHaveProperty('neutral', 0.1);
      expect(result).toHaveProperty('compound', 0.7);
      expect(result).toHaveProperty('timestamp');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api-inference.huggingface.co/models/ProsusAI/finbert',
        { inputs: 'Bitcoin surges to new highs!' },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-huggingface-key'
          })
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API rate limit'));

      const result = await analyzer.analyzeSentiment('Test text');

      expect(result).toHaveProperty('positive', 0.33);
      expect(result).toHaveProperty('negative', 0.33);
      expect(result).toHaveProperty('neutral', 0.34);
      expect(result).toHaveProperty('compound', 0);
      expect(result).toHaveProperty('error', 'API rate limit');
    });

    it('should handle missing sentiment labels', async () => {
      const mockResponse = [
        [
          { label: 'POSITIVE', score: 0.9 }
          // Missing NEGATIVE and NEUTRAL
        ]
      ];

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await analyzer.analyzeSentiment('Positive text');

      expect(result).toHaveProperty('positive', 0.9);
      expect(result).toHaveProperty('negative', 0);
      expect(result).toHaveProperty('neutral', 0);
      expect(result).toHaveProperty('compound', 0.9);
    });
  });

  describe('getMarketSentiment', () => {
    it('should fetch news and analyze market sentiment', async () => {
      const mockNewsResponse = {
        data: {
          articles: mockSentimentData.newsArticles
        }
      };

      const mockSentimentResponse = [
        [
          { label: 'POSITIVE', score: 0.7 },
          { label: 'NEGATIVE', score: 0.2 },
          { label: 'NEUTRAL', score: 0.1 }
        ]
      ];

      mockedAxios.get.mockResolvedValueOnce(mockNewsResponse);
      mockedAxios.post.mockResolvedValue({ data: mockSentimentResponse });

      const result = await analyzer.getMarketSentiment('bitcoin', 3);

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('articleCount', 3);
      expect(result.overall).toHaveProperty('positive');
      expect(result.overall).toHaveProperty('negative');
      expect(result.overall).toHaveProperty('neutral');
      expect(result.overall).toHaveProperty('compound');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://newsapi.org/v2/everything',
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'bitcoin',
            apiKey: 'test-news-key',
            pageSize: 3
          })
        })
      );
    });

    it('should use cached results when available', async () => {
      // First call to populate cache
      const mockNewsResponse = {
        data: {
          articles: mockSentimentData.newsArticles.slice(0, 1)
        }
      };

      const mockSentimentResponse = [
        [
          { label: 'POSITIVE', score: 0.6 },
          { label: 'NEGATIVE', score: 0.2 },
          { label: 'NEUTRAL', score: 0.2 }
        ]
      ];

      mockedAxios.get.mockResolvedValue(mockNewsResponse);
      mockedAxios.post.mockResolvedValue({ data: mockSentimentResponse });

      await analyzer.getMarketSentiment('test', 1);

      // Second call should use cache
      const result = await analyzer.getMarketSentiment('test', 1);

      expect(result).toBeDefined();
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Only once due to cache
    });

    it('should handle news API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('News API error'));

      const result = await analyzer.getMarketSentiment('bitcoin', 5);

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('articleCount', 0);
      expect(result).toHaveProperty('error', 'News API error');
    });

    it('should handle empty news results', async () => {
      const mockNewsResponse = {
        data: {
          articles: []
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockNewsResponse);

      await expect(analyzer.getMarketSentiment('nonexistent', 5)).rejects.toThrow('No news articles found');
    });
  });

  describe('aggregateSentiments', () => {
    it('should aggregate multiple sentiment analyses', () => {
      const sentiments = [
        { positive: 0.8, negative: 0.1, neutral: 0.1, compound: 0.7 },
        { positive: 0.6, negative: 0.2, neutral: 0.2, compound: 0.4 },
        { positive: 0.7, negative: 0.15, neutral: 0.15, compound: 0.55 }
      ];

      const result = analyzer.aggregateSentiments(sentiments);

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('articleCount', 3);
      expect(result.overall.positive).toBeCloseTo(0.7, 2);
      expect(result.overall.negative).toBeCloseTo(0.15, 2);
      expect(result.overall.neutral).toBeCloseTo(0.15, 2);
      expect(result.overall.compound).toBeCloseTo(0.55, 2);
    });

    it('should handle empty sentiments array', () => {
      const result = analyzer.aggregateSentiments([]);

      expect(result.overall.positive).toBe(0);
      expect(result.overall.negative).toBe(0);
      expect(result.overall.neutral).toBe(1);
      expect(result.overall.compound).toBe(0);
      expect(result.articleCount).toBe(0);
    });
  });

  describe('getAssetSentiment', () => {
    it('should get sentiment for specific asset', async () => {
      const mockNewsResponse = {
        data: {
          articles: mockSentimentData.newsArticles
        }
      };

      const mockSentimentResponse = [
        [
          { label: 'POSITIVE', score: 0.5 },
          { label: 'NEGATIVE', score: 0.3 },
          { label: 'NEUTRAL', score: 0.2 }
        ]
      ];

      mockedAxios.get.mockResolvedValue(mockNewsResponse);
      mockedAxios.post.mockResolvedValue({ data: mockSentimentResponse });

      const result = await analyzer.getAssetSentiment('BTC');

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('articleCount');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://newsapi.org/v2/everything',
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'BTC cryptocurrency OR BTC crypto OR BTC price'
          })
        })
      );
    });
  });

  describe('clearCache', () => {
    it('should clear the sentiment cache', () => {
      analyzer.cache.set('test', { data: 'cached', timestamp: Date.now() });

      expect(analyzer.cache.size).toBe(1);

      analyzer.clearCache();

      expect(analyzer.cache.size).toBe(0);
    });
  });
});