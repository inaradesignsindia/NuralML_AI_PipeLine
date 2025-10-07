const axios = require('axios');

class NewsClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://newsapi.org/v2';
  }

  async getCryptoNews(query = 'cryptocurrency', pageSize = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/everything`, {
        params: {
          q: query,
          apiKey: this.apiKey,
          pageSize: pageSize,
          sortBy: 'publishedAt'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`News API error: ${error.message}`);
    }
  }

  // Add more methods as needed
}

module.exports = NewsClient;