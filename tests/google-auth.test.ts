import { afterEach, describe, expect, it, vi } from 'vitest';

import { disableGoogleAutoSelect } from '../lib/auth/google';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Google logout integration', () => {
  it('disables Google automatic account selection when the library is available', () => {
    const disableAutoSelect = vi.fn();
    vi.stubGlobal('window', {
      google: { accounts: { id: { disableAutoSelect } } },
    });

    disableGoogleAutoSelect();

    expect(disableAutoSelect).toHaveBeenCalledOnce();
  });

  it('is a no-op before the Google library has loaded', () => {
    vi.stubGlobal('window', {});
    expect(() => disableGoogleAutoSelect()).not.toThrow();
  });
});
