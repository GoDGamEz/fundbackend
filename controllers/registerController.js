const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();

const handleNewUser = async (req, res) => {
    const { user, pwd } = req.body;
    if (!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });

    const client = new MongoClient(process.env.DATABASE_URL);

    try {
        await client.connect();

        const db = client.db();
        const usersCollection = db.collection('users');

        // Check for duplicate usernames in the db
        const duplicate = await usersCollection.findOne({ username: user });
        if (duplicate) return res.sendStatus(409); // Conflict

        // Encrypt the password
        const hashedPwd = await bcrypt.hash(pwd, 10);

        // Store the new user
        await usersCollection.insertOne({ username: user, password: hashedPwd });

        res.status(201).json({ 'success': `New user ${user} created!` });
    } catch (err) {
        console.error('Error occurred:', err);
        res.status(500).json({ 'message': 'Internal Server Error' });
    } finally {
        await client.close();
    }
}

module.exports = { handleNewUser };
