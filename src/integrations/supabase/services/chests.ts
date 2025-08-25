import { supabase } from '../client';
import type { Database } from '../types';

export type Chest = Database['public']['Tables']['chests']['Row'];
export type InsertChest = Database['public']['Tables']['chests']['Insert'];
export type UpdateChest = Database['public']['Tables']['chests']['Update'];

/**
 * Serviço para gerenciar baús no Supabase
 */
export const chestsService = {
  /**
   * Busca todos os baús
   */
  async getAll() {
    const { data, error } = await supabase
      .from('chests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar baús:', error);
      throw error;
    }

    return data;
  },

  /**
   * Busca um baú pelo ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('chests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Erro ao buscar baú ${id}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Cria um novo baú
   */
  async create(chest: InsertChest) {
    const { data, error } = await supabase
      .from('chests')
      .insert(chest)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar baú:', error);
      throw error;
    }

    return data;
  },

  /**
   * Atualiza um baú existente
   */
  async update(id: string, chest: UpdateChest) {
    const { data, error } = await supabase
      .from('chests')
      .update(chest)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar baú ${id}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Remove um baú
   */
  async remove(id: string) {
    const { error } = await supabase
      .from('chests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao remover baú ${id}:`, error);
      throw error;
    }

    return true;
  }
};