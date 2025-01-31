const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        },
        language: {
            type: String,
            enum: ['javascript', 'python', 'cpp'],
            default: 'javascript'
        },
        editorSettings: {
            fontSize: {
                type: Number,
                default: 14
            },
            tabSize: {
                type: Number,
                default: 4
            },
            autoSave: {
                type: Boolean,
                default: true
            }
        }
    },
    savedCode: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CodeSnippet'
    }],
    collaborations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collaboration'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
    if (this.isModified('email')) {
        this.email = this.email.toLowerCase();
    }
    next();
});

// Instance methods
userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    return this.save();
};

// Static methods
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
    return this.findOne({ firebaseUid });
};

const User = mongoose.model('User', userSchema);

module.exports = User;