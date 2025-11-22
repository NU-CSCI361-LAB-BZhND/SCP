import { createContext } from 'react';
import type { GlobalState } from '@/types/state';
import type { LinkedSupplier } from '@/types/supplier';

export const GlobalContext = createContext<GlobalState>({
  accessToken: null,
  setAccessToken: () => {},
  refreshToken: null,
  setRefreshToken: () => {},
  update: 0,
  forceUpdate: () => {},
  linkedSupplierCache: undefined!, // Will actually always be available
});
