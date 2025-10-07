const nock = require('nock');
const NewsClient = require('../../apiClients/newsClient');
const { mockApiResponses } = require('../mocks/mockData');

describe('NewsClient', () => {
  let client;

  beforeEach(() => {
    client = new NewsClient('test-api-key');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getCryptoNews', () => {
    it('should return crypto news articles', async () => {
      nock('https://newsapi.org')
        .get('/v2/everything')
        .query({
          q: 'cryptocurrency',
          apiKey: 'test-api-key',
          pageSize: 10,
          sortBy: 'publishedAt'
        })
        .reply(200, { articles: mockApiResponses.newsApi.articles });

      const result = await client.getCryptoNews('cryptocurrency', 10);

      expect(result.articles).toEqual(mockApiResponses.newsApi.articles);
      expect(result.articles).toHaveLength(2);
    });

    it('should use default parameters', async () => {
      nock('https://newsapi.org')
        .get('/v2/everything')
        .query({
          q: 'cryptocurrency',
          apiKey: 'test-api-key',
          pageSize: 10,
          sortBy: 'publishedAt'
        })
        .reply(200, { articles: mockApiResponses.newsApi.articles });

      const result = await client.getCryptoNews();

      expect(result.articles).toEqual(mockApiResponses.newsApi.articles);
    });

    it('should handle API errors', async () => {
      nock('https://newsapi.org')
        .get('/v2/everything')
        .query({
          q: 'cryptocurrency',
          apiKey: 'invalid-key',
          pageSize: 10,
          sortBy: 'publishedAt'
        })
        .reply(401, { message: 'Invalid API key' });

      await expect(client.getCryptoNews('cryptocurrency', 10)).rejects.toThrow('News API error');
    });
  });
});