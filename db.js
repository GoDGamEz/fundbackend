const { MongoClient } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(process.env.DATABASE_URL);

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

module.exports = { connectToMongoDB, client };
