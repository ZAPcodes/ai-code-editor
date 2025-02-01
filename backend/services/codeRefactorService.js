const { HfInference } = require('@huggingface/inference');
const { APIError } = require('../utils/errors');
const { logger } = require('../utils/logger');

class CodeRefactorService {
    constructor() {
        this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
        this.model = process.env.STARCODER_MODEL || 'bigcode/starcoder';
    }

    /**
     * AI Code Optimization & Refactoring
     * @param {Object} params - { code, language, optimization_level, userId }
     * @returns {Promise<String>} - Optimized code
     */
    async refactorCode({ code, language, optimization_level, userId }) {
        try {
            const prompt = this._prepareRefactorPrompt(code, language, optimization_level);

            // Call Hugging Face AI Model for refactoring
            const response = await this.hf.textGeneration({
                model: this.model,
                inputs: prompt,
                parameters: { max_new_tokens: 200, temperature: 0.6, top_p: 0.85 }
            });

            // Process AI-generated response
            const optimizedCode = this._processRefactorResponse(response);

            // Log successful refactoring
            logger.info('AI Refactoring Successful', { userId, language, level: optimization_level });

            return optimizedCode;
        } catch (error) {
            logger.error('AI Refactoring Failed', { userId, error: error.message });
            throw new APIError('AI Refactoring failed', 500, error);
        }
    }

    /**
     * Generate AI prompt for refactoring
     */
    _prepareRefactorPrompt(code, language, optimization_level) {
        return `
        Refactor and optimize the following ${language} code:
        ---
        ${code}
        ---
        Optimization Level: ${optimization_level}
        Improve performance, readability, and maintainability without changing functionality.
        `;
    }

    /**
     * Process AI refactoring response
     */
    _processRefactorResponse(response) {
        if (!response || !response.generated_text) {
            throw new APIError('No refactored code received from AI', 500);
        }

        return response.generated_text.trim();
    }
}

module.exports = { CodeRefactorService };
