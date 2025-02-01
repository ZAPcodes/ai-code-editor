const { HfInference } = require('@huggingface/inference');
const { APIError } = require('../utils/errors');
const { logger } = require('../utils/logger');

class CodeDebugService {
    constructor() {
        this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
        this.model = process.env.CODE_LLAMA_MODEL || 'codellama/CodeLlama-13b-hf';
    }

    /**
     * AI-Powered Code Debugging
     * @param {Object} params - { code, language, error_message, userId }
     * @returns {Promise<Array>} - Debugging suggestions
     */
    async debugCode({ code, language, error_message, userId }) {
        try {
            const prompt = this._prepareDebugPrompt(code, language, error_message);
            
            // Call Hugging Face AI Model for debugging
            const response = await this.hf.textGeneration({
                model: this.model,
                inputs: prompt,
                parameters: { max_new_tokens: 150, temperature: 0.7, top_p: 0.9 }
            });

            // Process AI response into structured suggestions
            const suggestions = this._processDebugResponse(response);

            // Log debug success
            logger.info('AI Debugging Successful', { userId, language, issuesFound: suggestions.length });

            return suggestions;
        } catch (error) {
            logger.error('AI Debugging Failed', { userId, error: error.message });
            throw new APIError('AI Debugging failed', 500, error);
        }
    }

    /**
     * Generate AI prompt for debugging
     */
    _prepareDebugPrompt(code, language, error_message) {
        return `
        Debug the following ${language} code:
        ---
        ${code}
        ---
        The user reported the following error: "${error_message}"
        Identify potential issues and suggest fixes.
        `;
    }

    /**
     * Processes AI debugging response
     */
    _processDebugResponse(response) {
        if (!response || !response.generated_text) {
            throw new APIError('No debugging data received from AI', 500);
        }

        return response.generated_text.split('\n')
            .filter(line => line.trim().length > 0)
            .map((suggestion, index) => ({
                id: index + 1,
                message: suggestion.trim(),
                severity: suggestion.includes('error') ? 'high' : 'low'
            }))
            .slice(0, 5); // Limit to top 5 suggestions
    }
}

module.exports = { CodeDebugService };
