class APIError extends Error {
    constructor(message, statusCode = 500, originalError = null) {
        super(message);
        this.statusCode = statusCode;
        this.originalError = originalError;
        
        // Capture stack trace (if available)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, APIError);
        }
    }

    toJSON() {
        return {
            error: this.message,
            statusCode: this.statusCode
        };
    }
}

module.exports = { APIError };
