/**
 * Cliente HTTP genérico para chamadas à API REST
 */

import { auth } from '@clerk/nextjs/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005/api';

interface HttpClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  auth?: boolean; // Requer autenticação Clerk
}

class HttpClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    // Em ambiente de desenvolvimento, permitir requisições sem autenticação
    if (process.env.NODE_ENV === 'development') {
      return {};
    }

    const { getToken } = auth();
    const token = await getToken();

    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }

    return {};
  } catch (error) {
    console.error('Erro ao obter token de autenticação:', error);
    return {};
  }
}

export async function httpClient<T = any>(
  endpoint: string,
  options: HttpClientOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    headers: customHeaders = {},
    body,
    auth: requiresAuth = true
  } = options;

  // Construir headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  // Adicionar headers de autenticação se necessário
  if (requiresAuth) {
    const authHeaders = await getAuthHeaders();
    Object.assign(headers, authHeaders);
  }

  // Construir URL completo
  const url = `${API_URL}${endpoint}`;

  // Construir opções do fetch
  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  // Adicionar body se presente
  if (body !== undefined) {
    if (body instanceof FormData) {
      // Para FormData, remover Content-Type para deixar o browser definir
      delete headers['Content-Type'];
      fetchOptions.body = body;
    } else {
      fetchOptions.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Se não houver conteúdo (204), retornar null
    if (response.status === 204) {
      return null as T;
    }

    // Tentar parsear resposta como JSON
    let data: any;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Se a resposta não for OK, lançar erro
    if (!response.ok) {
      throw new HttpClientError(
        data?.detail || data?.message || 'Erro na requisição',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof HttpClientError) {
      throw error;
    }

    // Erro de rede ou outro erro
    throw new HttpClientError(
      error instanceof Error ? error.message : 'Erro de conexão',
      0,
      error
    );
  }
}

// Métodos de conveniência
export const api = {
  get: <T = any>(endpoint: string, options?: Omit<HttpClientOptions, 'method' | 'body'>) =>
    httpClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: Omit<HttpClientOptions, 'method' | 'body'>) =>
    httpClient<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = any>(endpoint: string, body?: any, options?: Omit<HttpClientOptions, 'method' | 'body'>) =>
    httpClient<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = any>(endpoint: string, body?: any, options?: Omit<HttpClientOptions, 'method' | 'body'>) =>
    httpClient<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = any>(endpoint: string, options?: Omit<HttpClientOptions, 'method' | 'body'>) =>
    httpClient<T>(endpoint, { ...options, method: 'DELETE' }),
};

export { HttpClientError };
