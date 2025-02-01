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
            handler: (req, res, next) => {
                next(new APIError('Too many requests, please try again later.', 429));
            }
        });
    }
}

// Exporting an instance and the limiters object
const rateLimiter = new RateLimiter();
module.exports = { rateLimiter, limiters: rateLimiter.limiters };
