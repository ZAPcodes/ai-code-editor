const { HfInference } = require('@huggingface/inference');
const { APIError } = require('../utils/errors');
const { logger } = require('../utils/logger');

class RealTimeAIService {
    constructor() {
        this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
        this.model = process.env.CODE_LLAMA_MODEL || 'codellama/CodeLlama-13b-hf';
    }

    /**
     * Provides real-time AI suggestions for code completion.
     * @param {Object} params - { code, language, cursor_position }
     * @returns {Promise<Array>} - Live AI suggestions
     */
    async getRealTimeSuggestions({ code, language, cursor_position }) {
        try {
            const prompt = this._preparePrompt(code, language, cursor_position);

            // AI Model Prediction
            const response = await this.hf.textGeneration({
                model: this.model,
                inputs: prompt,
                parameters: { max_new_tokens: 50, temperature: 0.7, top_p: 0.9 }
            });

            return this._processResponse(response);
        } catch (error) {
            logger.error('AI Real-Time Suggestions Failed', { error: error.message });
            throw new APIError('AI Real-Time Suggestion failed', 500, error);
        }
    }

    /**
     * Prepares AI prompt for real-time completion.
     */
    _preparePrompt(code, language, cursor_position) {
        const prefix = code.substring(0, cursor_position);
        return `
        Complete the following ${language} code:
        ---
        ${prefix}|
        ---
        Continue the code naturally.
        `;
    }

    /**
     * Processes AI response.
     */
    _processResponse(response) {
        if (!response || !response.generated_text) {
            throw new APIError('No completion received from AI', 500);
        }

        return response.generated_text.split('\n')
            .filter(line => line.trim().length > 0)
            .map(suggestion => ({ text: suggestion.trim() }))
            .slice(0, 5); // Return top 5 suggestions
    }
}

module.exports = { RealTimeAIService };
