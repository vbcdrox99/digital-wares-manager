import { chestsService } from './chests';
import { itemsService } from './items';

/**
 * Exporta todos os serviços do Supabase
 */
export const supabaseServices = {
  chests: chestsService,
  items: itemsService,
};

// Exporta os serviços individualmente
export * from './chests';
export * from './items';