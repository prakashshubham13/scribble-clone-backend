// Importing packages
import mongoose from 'mongoose';

//Requiring the app constants
import { DB } from '../config/index.js';
const startApp = async () => {
    try {
        // Connection With DB
        await mongoose.connect(DB, {
            useFindAndModify: true,
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
        });
    } catch (err) {}
};
export const connectDB = () => {
    startApp();
    mongoose.connection.on('connected', () =>
        console.log('Database Connected'),
    );
    mongoose.connection.on('error', () => console.log('Database error'));
    mongoose.connection.on('disconnected', () =>
        console.log('Database Disconnected'),
    );
    process.on('SIGINT', () => {
        mongoose.connection.close(() => {
            console.log(
                'Mongoose connection is disconnected due to app termination.....',
            );
        });
        process.exit(0);
    });
};
