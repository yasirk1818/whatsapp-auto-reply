// routes/dashboard.js
const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const { v4: uuidv4 } = require('uuid'); // Unique ID banane ke liye
const fs = require('fs-extra'); // File system operations ke liye
const path = require('path');

// Authentication middleware
const authCheck = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

module.exports = function(whatsappService) {
    // Dashboard Page
    router.get('/dashboard', authCheck, async (req, res) => {
        try {
            const devices = await Device.find({ owner: req.session.user.id });
            res.render('dashboard', { devices: devices, user: req.session.user });
        } catch (err) {
            console.error(err);
            res.status(500).send("Server Error");
        }
    });

    // Naya Device Add Karein
    router.post('/devices/add', authCheck, async (req, res) => {
        const sessionId = uuidv4(); // Har device ke liye ek unique ID
        try {
            const newDevice = new Device({
                sessionId: sessionId,
                owner: req.session.user.id,
                status: 'pending',
            });
            await newDevice.save();
            res.redirect('/dashboard');
        } catch (err) {
            console.error(err);
            res.status(500).send("Server Error");
        }
    });

    // Device Delete Karein
    router.post('/devices/delete/:id', authCheck, async (req, res) => {
        try {
            const device = await Device.findOne({ _id: req.params.id, owner: req.session.user.id });
            if (!device) {
                return res.status(404).send('Device not found');
            }
            
            // 1. WhatsApp session disconnect karein
            await whatsappService.disconnectSession(device.sessionId);
            
            // 2. Session folder delete karein
            const sessionPath = path.join(__dirname, '..', 'sessions', `session-${device.sessionId}`);
            await fs.remove(sessionPath);

            // 3. Database se device delete karein
            await Device.deleteOne({ _id: req.params.id });

            res.redirect('/dashboard');
        } catch (err) {
            console.error('Error deleting device:', err);
            res.status(500).send("Server Error");
        }
    });
    
    // Auto-reply message update karein
    router.post('/devices/update-reply/:id', authCheck, async (req, res) => {
        try {
            const { message } = req.body;
            await Device.findOneAndUpdate(
                { _id: req.params.id, owner: req.session.user.id },
                { autoReplyMessage: message }
            );
            res.redirect('/dashboard');
        } catch(err) {
            console.error('Error updating reply:', err);
            res.status(500).send("Server Error");
        }
    });

    return router;
};
