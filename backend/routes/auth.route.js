const express = require('express');
const { signup, googleLogin, logout, login } = require('../controllers/auth.controller');
const { signupValidation } = require('../middleware/validateRequest');

const router = express.Router();

// Regular Email/Password Signup
router.post('/signup',signupValidation, signup);
// Google OAuth Login
router.post('/google', googleLogin);
// Logout
router.post('/logout', logout);

router.post('/login', login);

module.exports = router;
