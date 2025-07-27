// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register Page (GET)
router.get('/register', (req, res) => {
    res.render('register', { message: '' });
});

// Register Handle (POST)
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.render('register', { message: 'Please fill in all fields' });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', { message: 'Email is already registered' });
        }
        const user = new User({ email, password });
        await user.save();
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.render('register', { message: 'Something went wrong' });
    }
});

// Login Page (GET)
router.get('/login', (req, res) => {
    res.render('login', { message: '' });
});

// Login Handle (POST)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.render('login', { message: 'Invalid email or password' });
        }
        // Session mein user ko save karein
        req.session.user = { id: user._id, email: user.email, role: user.role };
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('login', { message: 'Something went wrong' });
    }
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid'); // Session cookie ko saaf karein
        res.redirect('/auth/login');
    });
});

module.exports = router;
