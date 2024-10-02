const crypto = require('crypto'); // for hashing passwords
const { MongoClient } = require('mongodb');
const dbClient = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology: true });

// Function to connect to MongoDB
async function connectToDB() {
    if (!dbClient.isConnected()) {
        await dbClient.connect();
    }
    return dbClient.db('files_manager').collection('users');
}

class UsersController {
    static async postNew(req, res) {
        const { email, password } = req.body;

        // Validate input
        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }
        if (!password) {
            return res.status(400).json({ error: 'Missing password' });
        }

        try {
            const usersCollection = await connectToDB();

            // Check if user already exists
            const existingUser = await usersCollection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Already exist' });
            }

            // Hash the password using SHA1
            const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

            // Insert new user into DB
            const newUser = await usersCollection.insertOne({ email, password: hashedPassword });

            // Return response with the new user's id and email
            return res.status(201).json({
                id: newUser.insertedId,
                email,
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = UsersController;
