const rateLimit = require('express-rate-limit');
const { APIError } = require('./errors');

class RateLimiter {
    constructor() {
        this.limiters = {
            code_completion: this.createLimiter(5, 60), // 5 requests per minute
            auth: this.createLimiter(10, 60), // 10 requests per minute for auth endpoints
        };
    }

    createLimiter(maxRequests, windowInSeconds) {
        return rateLimit({
            windowMs: windowInSeconds * 1000, 
            max: maxRequests, 
            message: { error: 'Too many requests, please try again later.' },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res, next, options) => {
                next(new APIError('Too many requests, please try again later.', 429));
            }
        });
    }

    async checkLimit(userId, action) {
        // Since we removed Redis, this method is now a placeholder.
        // Rate limiting is handled automatically by `express-rate-limit`
        return true;
    }
}

module.exports = new RateLimiter();
