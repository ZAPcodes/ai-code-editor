const axios = require('axios');
const { HfInference } = require('@huggingface/inference');
const { rateLimiter } = require('../utils/rateLimiter');
const { logger } = require('../utils/logger');
const { APIError } = require('../utils/errors');

class CodeCompletionService {
    constructor() {
        this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

        // Define model mappings for different languages
        this.modelEndpoints = {
            javascript: process.env.CODE_LLAMA_MODEL || 'codellama/CodeLlama-13b-hf',
            python: process.env.CODE_LLAMA_MODEL || 'codellama/CodeLlama-13b-hf',
            cpp: process.env.STARCODER_MODEL || 'bigcode/starcoder'
        };
    }

    /**
     * Generates code completion suggestions
     * @param {Object} params - { code, language, cursor_position, userId }
     * @returns {Promise<Array>} - List of suggested completions
     */
    async getSuggestions({ code, language, cursor_position, userId }) {
        // Enforce rate limits per user
        await rateLimiter.checkLimit(userId, 'code_completion');

        try {
            // Validate language support
            if (!this.modelEndpoints[language]) {
                throw new APIError(`Unsupported language: ${language}`, 400);
            }

            // Prepare context-aware prompt
            const prompt = this._preparePrompt(code, language, cursor_position);

            // Fetch AI-generated completion
            const completion = await this._getModelPrediction(prompt, language);

            // Process and return structured suggestions
            const suggestions = this._processSuggestions(completion, language);

            // Log successful operation
            logger.info('Code completion successful', { userId, language, codeLength: code.length });

            return suggestions;
        } catch (error) {
            logger.error('Code completion error', { userId, language, error: error.message });
            throw new APIError('Code completion failed', 500, error);
        }
    }

    /**
     * Prepares a context-aware prompt for AI model
     */
    _preparePrompt(code, language, cursor_position) {
        const prefix = code.substring(0, cursor_position);
        const suffix = code.substring(cursor_position);

        return `
        Complete the following ${language} code:
        ---
        ${prefix}
        |
        ${suffix}
        ---
        Output should be a natural continuation of the given code.
        `;
    }

    /**
     * Fetches model-generated completion using Hugging Face API
     */
    async _getModelPrediction(prompt, language) {
        const model = this.modelEndpoints[language];

        try {
            const response = await this.hf.textGeneration({
                model,
                inputs: prompt,
                parameters: {
                    max_new_tokens: 100,
                    temperature: 0.7,
                    top_p: 0.9,
                    stop: ['```', '\n\n']
                }
            });

            return response;
        } catch (error) {
            throw new APIError(`Model request failed for ${language}: ${error.message}`, 500);
        }
    }

    /**
     * Processes AI-generated completion into structured suggestions
     */
    _processSuggestions(completion, language) {
        if (!completion || !completion.generated_text) {
            throw new APIError('No completion data received from model', 500);
        }

        return completion.generated_text
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(suggestion => ({
                text: suggestion.trim(),
                type: this._inferSuggestionType(suggestion, language),
                confidence: this._calculateConfidence(suggestion)
            }))
            .slice(0, 5); // Limit to top 5 suggestions
    }

    /**
     * Infers suggestion type (function, variable, class, etc.)
     */
    _inferSuggestionType(suggestion, language) {
        if (suggestion.includes('function') || suggestion.includes('def ')) return 'function';
        if (suggestion.includes('class ')) return 'class';
        if (suggestion.match(/^[a-zA-Z_][a-zA-Z0-9_]* =/)) return 'variable';
        return 'code';
    }

    /**
     * Calculates confidence score based on complexity
     */
    _calculateConfidence(suggestion) {
        const complexity = suggestion.split(/[.(){}[\]]/).length;
        return Math.min(0.95, 0.5 + (complexity * 0.1));
    }
}

module.exports = { CodeCompletionService };
