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

  it('exchanges the Google ID token for the existing Watchly session cookie', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'google-user', email: 'user@gmail.com', display_name: 'User' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await httpApi.loginWithGoogle('signed-google-id-token');

    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error('Expected a Google login request');
    const [url, init] = call;
    if (!init || typeof init.body !== 'string') throw new Error('Expected a JSON request body');
    expect(url).toMatch(/\/auth\/google$/);
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body)).toEqual({ credential: 'signed-google-id-token' });
  });

  it('logs out through the server so the opaque session is revoked', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await httpApi.logout();

    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error('Expected a logout request');
    const [url, init] = call;
    expect(url).toMatch(/\/auth\/logout$/);
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('include');
  });
});

describe('news HTTP contract', () => {
  it('maps the backend RSS response to the web model', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          configured: true,
          next_cursor: null,
          items: [
            {
              id: 'news-1',
              source: 'example.org',
              title: 'Nuova stagione annunciata',
              excerpt: 'Un breve estratto.',
              published_at: '2026-10-27T10:00:00Z',
              image_url: 'https://example.org/image.jpg',
              url: 'https://example.org/article',
              series: [{ id: 'series-1', title: 'Example Anime', followed: true }],
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(httpApi.news()).resolves.toEqual({
      configured: true,
      items: [
        {
          id: 'news-1',
          source: 'example.org',
          title: 'Nuova stagione annunciata',
          excerpt: 'Un breve estratto.',
          publishedAt: '2026-10-27T10:00:00Z',
          imageUrl: 'https://example.org/image.jpg',
          url: 'https://example.org/article',
          relatedSeries: [{ id: 'series-1', title: 'Example Anime', following: true }],
        },
      ],
    });
  });
});
