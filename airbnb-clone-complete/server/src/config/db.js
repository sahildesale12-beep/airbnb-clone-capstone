const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function connectDB() {
  mongoose.set('strictQuery', true);

  const isProduction = process.env.NODE_ENV === 'production';
  const useMemoryDB = !isProduction && process.env.USE_MEMORY_DB !== 'false';

  if (useMemoryDB) {
    // Helpful for learning/demo use when MongoDB is not installed locally.
    // The first startup may download the MongoDB binary; internet is required once.
    const memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri('airbnb_clone');

    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
      console.log('MongoDB connected: airbnb_clone (in-memory development database)');
      console.warn('DEVELOPMENT MODE: database data will be lost when the server stops.');
      return memoryServer;
    } catch (error) {
      await memoryServer.stop();
      throw error;
    }
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is required when USE_MEMORY_DB=false or NODE_ENV=production.'
    );
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  return null;
}

module.exports = connectDB;
