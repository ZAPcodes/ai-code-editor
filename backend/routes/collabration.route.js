const express = require('express');
const router = express.Router();
const CollaborationRoom = require('../models/collabrationRooms.model');
const { verifyToken } = require('../utils/jwt');

// ✅ Create a new collaboration room
router.post('/create', verifyToken, async (req, res) => {
    try {
        const { roomId, password, language } = req.body;

        const existingRoom = await CollaborationRoom.findOne({ roomId });
        if (existingRoom) return res.status(400).json({ error: 'Room ID already exists' });

        const newRoom = new CollaborationRoom({ roomId, password, language });
        await newRoom.save();

        res.json({ message: 'Room created successfully', roomId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// ✅ Join an existing collaboration room
router.post('/join', verifyToken, async (req, res) => {
    try {
        const { roomId, password } = req.body;

        const room = await CollaborationRoom.findOne({ roomId });
        if (!room) return res.status(404).json({ error: 'Room not found' });

        const isPasswordValid = await room.comparePassword(password);
        if (!isPasswordValid) return res.status(401).json({ error: 'Incorrect password' });

        res.json({ message: 'Joined successfully', room });
    } catch (error) {
        res.status(500).json({ error: 'Failed to join room' });
    }
});

// ✅ Fetch room details (for frontend)
router.get('/:roomId', verifyToken, async (req, res) => {
    try {
        const room = await CollaborationRoom.findOne({ roomId }).populate('participants', 'email name');
        if (!room) return res.status(404).json({ error: 'Room not found' });

        res.json(room);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch room' });
    }
});

module.exports = router;
