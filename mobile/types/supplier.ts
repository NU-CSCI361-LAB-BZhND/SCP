import { LinkStatus } from '@/types/link';
import type { LinkInfo } from '@/types/link';

export enum SubscriptionStatus {
  Trial   = 'TRIAL',
  Active  = 'ACTIVE',
  Expired = 'EXPIRED',
};

export type SupplierSearchParams = {
  id?: string;
};

export type SupplierInfo = {
  id: number;
  name: string;
  description: string;
  status: LinkStatus;
};

export type SupplierCompany = {
  id: number;
  company_name: string;
  address: string;
  subscription_status: SubscriptionStatus;
};

export type LinkedSupplier = {
  supplier: SupplierCompany;
  link: LinkInfo | null;
};
