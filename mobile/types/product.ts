export type ProductInfo = {
  id: number;
  supplier: number;
  supplier_name: string;
  name: string;
  description: string;
  price: string; // decimal
  unit: string;
  stock_level: number;
  is_available: boolean;
  image: string | null;
};

export type OrderProduct = {
  product: ProductInfo;
  amount: number | null;
  setAmount: (n: number | null) => void;
};
