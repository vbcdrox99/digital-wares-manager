import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseSupabaseQueryOptions {
  timeout?: number;
  onError?: (error: Error) => void;
}

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook personalizado para gerenciar consultas do Supabase com timeout
 * e tratamento de erros padronizado
 */
export function useSupabaseQuery<T>(options: UseSupabaseQueryOptions = {}) {
  const { timeout = 15000, onError } = options;
  const { toast } = useToast();
  
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (
    queryFn: () => Promise<T>,
    errorMessage: string = 'Erro na consulta'
  ): Promise<T | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Implementar timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout: ${errorMessage}`)), timeout);
      });

      const result = await Promise.race([queryFn(), timeoutPromise]);
      
      setState(prev => ({ ...prev, data: result, loading: false }));
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Erro desconhecido');
      
      setState(prev => ({ ...prev, error: errorObj, loading: false }));
      
      // Mostrar toast de erro
      toast({
        title: errorMessage,
        description: errorObj.message,
        variant: 'destructive'
      });
      
      // Callback personalizado de erro
      if (onError) {
        onError(errorObj);
      }
      
      console.error(`❌ ${errorMessage}:`, errorObj);
      return null;
    }
  }, [timeout, toast, onError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

export default useSupabaseQuery;