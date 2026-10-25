require('dotenv').config();
const crypto = require('crypto');
const http = require('http');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { seedDemoData } = require('./seeds/seedData');

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

function ensureEnvironment() {
  const production = process.env.NODE_ENV === 'production';
  if (production) {
    const missing = ['MONGODB_URI', 'JWT_SECRET', 'SESSION_SECRET'].filter((key) => !process.env[key]);
    if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(', ')}.`);
    for (const key of ['JWT_SECRET', 'SESSION_SECRET']) {
      if (process.env[key].length < 32) throw new Error(`${key} must be at least 32 characters in production.`);
    }
    if (process.env.USE_MEMORY_DB === 'true') throw new Error('USE_MEMORY_DB cannot be enabled in production.');
    return;
  }
  for (const key of ['JWT_SECRET', 'SESSION_SECRET']) {
    const value = process.env[key] || '';
    if (value.length < 32 || /PASTE_|REPLACE_|replace_this/i.test(value)) {
      process.env[key] = crypto.randomBytes(32).toString('hex');
      console.warn(`${key} was generated for local development only.`);
    }
  }
}

async function startServer() {
  ensureEnvironment();
  const memoryServer = await connectDB();

  if (process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO_DATA !== 'false') {
    try {
      const result = await seedDemoData();
      if (result.seeded) console.log(`Inserted ${result.count} demo properties. Demo guest: guest@staybnb.local / GuestPass123! Demo host: host@staybnb.local / HostPass123!`);
    } catch (error) {
      console.error(`Demo seed skipped: ${error.message}`);
    }
  }

  const app = require('./app');
  const port = Number(process.env.PORT) || 5000;
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`API listening at http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
    if (process.env.NODE_ENV !== 'production' && process.env.USE_MEMORY_DB !== 'false') {
      console.log('Using temporary development database. Data is lost when server stops.');
    }
  });

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received. Closing server...`);
    server.close(async () => {
      try {
        await mongoose.disconnect();
        if (memoryServer) await memoryServer.stop();
      } finally {
        process.exit(0);
      }
    });
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((error) => {
  console.error(`Unable to start server: ${error.message}`);
  process.exit(1);
});
