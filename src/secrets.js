import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Create the Secret Manager client
const client = new SecretManagerServiceClient();

/**
 * Fetches a secret value from Google Secret Manager.
 * @param {string} secretName - The name of the secret.
 * @param {string} version - The version (default "latest").
 * @returns {Promise<string>} The secret value.
 */

// Get the secret value from Google Secret Manager
export async function getSecret(secretName, version = 'latest') {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable is not set.');
  }

  const name = `projects/${projectId}/secrets/${secretName}/versions/${version}`;

  const [response] = await client.accessSecretVersion({ name });
  return response.payload.data.toString('utf8');
}

/**
 * Loads all required secrets into process.env.
 * Call this once at app startup, before connecting to the DB.
 */

// Load all required secrets into process.env
export async function loadSecrets() {
  // Only load from Secret Manager in production (App Engine)
  if (process.env.NODE_ENV === 'production' || process.env.GAE_ENV) {
    process.env.MONGO_CONNECTION_STRING = await getSecret(
      'MONGO_CONNECTION_STRING'
    );
    process.env.MONGO_DATABASE_PASSWORD = await getSecret(
      'MONGO_DATABASE_PASSWORD'
    );
    process.env.CORS_ORIGIN = await getSecret('CORS_ORIGIN');
    // Log secrets loaded from Google Secret Manager
    console.log('Secrets loaded from Google Secret Manager.');
  } else {
    // In local dev, continue using dotenv / .env file
    console.log('Using local .env file for secrets.');
  }
}
