export enum ComplaintStatus {
  Open       = 'OPEN',
  InProgress = 'IN_PROGRESS',
  Resolved   = 'RESOLVED',
  Dismissed  = 'DISMISSED',
};

export enum ComplaintEscalationLevel {
  SalesRep = 'SALES_REP',
  Manager  = 'MANAGER',
  Owner    = 'OWNER',
};

export type Complaint = {
  id: number;
  order: number;
  created_by_email: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  escalation_level: ComplaintEscalationLevel;
  created_at: string;
};
