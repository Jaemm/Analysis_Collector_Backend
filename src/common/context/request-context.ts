import { AsyncLocalStorage } from 'async_hooks';

interface Store {
  requestId: string;
}

export const requestContext = new AsyncLocalStorage<Store>();
