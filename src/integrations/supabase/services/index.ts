import { chestsService } from './chests';
import { itemsService } from './items';
import { customersService } from './customers';

/**
 * Exporta todos os serviços do Supabase
 */
export const supabaseServices = {
  chests: chestsService,
  items: itemsService,
  customers: customersService,
};

// Exporta os serviços individualmente
export * from './chests';
export * from './items';
export * from './customers';