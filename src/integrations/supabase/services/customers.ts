import { supabase } from '../client';
import type { Database } from '../types';

export type Customer = Database['public']['Tables']['customers']['Row'];
export type InsertCustomer = Database['public']['Tables']['customers']['Insert'];
export type UpdateCustomer = Database['public']['Tables']['customers']['Update'];

/**
 * Serviço para gerenciar clientes no Supabase
 */
export const customersService = {
  /**
   * Busca todos os clientes
   */
  async getAll() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }

    return data;
  },

  /**
   * Busca clientes por nome ou Steam ID (para autocomplete)
   */
  async searchByNameOrSteamId(searchTerm: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,steam_id.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }

    return data;
  },

  /**
   * Busca um cliente pelo ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Erro ao buscar cliente ${id}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Busca um cliente pelo Steam ID
   */
  async getBySteamId(steamId: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('steam_id', steamId)
      .single();

    if (error) {
      console.error(`Erro ao buscar cliente com Steam ID ${steamId}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Cria um novo cliente
   */
  async create(customer: InsertCustomer) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }

    return data;
  },

  /**
   * Atualiza um cliente existente
   */
  async update(id: string, customer: UpdateCustomer) {
    const { data, error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar cliente ${id}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Remove um cliente
   */
  async remove(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao remover cliente ${id}:`, error);
      throw error;
    }

    return true;
  },

  /**
   * Busca pedidos de um cliente específico
   */
  async getCustomerOrders(customerId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          items (
            id,
            name,
            hero_name,
            rarity,
            price,
            chest_id,
            chests (
              name
            )
          )
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Erro ao buscar pedidos do cliente ${customerId}:`, error);
      throw error;
    }

    return data;
  }
};