export type OrderSearchParams = {
  id?: number;
};

export enum OrderStatus {
  Pending  = 'PENDING',
  Sent     = 'SENT',
  Declined = 'DECLINED',
}

export type OrderInfo = {
  id: number;
  supplier: number;
  item: number;
  quantity: number;
  status: OrderStatus;
};
