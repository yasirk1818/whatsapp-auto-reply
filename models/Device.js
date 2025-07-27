// models/Device.js
const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    sessionId: { // Yeh device ki unique ID hogi
        type: String,
        required: true,
        unique: true,
    },
    owner: { // Yeh user se link hoga
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['pending', 'connected', 'disconnected'],
        default: 'pending'
    },
    autoReplyMessage: {
        type: String,
        default: 'Thank you for your message. This is an automated reply.'
    }
}, { timestamps: true });

module.exports = mongoose.model('Device', DeviceSchema);
