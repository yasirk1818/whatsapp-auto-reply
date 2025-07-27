// services/whatsapp-service.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const Device = require('../models/Device');

const clients = {}; // Yahan sab active clients (sessions) ko rakhenge

const initializeWhatsApp = (io) => {

    const createSession = async (sessionId, socket) => {
        console.log(`Creating session: ${sessionId}`);
        const client = new Client({
            authStrategy: new LocalAuth({ clientId: sessionId, dataPath: './sessions' }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'] // Server ke liye zaroori
            }
        });

        client.on('qr', (qr) => {
            console.log(`QR code for ${sessionId}:`, qr.substring(0, 30) + "...");
            socket.emit('qr_code', { sessionId, qr });
        });

        client.on('ready', async () => {
            console.log(`Client is ready for session: ${sessionId}`);
            clients[sessionId] = client; // Client ko active list mein daal do
            await Device.findOneAndUpdate({ sessionId }, { status: 'connected' });
            socket.emit('session_ready', { sessionId, message: 'WhatsApp is connected!' });
        });

        client.on('message', async (message) => {
            const device = await Device.findOne({ sessionId });
            if (device && device.status === 'connected') {
                // Yahan aap auto-reply bhej sakte hain
                // فی الحال, hum sirf 'hello' ka jawab denge
                if (message.body.toLowerCase() === 'hello') {
                    message.reply(device.autoReplyMessage);
                }
            }
        });
        
        client.on('disconnected', async (reason) => {
            console.log(`Client was logged out for ${sessionId}:`, reason);
            delete clients[sessionId]; // Active list se nikal do
            await Device.findOneAndUpdate({ sessionId }, { status: 'disconnected' });
            // Aap user ko bhi notify kar sakte hain
        });

        client.initialize().catch(err => console.error(`Failed to initialize session ${sessionId}:`, err));
    };

    const disconnectSession = async (sessionId) => {
        const client = clients[sessionId];
        if (client) {
            await client.destroy(); // Session destroy karega aur logout bhi
            delete clients[sessionId];
            console.log(`Session ${sessionId} disconnected and destroyed.`);
            return true;
        }
        return false;
    };

    // Socket.IO ke connections ko handle karein
    io.on('connection', (socket) => {
        console.log('New client connected via socket');

        socket.on('create_session', (data) => {
            const { sessionId } = data;
            createSession(sessionId, socket);
        });
        
        socket.on('disconnect', () => {
            console.log('Client disconnected from socket');
        });
    });
    
    return { disconnectSession };
};

module.exports = { initializeWhatsApp, clients };
