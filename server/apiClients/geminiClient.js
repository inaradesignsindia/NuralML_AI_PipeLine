const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  /**
   * Generate content using Gemini 1.5 Pro
   * @param {string} prompt - The prompt to send to Gemini
   * @param {Object} options - Additional options for generation
   * @returns {Promise<string>} Generated content
   */
  async generateContent(prompt, options = {}) {
    try {
      const generationConfig = {
        temperature: options.temperature || 0.7,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
        maxOutputTokens: options.maxTokens || 2048,
      };

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error.message}`);
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
      console.error('Gemini JSON generation error:', error);
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

module.exports = GeminiClient;