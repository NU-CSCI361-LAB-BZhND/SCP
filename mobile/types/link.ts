import { SupplierCompany } from '@/types/supplier';

export enum LinkStatus {
  Approved = 'APPROVED',
  Pending  = 'PENDING',
  None     = 'NONE',
};

export enum NewLinkStatus { // TODO: Refactor to remove the old `LinkStatus`
  Pending  = 'PENDING',
  Accepted = 'ACCEPTED',
  Blocked  = 'BLOCKED',
};

export type LinkInfo = {
  id: number;
  supplier: SupplierCompany;
  status: NewLinkStatus;
  created_at: string;
};
