const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');

const authRoutes = require('./routes/auth.route');
const aiRoutes = require('./routes/ai.routes');
const { RealTimeAIService } = require('./services/realTimeAIService');
const { logger } = require('./utils/logger');
const { APIError } = require('./utils/errors');
const collaborationRoutes = require('./routes/collabration.route');
const CollaborationRoom = require('./models/collabrationRooms.model');
const { verifyToken } = require('./utils/jwt');

dotenv.config();
const app = express();
const server = http.createServer(app); // ✅ Create HTTP Server for WebSockets
const io = socketIo(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 8000;

// ✅ Middleware
app.use(express.json());
app.use(cors());

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/collaboration', collaborationRoutes);

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB Connection Error:', error.message);
});

// ✅ WebSocket Setup for Real-Time AI Suggestions
const aiService = new RealTimeAIService();
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('request_suggestions', async ({ code, language, cursor_position }) => {
        try {
            const suggestions = await aiService.getRealTimeSuggestions({ code, language, cursor_position });
            socket.emit('receive_suggestions', suggestions);
        } catch (error) {
            socket.emit('ai_error', { error: 'AI Suggestion Failed' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// ✅ Error Handling Middleware (Placed at the END)
app.use((err, req, res, next) => {
    if (err instanceof APIError) {
        logger.error(`API Error: ${err.message}`, { statusCode: err.statusCode });
        return res.status(err.statusCode).json(err.toJSON());
    }
    
    logger.error('Unhandled Error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Something went wrong' });
});

// ✅ Start Server
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
