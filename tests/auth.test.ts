import { afterEach, describe, expect, it, vi } from 'vitest';

import { httpApi, resolveApiBaseUrl } from '../lib/api/http';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('login HTTP contract', () => {
  it('uses the local Docker API when the development variable is missing', () => {
    expect(resolveApiBaseUrl(undefined, 'development')).toBe('http://localhost:8000/api/v1');
    expect(resolveApiBaseUrl('https://api.example.test/api/v1/', 'production')).toBe(
      'https://api.example.test/api/v1',
    );
  });

  it('sends email and password with session credentials, not username', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'owner', email: 'owner@example.com', display_name: 'Owner' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await httpApi.login('owner+admin@example.com', 'test-password');

    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error('Expected a login request');
    const [url, init] = call;
    if (!init || typeof init.body !== 'string') {
      throw new Error('Expected a JSON request body');
    }
    expect(url).toMatch(/\/auth\/login$/);
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body)).toEqual({
      email: 'owner+admin@example.com',
      password: 'test-password',
    });
  });
});
