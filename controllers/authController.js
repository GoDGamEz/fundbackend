const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient } = require('mongodb');

const handleLogin = async (req, res) => {
    const { user, pwd } = req.body;
    if (!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });

    const client = new MongoClient(process.env.DATABASE_URL);
    
    try {
        await client.connect();

        const db = client.db();
        const usersCollection = db.collection('users');

        const foundUser = await usersCollection.findOne({ username: user });
        if (!foundUser) return res.sendStatus(401); // No user found

        // Check password
        const match = await bcrypt.compare(pwd, foundUser.password);
        if (match) {
            // create JWTs
            const accessToken = jwt.sign(
                { username: foundUser.username },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '10s' }
            );
            const refreshToken = jwt.sign(
                { username: foundUser.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '30s' }
            );

            // Update refreshToken in database
            await usersCollection.updateOne(
                { username: foundUser.username },
                { $set: { refreshToken } }
            );

            res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
            res.json({ roles: foundUser.roles, accessToken });
        } else {
            res.sendStatus(401); // Wrong password
        }
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        await client.close();
    }
}

module.exports = { handleLogin };
