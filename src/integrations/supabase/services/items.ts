import { supabase } from '../client';
import type { Database } from '../types';

export type Item = Database['public']['Tables']['items']['Row'];
export type InsertItem = Database['public']['Tables']['items']['Insert'];
export type UpdateItem = Database['public']['Tables']['items']['Update'];

/**
 * Serviço para gerenciar itens no Supabase
 */
export const itemsService = {
  /**
   * Busca todos os itens
   */
  async getAll() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar itens:', error);
      throw error;
    }

    return data;
  },

  /**
   * Busca itens por ID do baú
   */
  async getByChestId(chestId: string) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('chest_id', chestId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Erro ao buscar itens do baú ${chestId}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Busca um item pelo ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Erro ao buscar item ${id}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Cria um novo item
   */
  async create(item: InsertItem) {
    const { data, error } = await supabase
      .from('items')
      .insert(item)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar item:', error);
      throw error;
    }

    return data;
  },

  /**
   * Atualiza um item existente
   */
  async update(id: string, item: UpdateItem) {
    const { data, error } = await supabase
      .from('items')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar item ${id}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Remove um item
   */
  async remove(id: string) {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao remover item ${id}:`, error);
      throw error;
    }

    return true;
  }
};