/**
 * Cliente HTTP genérico para chamadas à API REST
 *
 * NOTA: Este cliente usa o proxy do Next.js em /api/[...path] que encaminha
 * requisições para o backend FastAPI. Em desenvolvimento e produção, sempre
 * use rotas relativas /api/* que serão proxy'd automaticamente.
 */

// Use relative URL to leverage Next.js API proxy at /api/[...path]
// This avoids CORS issues and works in both development and production
const API_URL = "/api";

interface HttpClientOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  token?: string; // Token de autenticação opcional
}

class HttpClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = "HttpClientError";
  }
}

export async function httpClient<T = any>(
  endpoint: string,
  options: HttpClientOptions = {}
): Promise<T> {
  const { method = "GET", headers: customHeaders = {}, body, token } = options;

  // Construir headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  // Adicionar token de autenticação se fornecido
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Construir URL completo
  const url = `${API_URL}${endpoint}`;
  console.log("🔍 HTTP Client Debug:", { API_URL, endpoint, url, method });

  // Construir opções do fetch
  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  // Adicionar body se presente
  if (body !== undefined) {
    if (body instanceof FormData) {
      // Para FormData, remover Content-Type para deixar o browser definir
      delete headers["Content-Type"];
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
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Se a resposta não for OK, lançar erro
    if (!response.ok) {
      throw new HttpClientError(
        data?.detail || data?.message || "Erro na requisição",
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
      error instanceof Error ? error.message : "Erro de conexão",
      0,
      error
    );
  }
}

// Métodos de conveniência
export const api = {
  get: <T = any>(
    endpoint: string,
    options?: Omit<HttpClientOptions, "method" | "body">
  ) => httpClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<HttpClientOptions, "method" | "body">
  ) => httpClient<T>(endpoint, { ...options, method: "POST", body }),

  put: <T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<HttpClientOptions, "method" | "body">
  ) => httpClient<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<HttpClientOptions, "method" | "body">
  ) => httpClient<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T = any>(
    endpoint: string,
    options?: Omit<HttpClientOptions, "method" | "body">
  ) => httpClient<T>(endpoint, { ...options, method: "DELETE" }),
};

export { HttpClientError };
