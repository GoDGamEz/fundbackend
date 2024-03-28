const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

    const client = new MongoClient(process.env.DATABASE_URL);

    try {
        await client.connect();

        const db = client.db();
        const usersCollection = db.collection('users');

        const foundUser = await usersCollection.findOne({ refreshToken });
        if (!foundUser) return res.sendStatus(403); // Forbidden

        // Verify jwt 
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err || foundUser.username !== decoded.username) return res.sendStatus(403);
                const accessToken = jwt.sign(
                    { username: decoded.username },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '30s' }
                );
                res.json({ accessToken });
            }
        );
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        await client.close();
    }
}

module.exports = { handleRefreshToken };
