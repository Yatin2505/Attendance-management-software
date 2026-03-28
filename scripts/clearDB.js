/**
 * clearDB.js - Clears all collections from the attendance database.
 * Run: node scripts/clearDB.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

const collections = ['users', 'students', 'batches', 'attendances'];

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.\n');

    for (const col of collections) {
      try {
        const result = await mongoose.connection.db.collection(col).deleteMany({});
        console.log(`🗑️  Cleared '${col}': ${result.deletedCount} documents deleted`);
      } catch (err) {
        console.log(`⚠️  Skipped '${col}': ${err.message}`);
      }
    }

    console.log('\n✅ All collections cleared! Database is fresh and ready.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

clearDatabase();
