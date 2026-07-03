import storage from '../storage';

// In the jest-expo environment Platform.OS defaults to 'ios', so this exercises
// the AsyncStorage branch (backed by the official in-memory mock).
describe('storage', () => {
  beforeEach(async () => {
    await storage.removeItem('key');
  });

  it('round-trips a stored value', async () => {
    await storage.setItem('key', 'value');
    expect(await storage.getItem('key')).toBe('value');
  });

  it('returns null for a missing key', async () => {
    expect(await storage.getItem('does-not-exist')).toBeNull();
  });

  it('removes a stored value', async () => {
    await storage.setItem('key', 'value');
    await storage.removeItem('key');
    expect(await storage.getItem('key')).toBeNull();
  });

  it('serializes and restores JSON payloads', async () => {
    const profile = { id: 1, name: 'Test', preferences: { currency: 'USD' } };
    await storage.setItem('currentUser', JSON.stringify(profile));
    expect(JSON.parse(await storage.getItem('currentUser'))).toEqual(profile);
  });
});
