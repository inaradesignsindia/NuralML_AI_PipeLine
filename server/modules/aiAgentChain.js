const GeminiClient = require('../apiClients/geminiClient');
const CohereClient = require('../apiClients/cohereClient');

// System prompts for the AI agents
const SYSTEM_PROMPTS = {
  marketAnalysis: `You are a High-Frequency Market Analyst specializing in cryptocurrency scalping strategies. Your expertise lies in analyzing real-time market data to identify short-term trading opportunities.

Your role is to process MarketContext JSON data and generate a comprehensive MarketStateReport that includes:

1. **trend_summary**: A concise analysis of current market trends, momentum, and direction
2. **support_resistance_levels**: Key price levels for support and resistance based on order book and recent price action
3. **volatility_bias**: Assessment of current volatility vs historical norms, including IV vs HV comparison
4. **sentiment_impact**: How market sentiment is influencing price action and potential directional bias

Focus on high-frequency signals suitable for scalping (5-30 minute timeframes). Consider order book depth, recent trade flow, and volatility skew. Provide actionable insights that can inform scalping strategies.

Respond with valid JSON only, matching the expected schema.`,

  strategyReasoning: `You are a Quantitative Strategist specializing in options-based scalping strategies for cryptocurrency markets. You analyze market conditions and account balance to generate optimal trading recommendations.

Your role is to process MarketStateReport + AccountBalance and generate an array of three StrategyRecommendations, each containing:

1. **confidence_score**: 0-1 scale indicating strategy confidence based on market conditions
2. **rationale**: Detailed explanation of why this strategy fits current market conditions
3. **delta**: Options delta exposure (-1 to 1)
4. **gamma**: Options gamma exposure
5. **vega**: Options vega exposure (volatility sensitivity)
6. **exchange_preference**: Preferred exchange for execution (based on liquidity, fees, options availability)

Incorporate risk constraints:
- Maximum position size: 5% of account balance
- Risk-reward ratio: minimum 1:1.5
- IV vs HV logic: Prefer strategies when IV > HV + 10% (volatility premium)
- Maximum drawdown: 2% per trade

Generate exactly 3 strategy recommendations ranked by confidence score. Focus on scalping strategies with 5-15 minute holding periods.

Respond with valid JSON only, matching the expected schema.`,

  logicImplementation: `You are a Trading Execution Model specializing in precise trade implementation for cryptocurrency options scalping. You take the highest-confidence strategy recommendation and convert it into an executable trade object.

Your role is to process the highest-confidence StrategyRecommendation and generate an ExecutableTradeObject containing:

1. **trade_type**: CALL, PUT, or SPREAD strategy type
2. **strike_price**: Specific strike price for the option
3. **expiration**: Expiration date/time (prefer near-term expirations for scalping)
4. **quantity**: Number of contracts (based on position sizing rules)
5. **hedge_action**: Required hedge position (SPOT, PERP, or NONE)
6. **hedge_quantity**: Size of hedge position
7. **exchange_selection**: Specific exchange for execution
8. **slippage_tolerance**: Maximum acceptable slippage (0.5-2%)

Consider execution factors:
- Liquidity at strike price
- Bid-ask spread
- Exchange fees
- Settlement currency
- Margin requirements

Ensure the trade object is ready for direct API submission to the exchange.

Respond with valid JSON only, matching the expected schema.`
};

// JSON schemas for validation
const SCHEMAS = {
  marketStateReport: {
    type: 'object',
    properties: {
      trend_summary: { type: 'string' },
      support_resistance_levels: {
        type: 'object',
        properties: {
          support: { type: 'array', items: { type: 'number' } },
          resistance: { type: 'array', items: { type: 'number' } }
        },
        required: ['support', 'resistance']
      },
      volatility_bias: { type: 'string' },
      sentiment_impact: { type: 'string' }
    },
    required: ['trend_summary', 'support_resistance_levels', 'volatility_bias', 'sentiment_impact']
  },

  strategyRecommendations: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        confidence_score: { type: 'number', minimum: 0, maximum: 1 },
        rationale: { type: 'string' },
        delta: { type: 'number', minimum: -1, maximum: 1 },
        gamma: { type: 'number' },
        vega: { type: 'number' },
        exchange_preference: { type: 'string' }
      },
      required: ['confidence_score', 'rationale', 'delta', 'gamma', 'vega', 'exchange_preference']
    },
    minItems: 3,
    maxItems: 3
  },

  executableTradeObject: {
    type: 'object',
    properties: {
      trade_type: { type: 'string', enum: ['CALL', 'PUT', 'SPREAD'] },
      strike_price: { type: 'number' },
      expiration: { type: 'string' },
      quantity: { type: 'number', minimum: 1 },
      hedge_action: { type: 'string', enum: ['SPOT', 'PERP', 'NONE'] },
      hedge_quantity: { type: 'number' },
      exchange_selection: { type: 'string' },
      slippage_tolerance: { type: 'number', minimum: 0.005, maximum: 0.02 }
    },
    required: ['trade_type', 'strike_price', 'expiration', 'quantity', 'hedge_action', 'hedge_quantity', 'exchange_selection', 'slippage_tolerance']
  }
};

