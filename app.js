// app.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const { initializeWhatsApp } = require('./services/whatsapp-service');

// Express App
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// Global variable for user session
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Initialize WhatsApp Service
const whatsappService = initializeWhatsApp(io);

// Routes
app.use('/auth', authRoutes);
app.use('/', dashboardRoutes(whatsappService)); // Pass service to routes

app.get('/', (req, res) => {
    if(req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.render('login', { message: '' });
    }
});


// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
