export interface Product {
  id: number;
  name: string;
  price: number;
  category: 'clothing' | 'electronics' | 'accessories';
  image: string;
  description: string;
  badge?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
