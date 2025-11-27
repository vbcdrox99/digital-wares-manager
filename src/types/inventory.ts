export type Rarity = 'comum' | 'persona' | 'arcana' | 'immortal';

export interface Item {
  id: string;
  name: string | null;
  hero_name: string;
  rarity: Rarity;
  price: number;
  initial_stock: number;
  current_stock: number;
  chest_id: string;
  image_url?: string | null;
  highlighted?: boolean | null;
  created_at?: string | null;
  // Novos campos para fluxo de parceiros
  is_partner?: boolean;
  seller_id?: string | null;
  approved?: boolean; // aprovado pelo admin para aparecer no catálogo
}

export interface Chest {
  id: string;
  name: string;
  created_at: string | null;
}

export type OrderType = 'sale' | 'giveaway';
export type OrderStatus = 'pending' | 'sent' | 'cancelled';

export interface CartItem {
  item_id: string;
  quantity: number;
  name: string;
  hero_name: string;
  rarity: Rarity;
  price: number;
  chestName: string;
}

export interface Order {
  id: string;
  customer_name: string;
  steam_id: string;
  order_type: OrderType;
  items: CartItem[];
  status: OrderStatus;
  created_at: string | null;
  sent_at?: string | null;
  total_value: number;
  deadline?: string | null;
  customer_id?: string | null;
}

export interface ShippingItem {
  orderId: string;
  customerName: string;
  items: CartItem[];
  deadline: string;
  status: 'awaiting' | 'overdue';
  createdAt: string;
}