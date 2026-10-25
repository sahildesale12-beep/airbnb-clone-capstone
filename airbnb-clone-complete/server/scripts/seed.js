require('dotenv').config();
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';
const connectDB = require('../src/config/db');
const mongoose = require('mongoose');
const { seedDemoData } = require('../src/seeds/seedData');

(async () => {
  if (process.env.USE_MEMORY_DB !== 'false') {
    console.error('The seed command requires persistent MongoDB. Set USE_MEMORY_DB=false and configure MONGODB_URI in server/.env first.');
    process.exit(1);
  }
  await connectDB();
  const result = await seedDemoData({ force: process.env.SEED_FORCE === 'true' });
  console.log(result.seeded ? `Inserted ${result.count} demo listings.` : `Database already contains ${result.count} listings; nothing changed.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(async (error) => {
  console.error(`Seed failed: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
