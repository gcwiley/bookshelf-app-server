import path from 'path';
import mongoose from 'mongoose';
import chalk from 'chalk';
import * as dotenv from 'dotenv';

// environment variables
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
  debug: process.env.NODE_ENV === 'development',
  encoding: 'UTF-8',
});

// module-level connection state
let uri;
let dbName;

// --- event listeners ---
mongoose.connection.on('connected', () => {
  console.log(chalk.green(`Mongoose connected to ${dbName}`));
});

mongoose.connection.on('error', (error) => {
  console.error(chalk.red(`Mongoose connection error: ${error}`));
});

mongoose.connection.on('disconnected', () => {
  console.warn(chalk.yellow('Mongoose disconnected'));
});

// -- main connect function ---
async function connect() {
  // extract and validate at execution time
  uri = process.env.MONGO_CONNECTION_STRING;
  dbName = process.env.DATABASE_NAME;

  if (!uri) {
    throw new Error(
      'MONGO_CONNECTION_STRING is not defined in the environment variables.'
    );
  }
  if (!dbName) {
    throw new Error(
      'DATABASE_NAME is not defined in the environment variables.'
    );
  }

  // set mongoose options
  mongoose.set('strictQuery', true);

  // establish connection
  await mongoose.connect(uri, { dbName });
  console.log(
    chalk.blue(
      '\n',
      `Successfully connected to the NOSQL database - ${dbName}.`,
      '\n'
    )
  );
}

// -- disconnect function ---
async function disconnect() {
  await mongoose.connection.close();
  console.log(chalk.blue('Mongoose connection closed.'));
}

export { connect, disconnect };
