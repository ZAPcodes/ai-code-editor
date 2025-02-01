const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { CodeCompletionService } = require('../services/codeCompletionService');
const { CodeDebugService } = require('../services/codeDebugService');
const { CodeRefactorService } = require('../services/codeRefactorService');
const { rateLimiter } = require('../utils/rateLimiter');
const { APIError } = require('../utils/errors');

// Initialize AI services
const codeCompletionService = new CodeCompletionService();
const codeDebugService = new CodeDebugService();
const codeRefactorService = new CodeRefactorService();

// 🔹 Middleware for validating AI request inputs
const validateCodeInput = [
    body('code').notEmpty().withMessage('Code snippet is required'),
    body('language')
        .notEmpty()
        .isIn(['javascript', 'python', 'cpp'])
        .withMessage('Invalid programming language'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// 🔹 Route: Code Completion (AI-Powered)
router.post('/code-completion', rateLimiter.limiters.code_completion, validateCodeInput, async (req, res, next) => {
    try {
        const { code, language, cursor_position = code.length } = req.body;
        const userId = req.user ? req.user.id : 'anonymous'; // Handle unauthenticated users

        // Get AI-generated code completion
        const suggestions = await codeCompletionService.getSuggestions({ code, language, cursor_position, userId });

        res.json({ suggestions });
    } catch (error) {
        next(new APIError(error.message, 500));
    }
});

// 🔹 Route: Code Debugging (AI-Powered)
router.post('/debug', rateLimiter.limiters.code_completion, validateCodeInput, async (req, res, next) => {
    try {
        const { code, language, error_message = '' } = req.body;
        const userId = req.user ? req.user.id : 'anonymous';

        // Get AI-powered debugging suggestions
        const debugSuggestions = await codeDebugService.debugCode({ code, language, error_message, userId });

        res.json({ debug_suggestions: debugSuggestions });
    } catch (error) {
        next(new APIError(error.message, 500));
    }
});

// 🔹 Route: Code Refactoring & Optimization
router.post('/refactor', rateLimiter.limiters.code_completion, validateCodeInput, async (req, res, next) => {
    try {
        const { code, language, optimization_level = 'medium' } = req.body;
        const userId = req.user ? req.user.id : 'anonymous';

        // Get AI-based code refactoring
        const refactoredCode = await codeRefactorService.refactorCode({ code, language, optimization_level, userId });

        res.json({ refactored_code: refactoredCode });
    } catch (error) {
        next(new APIError(error.message, 500));
    }
});

module.exports = router;
