export type OrderSearchParams = {
  id?: string;
};

export enum OrderStatus {
  Pending   = 'PENDING',
  Confirmed = 'CONFIRMED',
  Shipped   = 'SHIPPED',
  Delivered = 'DELIVERED',
  Cancelled = 'CANCELLED',
  Declined  = 'DECLINED',
};

export type OrderItem = {
  id: number;
  product: number;
  product_name: string;
  product_unit: string;
  quantity: number;
  price_at_time_of_order: string; // decimal
  total_price: string;
};

export type OrderRead = {
  id: number;
  status: OrderStatus;
  total_amount: string; // decimal
  created_at: string;
  supplier: number;
  supplier_name: string;
  consumer: number;
  consumer_name: string;
  items: OrderItem[],
};
