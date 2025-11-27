import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Item } from '@/types/inventory';

export const useItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('items')
        .select('*')
        .eq('approved', true) // Apenas itens aprovados pelo admin
        .gt('current_stock', 0) // Apenas itens em estoque
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar itens');
      console.error('Erro ao buscar itens:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFeaturedItems = (limit: number = 6) => {
    return items.slice(0, limit);
  };

  const getItemsByRarity = (rarity: Item['rarity']) => {
    return items.filter(item => item.rarity === rarity);
  };

  const getPromotionalItems = (limit: number = 4) => {
    // Retorna itens com preço menor que 50 como "promoção"
    return items
      .filter(item => parseFloat(item.price.toString()) < 50)
      .slice(0, limit);
  };

  const getNewItems = (limit: number = 4) => {
    // Retorna os itens mais recentes
    return items
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    getFeaturedItems,
    getItemsByRarity,
    getPromotionalItems,
    getNewItems
  };
};