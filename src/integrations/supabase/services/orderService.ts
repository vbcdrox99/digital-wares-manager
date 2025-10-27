import { supabase } from '../client';
import type { Database } from '../types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

export interface CreateOrderData {
  customer_id?: string; // ID do cliente (opcional para compatibilidade)
  customer_name: string;
  steam_id: string;
  order_type: 'sale' | 'giveaway';
  items: {
    item_id: string;
    quantity: number;
    price: number;
  }[];
  delivery_days?: number; // Para adicionar tempo ao pedido
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    items: {
      id: string;
      hero_name: string;
      rarity: string;
      price: number;
      chest_id: string;
      chests: {
        name: string;
      };
    };
  })[];
  shipping_queue: {
    deadline: string;
  }[] | null;
}

// Criar um novo pedido
export async function createOrder(orderData: CreateOrderData) {
  try {
    // Calcular valor total
    const total_value = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calcular deadline se especificado
    let deadline = null;
    if (orderData.delivery_days) {
      deadline = new Date();
      deadline.setDate(deadline.getDate() + orderData.delivery_days);
    }

    // Preparar dados do pedido
    const orderInsertData: any = {
      customer_name: orderData.customer_name,
      steam_id: orderData.steam_id,
      order_type: orderData.order_type,
      total_value
    };

    // Adicionar customer_id se fornecido
    if (orderData.customer_id) {
      orderInsertData.customer_id = orderData.customer_id;
    }

    // Criar o pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) throw orderError;

    // Criar os itens do pedido
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      item_id: item.item_id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Criar registro na shipping_queue se deadline foi especificado
    if (deadline) {
      const { error: shippingError } = await supabase
        .from('shipping_queue')
        .insert({
          order_id: order.id,
          deadline: deadline.toISOString()
        });

      if (shippingError) throw shippingError;
    }

    return { success: true, order };
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return { success: false, error };
  }
}

// Interface para parâmetros de paginação
export interface OrdersPaginationParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'sent' | 'cancelled';
  orderType?: 'sale' | 'giveaway';
}

// Interface para resposta paginada
export interface PaginatedOrdersResponse {
  data: OrderWithItems[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Listar pedidos com paginação
export async function getOrdersWithItemsPaginated(params: OrdersPaginationParams = {}): Promise<PaginatedOrdersResponse> {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      orderType
    } = params;

    const offset = (page - 1) * limit;

    // Construir query base
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          items (
            id,
            hero_name,
            rarity,
            price,
            chest_id,
            chests (
              name
            )
          )
        ),
        shipping_queue (
          deadline
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros se fornecidos
    if (status) {
      query = query.eq('status', status);
    }
    if (orderType) {
      query = query.eq('order_type', orderType);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: data as OrderWithItems[],
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  } catch (error) {
    console.error('Erro ao buscar pedidos paginados:', error);
    return {
      data: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }
}

// Listar todos os pedidos com itens (mantido para compatibilidade)
export async function getOrdersWithItems(): Promise<OrderWithItems[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          items (
            id,
            hero_name,
            rarity,
            price,
            chest_id,
            chests (
              name
            )
          )
        ),
        shipping_queue (
          deadline
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50); // Limitar a 50 registros para performance

    if (error) throw error;
    return data as OrderWithItems[];
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return [];
  }
}

// Atualizar status do pedido
export async function updateOrderStatus(orderId: string, status: 'pending' | 'sent' | 'cancelled') {
  try {
    const updateData: any = { status };
    
    // Se o status for 'sent', adicionar timestamp
    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;

    // Ao cancelar, devolver os itens ao estoque
    if (status === 'cancelled') {
      // Buscar itens do pedido
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('item_id, quantity')
        .eq('order_id', orderId);

      if (orderItemsError) throw orderItemsError;

      // Para cada item do pedido, somar a quantidade de volta ao estoque atual
      for (const oi of (orderItems || [])) {
        // Buscar estoque atual do item
        const { data: item, error: itemError } = await supabase
          .from('items')
          .select('id, current_stock, initial_stock')
          .eq('id', oi.item_id)
          .single();

        if (itemError) throw itemError;

        const currentStock = (item?.current_stock ?? item?.initial_stock ?? 0);
        const newStock = currentStock + (oi?.quantity ?? 0);

        const { error: updateItemError } = await supabase
          .from('items')
          .update({ current_stock: newStock })
          .eq('id', oi.item_id);

        if (updateItemError) throw updateItemError;
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return { success: false, error };
  }
}

// Calcular tempo restante para deadline
export function calculateTimeRemaining(deadline: string | null): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  if (!deadline) {
    return { days: 0, hours: 0, minutes: 0, isExpired: false };
  }

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, isExpired: false };
}

// Deletar pedido
export async function deleteOrder(orderId: string) {
  try {
    // Primeiro deletar os itens do pedido
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    // Depois deletar o pedido
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (orderError) throw orderError;
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    return { success: false, error };
  }
}