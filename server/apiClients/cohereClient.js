const { CohereClient: Cohere } = require('cohere-ai');

class CohereClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = new Cohere({
      token: apiKey,
    });
  }

  /**
   * Generate content using Cohere Command-R
   * @param {string} prompt - The prompt to send to Cohere
   * @param {Object} options - Additional options for generation
   * @returns {Promise<string>} Generated content
   */
  async generateContent(prompt, options = {}) {
    try {
      const response = await this.client.generate({
        model: 'command-r', // Using Command-R as specified
        prompt: prompt,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
        k: options.topK || 0,
        p: options.topP || 0.75,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
        stop_sequences: options.stopSequences || [],
        return_likelihoods: options.returnLikelihoods || 'NONE',
      });

      return response.generations[0].text;
    } catch (error) {
      console.error('Cohere API error:', error);
      throw new Error(`Cohere API error: ${error.message}`);
    }
  }

  /**
   * Generate structured JSON response
   * @param {string} prompt - The prompt with JSON schema instructions
   * @param {Object} schema - JSON schema for validation
   * @returns {Promise<Object>} Parsed JSON response
   */
  async generateJSON(prompt, schema = null) {
    try {
      const jsonPrompt = schema
        ? `${prompt}\n\nRespond with valid JSON matching this schema: ${JSON.stringify(schema, null, 2)}`
        : `${prompt}\n\nRespond with valid JSON only.`;

      const response = await this.generateContent(jsonPrompt, {
        temperature: 0.1, // Lower temperature for more consistent JSON
      });

      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const jsonString = jsonMatch[0];
      const parsed = JSON.parse(jsonString);

      return parsed;
    } catch (error) {
      console.error('Cohere JSON generation error:', error);
      throw new Error(`Failed to generate valid JSON: ${error.message}`);
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

module.exports = CohereClient;