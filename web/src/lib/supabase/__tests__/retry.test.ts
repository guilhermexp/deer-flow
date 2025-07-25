/**
 * Testes para o mecanismo de retry
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry } from '../retry';

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve retornar resultado em sucesso imediato', async () => {
    const operation = vi.fn().mockResolvedValue({ data: 'success' });
    
    const result = await withRetry(operation);
    
    expect(result).toEqual({ data: 'success' });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('deve tentar novamente após falha temporária', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({ data: 'success' });
    
    const promise = withRetry(operation);
    
    // Primeira tentativa falha
    await vi.advanceTimersByTimeAsync(0);
    expect(operation).toHaveBeenCalledTimes(1);
    
    // Aguardar retry (1000ms base delay)
    await vi.advanceTimersByTimeAsync(1000);
    expect(operation).toHaveBeenCalledTimes(2);
    
    const result = await promise;
    expect(result).toEqual({ data: 'success' });
  });

  it('deve usar exponential backoff', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValue({ data: 'success' });
    
    const promise = withRetry(operation);
    
    // Primeira tentativa
    await vi.advanceTimersByTimeAsync(0);
    expect(operation).toHaveBeenCalledTimes(1);
    
    // Primeira retry (1000ms)
    await vi.advanceTimersByTimeAsync(1000);
    expect(operation).toHaveBeenCalledTimes(2);
    
    // Segunda retry (2000ms - exponential)
    await vi.advanceTimersByTimeAsync(2000);
    expect(operation).toHaveBeenCalledTimes(3);
    
    const result = await promise;
    expect(result).toEqual({ data: 'success' });
  });

  it('deve respeitar maxRetries', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Persistent error'));
    
    const promise = withRetry(operation, { maxRetries: 2 });
    
    // Primeira tentativa
    await vi.advanceTimersByTimeAsync(0);
    
    // Primeira retry
    await vi.advanceTimersByTimeAsync(1000);
    
    // Segunda retry
    await vi.advanceTimersByTimeAsync(2000);
    
    // Não deve haver terceira retry
    await vi.advanceTimersByTimeAsync(4000);
    
    await expect(promise).rejects.toThrow('Persistent error');
    expect(operation).toHaveBeenCalledTimes(3); // 1 inicial + 2 retries
  });

  it('deve aplicar jitter para evitar thundering herd', async () => {
    // Mock Math.random para controlar jitter
    const originalRandom = Math.random;
    Math.random = vi.fn().mockReturnValue(0.5);
    
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValue({ data: 'success' });
    
    const promise = withRetry(operation, { 
      baseDelay: 1000,
      maxJitter: 200 
    });
    
    await vi.advanceTimersByTimeAsync(0);
    expect(operation).toHaveBeenCalledTimes(1);
    
    // Com jitter de 0.5 * 200 = 100ms, delay total = 1000 + 100 = 1100ms
    await vi.advanceTimersByTimeAsync(1100);
    expect(operation).toHaveBeenCalledTimes(2);
    
    await promise;
    
    Math.random = originalRandom;
  });

  it('deve respeitar maxDelay', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockRejectedValueOnce(new Error('Error 3'))
      .mockResolvedValue({ data: 'success' });
    
    const promise = withRetry(operation, { 
      baseDelay: 1000,
      maxDelay: 2500 
    });
    
    // Primeira tentativa
    await vi.advanceTimersByTimeAsync(0);
    
    // Primeira retry (1000ms)
    await vi.advanceTimersByTimeAsync(1000);
    
    // Segunda retry (2000ms)
    await vi.advanceTimersByTimeAsync(2000);
    
    // Terceira retry (deveria ser 4000ms mas limitado a 2500ms)
    await vi.advanceTimersByTimeAsync(2500);
    
    await promise;
    expect(operation).toHaveBeenCalledTimes(4);
  });

  it('deve executar onRetry callback', async () => {
    const onRetry = vi.fn();
    const error = new Error('Test error');
    const operation = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue({ data: 'success' });
    
    const promise = withRetry(operation, { onRetry });
    
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);
    
    await promise;
    
    expect(onRetry).toHaveBeenCalledWith(error, 1);
  });

  it('deve parar retry se shouldRetry retornar false', async () => {
    const error = new Error('Do not retry');
    const operation = vi.fn().mockRejectedValue(error);
    const shouldRetry = vi.fn().mockReturnValue(false);
    
    const promise = withRetry(operation, { shouldRetry });
    
    await vi.advanceTimersByTimeAsync(0);
    
    await expect(promise).rejects.toThrow('Do not retry');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledWith(error);
  });

  it('deve aplicar configurações customizadas', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValue({ data: 'success' });
    
    const promise = withRetry(operation, {
      maxRetries: 5,
      baseDelay: 500,
      maxDelay: 10000,
      maxJitter: 100
    });
    
    await vi.advanceTimersByTimeAsync(0);
    
    // Aguardar delay customizado (500ms + jitter)
    await vi.advanceTimersByTimeAsync(600);
    
    const result = await promise;
    expect(result).toEqual({ data: 'success' });
    expect(operation).toHaveBeenCalledTimes(2);
  });
});