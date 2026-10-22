import { httpApi } from './http';
import { mockApi } from './mock';
import type { WatchlyApi } from './types';

export const api: WatchlyApi = process.env.NEXT_PUBLIC_API_MOCK === 'true' ? mockApi : httpApi;
export const isMockApi = process.env.NEXT_PUBLIC_API_MOCK === 'true';
export * from './types';
