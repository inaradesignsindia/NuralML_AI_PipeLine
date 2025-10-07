const axios = require('axios');

class SentimentAnalyzer {
  constructor(apiKey, newsApiKey) {
    this.apiKey = apiKey; // For sentiment analysis API
    this.newsApiKey = newsApiKey;
    this.baseUrl = 'https://api-inference.huggingface.co/models/ProsusAI/finbert'; // FinBERT model
    this.newsBaseUrl = 'https://newsapi.org/v2';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Analyze sentiment of text using FinBERT
   * @param {string} text - Text to analyze
   * @returns {Object} Sentiment scores {positive, negative, neutral}
   */
  async analyzeSentiment(text) {
    try {
      const response = await axios.post(this.baseUrl, {
        inputs: text
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = response.data[0];
      const scores = {};

      result.forEach(item => {
        scores[item.label.toLowerCase()] = item.score;
      });

      return {
        positive: scores.positive || 0,
        negative: scores.negative || 0,
        neutral: scores.neutral || 0,
        compound: (scores.positive || 0) - (scores.negative || 0), // Simple compound score
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error.message);
      // Return neutral sentiment as fallback
      return {
        positive: 0.33,
        negative: 0.33,
        neutral: 0.34,
        compound: 0,
        timestamp: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Fetch crypto news and analyze sentiment
   * @param {string} query - Search query (default: cryptocurrency)
   * @param {number} pageSize - Number of articles to fetch
   * @returns {Object} Aggregated sentiment analysis
   */
  async getMarketSentiment(query = 'cryptocurrency OR bitcoin OR ethereum', pageSize = 20) {
    try {
      // Check cache first
      const cacheKey = `sentiment_${query}_${pageSize}`;
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.data;
      }

      // Fetch news
      const newsResponse = await axios.get(`${this.newsBaseUrl}/everything`, {
        params: {
          q: query,
          apiKey: this.newsApiKey,
          pageSize: pageSize,
          sortBy: 'publishedAt',
          language: 'en'
        }
      });

      const articles = newsResponse.data.articles;
      if (!articles || articles.length === 0) {
        throw new Error('No news articles found');
      }

      // Analyze sentiment for each article
      const sentimentPromises = articles.map(async (article) => {
        const text = `${article.title} ${article.description || ''}`.substring(0, 512); // Limit text length
        return await this.analyzeSentiment(text);
      });

      const sentiments = await Promise.all(sentimentPromises);

      // Aggregate sentiments
      const aggregated = this.aggregateSentiments(sentiments);

      // Cache result
      this.cache.set(cacheKey, {
        data: aggregated,
        timestamp: Date.now()
      });

      return aggregated;
    } catch (error) {
      console.error('Market sentiment analysis error:', error.message);

      // Return cached data if available
      const cacheKey = `sentiment_${query}_${pageSize}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log('Returning cached sentiment data');
        return cached.data;
      }

      // Return neutral sentiment as fallback
      return {
        overall: {
          positive: 0.33,
          negative: 0.33,
          neutral: 0.34,
          compound: 0
        },
        articleCount: 0,
        timestamp: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Aggregate multiple sentiment analyses
   * @param {Array} sentiments - Array of sentiment objects
   * @returns {Object} Aggregated sentiment
   */
  aggregateSentiments(sentiments) {
    if (sentiments.length === 0) {
      return {
        overall: { positive: 0, negative: 0, neutral: 1, compound: 0 },
        articleCount: 0,
        timestamp: Date.now()
      };
    }

    const totals = sentiments.reduce((acc, sentiment) => {
      acc.positive += sentiment.positive;
      acc.negative += sentiment.negative;
      acc.neutral += sentiment.neutral;
      acc.compound += sentiment.compound;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0, compound: 0 });

    const count = sentiments.length;

    return {
      overall: {
        positive: totals.positive / count,
        negative: totals.negative / count,
        neutral: totals.neutral / count,
        compound: totals.compound / count
      },
      articleCount: count,
      timestamp: Date.now()
    };
  }

  /**
   * Get sentiment score for a specific asset
   * @param {string} asset - Asset symbol (BTC, ETH, etc.)
   * @returns {Object} Asset-specific sentiment
   */
  async getAssetSentiment(asset) {
    const query = `${asset} cryptocurrency OR ${asset} crypto OR ${asset} price`;
    return await this.getMarketSentiment(query, 15);
  }

  /**
   * Clear sentiment cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = SentimentAnalyzer;