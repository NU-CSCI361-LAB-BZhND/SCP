import type { RefObject } from 'react';
import type { LinkedSupplier } from '@/types/supplier';

export type GlobalState = {
  accessToken: string | null;
  setAccessToken: (s: string | null) => void;
  refreshToken: string | null;
  setRefreshToken: (s: string | null) => void;
  update: number,
  forceUpdate: () => void,
  linkedSupplierCache: RefObject<LinkedSupplier[]>;
};
