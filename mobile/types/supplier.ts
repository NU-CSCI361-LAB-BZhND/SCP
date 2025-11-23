import type { LinkInfo } from '@/types/link';

export enum DeliveryOptions {
  Delivery = 'DELIVERY',
  Pickup   = 'PICKUP',
  Both     = 'BOTH',
};

export type SupplierSearchParams = {
  id?: string;
};

export type SupplierCompany = {
  id: number;
  company_name: string;
  address: string;
  delivery_options: DeliveryOptions;
  lead_time: number;
};

export type LinkedSupplier = {
  supplier: SupplierCompany;
  link: LinkInfo | null;
};