class AIAgentChain {
  constructor() {
    this.geminiClient = new GeminiClient(process.env.GOOGLE_AI_API_KEY);
    this.cohereClient = new CohereClient(process.env.COHERE_API_KEY);
    this.rateLimiter = new Map(); // Simple in-memory rate limiter
  }

  /**
   * Execute the complete AI agent chain sequentially
   * @param {Object} marketContext - MarketContext JSON from DAPP
   * @param {Object} accountBalance - Account balance information
   * @returns {Promise<Object>} Final executable trade object
   */
  async executeChain(marketContext, accountBalance) {
    try {
      console.log('AI Agent Chain: Starting execution');

      // Step 1: Market Analysis Agent
      const marketStateReport = await this.marketAnalysisAgent(marketContext);
      console.log('AI Agent Chain: Market analysis completed');

      // Step 2: Strategy Reasoning Agent
      const strategyRecommendations = await this.strategyReasoningAgent(marketStateReport, accountBalance);
      console.log('AI Agent Chain: Strategy reasoning completed');

      // Step 3: Logic Implementation Agent
      const highestConfidenceStrategy = strategyRecommendations.sort((a, b) => b.confidence_score - a.confidence_score)[0];
      const executableTrade = await this.logicImplementationAgent(highestConfidenceStrategy);
      console.log('AI Agent Chain: Logic implementation completed');

      return {
        marketStateReport,
        strategyRecommendations,
        executableTrade,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('AI Agent Chain error:', error);
      throw new Error(`AI Agent Chain execution failed: ${error.message}`);
    }
  }

  /**
   * Market Analysis Agent - Processes MarketContext and generates MarketStateReport
   */
  async marketAnalysisAgent(marketContext) {
    await this.checkRateLimit('gemini');

    const prompt = `${SYSTEM_PROMPTS.marketAnalysis}

MarketContext Data:
${JSON.stringify(marketContext, null, 2)}

Analyze this market data and provide a MarketStateReport in JSON format.`;

    const response = await this.geminiClient.generateJSON(prompt, SCHEMAS.marketStateReport);
    return response;
  }

  /**
   * Strategy Reasoning Agent - Processes MarketStateReport + AccountBalance and generates StrategyRecommendations
   */
  async strategyReasoningAgent(marketStateReport, accountBalance) {
    await this.checkRateLimit('gemini');

    const prompt = `${SYSTEM_PROMPTS.strategyReasoning}

MarketStateReport:
${JSON.stringify(marketStateReport, null, 2)}

AccountBalance:
${JSON.stringify(accountBalance, null, 2)}

Generate three strategy recommendations in JSON array format.`;

    const response = await this.geminiClient.generateJSON(prompt, SCHEMAS.strategyRecommendations);
    return response;
  }

  /**
   * Logic Implementation Agent - Processes highest-confidence StrategyRecommendation and generates ExecutableTradeObject
   */
  async logicImplementationAgent(strategyRecommendation) {
    await this.checkRateLimit('cohere');

    const prompt = `${SYSTEM_PROMPTS.logicImplementation}

StrategyRecommendation:
${JSON.stringify(strategyRecommendation, null, 2)}

Generate an executable trade object in JSON format.`;

    const response = await this.cohereClient.generateJSON(prompt, SCHEMAS.executableTradeObject);
    return response;
  }

  /**
   * Simple rate limiter to prevent API abuse
   */
  async checkRateLimit(provider) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = provider === 'gemini' ? 10 : 5; // Different limits for different providers

    if (!this.rateLimiter.has(provider)) {
      this.rateLimiter.set(provider, []);
    }

    const requests = this.rateLimiter.get(provider);
    const recentRequests = requests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = windowMs - (now - oldestRequest);
      throw new Error(`Rate limit exceeded for ${provider}. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    recentRequests.push(now);
    this.rateLimiter.set(provider, recentRequests);
  }

  /**
   * Validate JSON against schema (basic validation)
   */
  validateJSON(data, schema) {
    // Basic validation - check required fields exist
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
    }

    // Type checking
    if (schema.type === 'array' && !Array.isArray(data)) {
      throw new Error('Expected array');
    }

    if (schema.type === 'object' && typeof data !== 'object') {
      throw new Error('Expected object');
    }

    return true;
  }

  /**
   * Check if all required API keys are configured
   */
  isConfigured() {
    return this.geminiClient.isConfigured() && this.cohereClient.isConfigured();
  }
}

module.exports = AIAgentChain;