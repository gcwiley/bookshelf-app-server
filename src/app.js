import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import admin from 'firebase-admin';
import express from 'express';
import logger from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// --- IMPORT DATABASE ---
import { connect, disconnect } from './db/connect.js';

// --- IMPORT ROUTERS ---
import { bookRouter } from './routes/book.routes.js';
import { imageRouter } from './routes/image.routes.js';
import { userRouter } from './routes/user.routes.js';

// --- CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';
const angularDistPath = path.join(__dirname, './dist/bookshelf-client/browser');

// --- FIREBASE CREDENTIALS ---
let serviceAccount;
try {
  serviceAccount = JSON.parse(
    readFileSync(
      path.join(__dirname, '../credentials/service-account.json'),
      'utf-8'
    )
  );
} catch (error) {
  console.error(chalk.red('Error reading service account file:'), error);
  process.exit(1);
}

// --- FIREBASE INIT ---
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`,
});
const bucket = admin.storage().bucket();

// --- EXPRESS SETUP ---
const app = express();

// --- HELMET ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // tighten as needed
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'https://storage.googleapis.com'],
      },
    },
  })
);

// --- CORS ---
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

// --- MORGAN LOGGER ---
app.use(logger('dev'));

// --- BODY PARSERS ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- STATIC FILES ---
app.use(express.static(angularDistPath));

// attach bucket to request
app.use((_req, res, next) => {
  res.locals.bucket = bucket;
  next();
});

// --- API RATE LIMITING ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});

// apply the rate limiting middleware to API calls
app.use('/api', apiLimiter);

// --- ROUTES ---
app.use('/api/books', bookRouter);
app.use('/api/images', imageRouter);
app.use('/api/users', userRouter);

// API 404 handler - must come BEFORE the catch-all
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// SPA catch-all - serves index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.resolve(angularDistPath, 'index.html'));
});

// global error handler - express requires 4 args for error handlers
app.use((error, req, res, next) => {
  console.error(chalk.red('Server Error:', error.stack));
  // ensure we don't try to send a response if one was already sent
  if (res.headersSent) {
    return next(error);
  }
  res
    .status(500)
    .json({ error: 'Internal Server Error', message: error.message });
});

// --- STARTUP SEQUENCE ---
const startServer = async () => {
  try {
    await connect();

    const server = app.listen(PORT, () => {
      console.log(chalk.green(`\n✓ Server running on port ${PORT}\n`));
    });

    // Graceful shutdown handler
    const shutdown = async (signal) => {
      console.log(chalk.yellow(`\n${signal} received. Shutting down...`));

      server.close(async () => {
        try {
          await disconnect(); // Close DB connection
          console.log(chalk.green('✓ Server closed gracefully'));
          process.exit(0);
        } catch (err) {
          console.error(chalk.red('Error during shutdown:', err));
          process.exit(1);
        }
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        console.error(chalk.red('Forced shutdown after timeout'));
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error(chalk.red('Failed to start server:'), error);
    process.exit(1);
  }
};

startServer();
