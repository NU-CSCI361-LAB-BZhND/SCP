import { ConsumerCompany } from '@/types/consumer';
import { SupplierCompany } from '@/types/supplier';

export enum LinkStatus {
  Pending  = 'PENDING',
  Accepted = 'ACCEPTED',
  Blocked  = 'BLOCKED',
};

export type LinkInfo = {
  id: number;
  supplier: SupplierCompany;
  consumer: ConsumerCompany;
  status: LinkStatus;
  created_at: string;
};
