const { body, validationResult } = require('express-validator');

// Signup Validation Middleware
exports.signupValidation = [
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
