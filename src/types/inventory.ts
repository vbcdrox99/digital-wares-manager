export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'immortal' | 'mythic';

export interface Item {
  id: string;
  heroName: string;
  rarity: Rarity;
  price: number;
  initialStock: number;
  chestId: string;
}

export interface Chest {
  id: string;
  name: string;
  createdAt: string;
}

export type OrderType = 'sale' | 'giveaway';
export type OrderStatus = 'pending' | 'sent' | 'cancelled';

export interface CartItem {
  itemId: string;
  quantity: number;
  heroName: string;
  rarity: Rarity;
  price: number;
  chestName: string;
}

export interface Order {
  id: string;
  customerName: string;
  steamId: string;
  orderType: OrderType;
  items: CartItem[];
  status: OrderStatus;
  createdAt: string;
  sentAt?: string;
  totalValue: number;
}

export interface ShippingItem {
  orderId: string;
  customerName: string;
  items: CartItem[];
  deadline: string;
  status: 'awaiting' | 'overdue';
  createdAt: string;
}