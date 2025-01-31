const admin = require('firebase-admin');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const { generateJWT } = require('../utils/jwt');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    })
});

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * 🔹 Signup with Email/Password
 */
exports.signup = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Create Firebase user
        const userRecord = await admin.auth().createUser({ email, password });

        // Create user in MongoDB
        const user = new User({
            firebaseUid: userRecord.uid,
            email: userRecord.email,
            preferences: { theme: 'dark', language: 'javascript' }
        });
        await user.save();

        // Generate JWT
        const token = generateJWT(user);

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: user._id, email: user.email, preferences: user.preferences }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🔹 Google OAuth Login
 */
exports.googleLogin = async (req, res, next) => {
    try {
        const { idToken } = req.body;

        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        // Check if user exists in Firebase
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(payload.email);
        } catch {
            userRecord = await admin.auth().createUser({
                email: payload.email,
                emailVerified: payload.email_verified,
                displayName: payload.name,
                photoURL: payload.picture
            });
        }

        // Find or create user in MongoDB
        let user = await User.findOne({ firebaseUid: userRecord.uid });
        if (!user) {
            user = new User({
                firebaseUid: userRecord.uid,
                email: payload.email,
                name: payload.name,
                preferences: { theme: 'light', language: 'javascript' }
            });
            await user.save();
        }

        // Generate JWT
        const token = generateJWT(user);

        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, email: user.email, name: user.name, preferences: user.preferences }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🔹 Email/Password Login
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Get user from Firebase
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
        } catch (error) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Firebase Admin SDK does not support password verification,
        // So, login with Firebase Client SDK should be handled on frontend.

        // Check if the user exists in MongoDB
        let user = await User.findOne({ firebaseUid: userRecord.uid });

        // If the user doesn't exist in MongoDB, create a new record
        if (!user) {
            user = new User({
                firebaseUid: userRecord.uid,
                email: userRecord.email,
                preferences: { theme: 'light', language: 'javascript' } // default preferences
            });
            await user.save();
        }

        // Generate JWT
        const token = generateJWT(user);

        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, email: user.email, preferences: user.preferences }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 🔹 Logout
 */
exports.logout = async (req, res) => {
    res.json({ message: 'Logged out successfully' });
};
