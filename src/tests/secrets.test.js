import { describe, it, expect, vi } from 'vitest';

// Mock the Secret Manager client before importing
vi.mock('@google-cloud/secret-manager', () => ({
  SecretManagerServiceClient: vi.fn().mockImplementation(() => ({
    accessSecretVersion: vi.fn().mockResolvedValue([
      {
        payload: { data: Buffer.from('mock-secret-value') },
      },
    ]),
  })),
}));

// Now import the function under test
const { getSecret } = await import('../secrets.js');

describe('getSecret', () => {
  it('throws if GOOGLE_CLOUD_PROJECT is not set', async () => {
    delete process.env.GOOGLE_CLOUD_PROJECT;
    await expect(getSecret('TEST_SECRET')).rejects.toThrow(
      'GOOGLE_CLOUD_PROJECT environment variable is not set.'
    );
  });

  it('returns the secret value when project ID is set', async () => {
    process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
    const value = await getSecret('TEST_SECRET');
    expect(value).toBe('mock-secret-value');
  });
});
