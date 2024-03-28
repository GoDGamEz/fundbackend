const { MongoClient } = require('mongodb');
const fsPromises = require('fs').promises;
const path = require('path');

const handleLogout = async (req, res) => {
    // On client, also delete the accessToken

    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content

    const refreshToken = cookies.jwt;

    const client = new MongoClient(process.env.DATABASE_URL);

    try {
        await client.connect();

        const db = client.db();
        const usersCollection = db.collection('users');

        // Is refreshToken in db?
        const foundUser = await usersCollection.findOne({ refreshToken });
        if (!foundUser) {
            res.clearCookie('jwt', { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
            return res.sendStatus(204);
        }

        // Delete refreshToken on db
        await usersCollection.updateOne(
            { refreshToken },
            { $set: { refreshToken: '' } }
        );

        res.clearCookie('jwt', { httpOnly: true, samesite: 'None', secure: true }); // secure: true - only serves on https
        res.sendStatus(204);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        await client.close();
    }
}

module.exports = { handleLogout };
