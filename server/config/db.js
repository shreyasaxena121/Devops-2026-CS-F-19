const mongoose = require('mongoose');
const { registry } = require('../metrics/prometheus');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        registry.dbStatus.set(1);
        console.log('MongoDB Connected');

        mongoose.connection.on('disconnected', () => {
            registry.dbStatus.set(0);
            console.warn('MongoDB Disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            registry.dbStatus.set(1);
            console.log('MongoDB Reconnected');
        });
    } catch (err) {
        registry.dbStatus.set(0);
        console.error('Database Connection Error:', err.message);
        if (process.env.NODE_ENV === 'production' && !process.env.IGNORE_DB_FAILURE) {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
