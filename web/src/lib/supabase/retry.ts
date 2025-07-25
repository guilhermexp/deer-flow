/**
 * Utility para retry automático em operações do Supabase
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  shouldRetry: (error: any) => {
    // Retry em erros de rede, timeout ou rate limit
    if (!error) return false;
    
    const retryableCodes = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'EAI_AGAIN',
      '429', // Rate limit
      '503', // Service unavailable
      '504', // Gateway timeout
    ];
    
    const errorCode = error.code || error.status?.toString();
    return retryableCodes.some(code => errorCode?.includes(code));
  }
};

/**
 * Executa uma operação com retry automático
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Se não deve tentar novamente ou já fez todas as tentativas
      if (!opts.shouldRetry(error) || attempt === opts.maxRetries) {
        throw error;
      }
      
      console.warn(`Tentativa ${attempt + 1} falhou. Tentando novamente em ${delay}ms...`, error);
      
      // Aguarda antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Aumenta o delay para a próxima tentativa (exponential backoff)
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
    }
  }
  
  throw lastError;
}

/**
 * HOF para adicionar retry a uma função async
 */
export function withRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: RetryOptions
): T {
  return (async (...args: Parameters<T>) => {
    return withRetry(() => fn(...args), options);
  }) as T;
}

/**
 * Hook para operações com retry e estado de carregamento
 */
export function useRetryOperation<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const executeWithRetry = useCallback(async () => {
    setIsRetrying(true);
    setRetryCount(0);
    
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: any;
    let delay = opts.initialDelay;
    
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        const result = await operation();
        setIsRetrying(false);
        return result;
      } catch (error) {
        lastError = error;
        setRetryCount(attempt + 1);
        
        if (!opts.shouldRetry(error) || attempt === opts.maxRetries) {
          setIsRetrying(false);
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
      }
    }
    
    setIsRetrying(false);
    throw lastError;
  }, [operation, options]);
  
  return {
    execute: executeWithRetry,
    isRetrying,
    retryCount
  };
}

// Re-export para facilitar importação
import { useState, useCallback } from 'react';