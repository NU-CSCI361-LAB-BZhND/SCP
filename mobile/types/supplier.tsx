import { LinkStatus } from '@/types/link';

export type SupplierSearchParams = {
  id?: string;
};

export type SupplierInfo = {
  id: number;
  name: string;
  description: string;
  status: LinkStatus;
};
