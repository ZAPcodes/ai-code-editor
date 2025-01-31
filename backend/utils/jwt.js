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
