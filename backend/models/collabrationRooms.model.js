const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const CollaborationRoomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    content: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
CollaborationRoomSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare passwords
CollaborationRoomSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('CollaborationRoom', CollaborationRoomSchema);
