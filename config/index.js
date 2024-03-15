// Importing packages
import dotenv from 'dotenv';
dotenv.config();

// Initializing environment variables
const SECRET = process.env.APP_SECRET;
const DB = process.env.APP_DB;
const PORT = process.env.APP_PORT;

export { SECRET, DB, PORT };
