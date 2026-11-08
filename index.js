const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');
const { env } = require('./config/env');
const { User } = require('./models/userModel');
const { createBootstrapAdmin } = require('./utils/createBootstrapAdmin');

async function startServer() {
  try {
    await connectDB();
    await createBootstrapAdmin(User, env);

    const server = app.listen(env.PORT, () => {
      console.log(`Personal Finance Tracker API listening on port ${env.PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received; shutting down`);
      server.close((error) => {
        if (error) {
          console.error('HTTP server shutdown failed:', error);
          process.exitCode = 1;
        }
        mongoose.disconnect().catch((disconnectError) => {
          console.error('MongoDB disconnect failed:', disconnectError);
          process.exitCode = 1;
        });
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start API:', error);
    await mongoose.disconnect();
    process.exitCode = 1;
  }
}

startServer();
