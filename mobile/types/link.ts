import { SupplierCompany } from '@/types/supplier';

export enum LinkStatus {
  Pending  = 'PENDING',
  Accepted = 'ACCEPTED',
  Blocked  = 'BLOCKED',
};

export type LinkInfo = {
  id: number;
  supplier: SupplierCompany;
  status: LinkStatus;
  created_at: string;
};
