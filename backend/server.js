const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const authRoutes = require('./routes/auth.route');
const mongoose = require('mongoose')
const { logger } = require('./utils/logger');
const { APIError } = require('./utils/errors');

dotenv.config();
const app = express();
// app.use(json())
app.use(express.json());

const PORT = 8000;
app.use(cors());

app.listen(PORT,()=>{
    console.log(`Server is listening on ${PORT}`);
    
});


app.use((err, req, res, next) => {
    if (err instanceof APIError) {
        logger.error(`API Error: ${err.message}`, { statusCode: err.statusCode });
        return res.status(err.statusCode).json(err.toJSON());
    }
    
    logger.error('Unhandled Error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Something went wrong' });
});

mongoose.connect(process.env.MONGO_URI, {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.log('Error:', error.message);
});

app.use('/api/auth', authRoutes);