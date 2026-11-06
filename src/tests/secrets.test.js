import { describe, it, expect, vi } from 'vitest';

// mock the Secret Manager client before importing
const mockGetProjectId = vi.fn();

vi.mock('@google-cloud/secret-manager', () => ({
  SecretManagerServiceClient: vi.fn().mockImplementation(function () {
    return {
      getProjectId: mockGetProjectId,
      accessSecretVersion: vi.fn().mockResolvedValue([
        {
          payload: { data: Buffer.from('mock-secret-value') },
        },
      ]),
    };
  }),
}));

const mockConfig = { SECRETS_PROJECT_ID: undefined };
vi.mock('../../config.json', () => ({
  default: mockConfig,
}));

// now import the function under test
const { getSecret } = await import('../secrets.js');

describe('getSecret', () => {
  it('throws if project ID environment variables are not set and metadata auto-detect fails', async () => {
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.SECRETS_PROJECT_ID;
    mockConfig.SECRETS_PROJECT_ID = undefined;
    mockGetProjectId.mockRejectedValueOnce(new Error('No metadata server'));
    await expect(getSecret('TEST_SECRET')).rejects.toThrow(
      'Neither SECRETS_PROJECT_ID nor GOOGLE_CLOUD_PROJECT environment variable is set.'
    );
  });

  it('uses config.SECRETS_PROJECT_ID when env vars are not set', async () => {
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.SECRETS_PROJECT_ID;
    mockConfig.SECRETS_PROJECT_ID = 'lyrical-amulet-495920-u8';
    const value = await getSecret('TEST_SECRET');
    expect(value).toBe('mock-secret-value');
  });

  it('returns the secret value when project ID is set', async () => {
    process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
    const value = await getSecret('TEST_SECRET');
    expect(value).toBe('mock-secret-value');
  });
});
