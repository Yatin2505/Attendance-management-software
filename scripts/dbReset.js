const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const dbReset = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for reset...');

    const collections = await mongoose.connection.db.collections();
    
    for (let collection of collections) {
      await collection.deleteMany({});
      console.log(`Cleared collection: ${collection.collectionName}`);
    }

    console.log('Database reset complete. All collections are empty.');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error.message);
    process.exit(1);
  }
};

dbReset();
