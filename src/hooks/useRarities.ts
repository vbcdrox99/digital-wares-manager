import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RarityDefinition {
  id: string;
  name: string;
  color: string;
}

export const useRarities = () => {
  const [rarities, setRarities] = useState<RarityDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRarities();
  }, []);

  const fetchRarities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rarities')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setRarities(data || []);
    } catch (error) {
      console.error('Error fetching rarities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarityName: string) => {
    const rarity = rarities.find(r => r.name.toLowerCase() === rarityName?.toLowerCase());
    return rarity ? rarity.color : '#808080'; // Default gray if not found
  };

  return { rarities, loading, getRarityColor, refreshRarities: fetchRarities };
};
