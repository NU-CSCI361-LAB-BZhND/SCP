export enum NotificationType {
  Order     = 'ORDER',
  Complaint = 'COMPLAINT',
  System    = 'SYSTEM',
};

export type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  related_id: string;
  is_read: boolean;
  created_at: string;
};
