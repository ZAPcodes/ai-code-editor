const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Generate JWT token for user authentication
 * @param {Object} user - The user object from the database
 * @returns {string} JWT token
 */
exports.generateJWT = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Token expires in 7 days
    );
};

/**
 * Verify JWT token for user authentication
 * @param {string} token - The JWT token to verify
 * @returns {Object|false} Decoded token if valid, false if invalid
 */
exports.verifyToken = (token) => {
    try {
        // Verify the token and decode it
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded; // Return the decoded token (user info)
    } catch (error) {
        return false; // Return false if token is invalid or expired
    }
};
