import { type NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8005';
const PROXY_DEBUG = /^(true|1)$/i.test(
  process.env.PROXY_DEBUG ?? process.env.DEBUG ?? ''
);
const MAX_RETRIES = Math.max(
  0,
  Number.parseInt(process.env.PROXY_RETRY_COUNT ?? '2', 10) || 0
);
const RETRY_DELAY_MS = Math.max(
  50,
  Number.parseInt(process.env.PROXY_RETRY_DELAY_MS ?? '150', 10) || 150
);

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade'
]);

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

type ParamsContext = { params: Promise<{ path: string[] }> };

const debugLog = (...args: unknown[]) => {
  if (PROXY_DEBUG) {
    console.debug('[Proxy]', ...args);
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isBodylessMethod = (method: string) => method === 'GET' || method === 'HEAD';

function buildForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lowerKey)) {
      headers.append(key, value);
    }
  });

  const hostHeader = request.headers.get('host');
  if (hostHeader) {
    headers.set('x-forwarded-host', hostHeader);
  }

  const protocol = request.nextUrl.protocol.replace(/:$/, '');
  headers.set('x-forwarded-proto', protocol);

  const incomingForwardedFor = request.headers.get('x-forwarded-for');
  const remoteAddress = request.headers.get('x-real-ip')
    ?? request.headers.get('cf-connecting-ip')
    ?? undefined;
  const forwardedFor = [incomingForwardedFor, remoteAddress]
    .filter((value) => value && value.length > 0)
    .join(', ');
  if (forwardedFor) {
    headers.set('x-forwarded-for', forwardedFor);
  }

  return headers;
}

function createResponseHeaders(response: Response): Headers {
  const headers = new Headers();

  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lowerKey)) {
      return;
    }

    if (lowerKey === 'set-cookie') {
      headers.append(key, value);
    } else {
      headers.set(key, value);
    }
  });

  return headers;
}

function shouldRetryResponse(response: Response): boolean {
  return RETRYABLE_STATUSES.has(response.status);
}

async function fetchWithRetry(
  url: string,
  initFactory: () => RequestInit,
  maxRetries: number
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const init = initFactory();
    try {
      const response = await fetch(url, init);

      if (!shouldRetryResponse(response) || attempt === maxRetries) {
        return response;
      }

      response.body?.cancel?.();
      debugLog(
        `Retrying request due to backend status ${response.status} (${response.statusText}). Attempt ${
          attempt + 1
        }/${maxRetries}`
      );
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        break;
      }
      debugLog(`Retrying request due to network error. Attempt ${attempt + 1}/${maxRetries}`, error);
    }

    const delayMs = RETRY_DELAY_MS * 2 ** attempt;
    await sleep(delayMs);
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Proxy request failed after retries');
}

async function handler(request: NextRequest, { params }: ParamsContext) {
  let pathSegments: string[] = [];

  try {
    const resolvedParams = await params;
    pathSegments = resolvedParams.path ?? [];

    const backendPath = `/api/${pathSegments.join('/')}`;
    const backendUrl = `${BACKEND_URL}${backendPath}`;

    const searchParams = request.nextUrl.searchParams.toString();
    const urlWithParams = searchParams ? `${backendUrl}?${searchParams}` : backendUrl;

    debugLog(`${request.method} ${urlWithParams}`);

    const forwardHeaders = buildForwardHeaders(request);
    const headerEntries = Array.from(forwardHeaders.entries());

    let requestBodyBuffer: ArrayBuffer | undefined;
    if (!isBodylessMethod(request.method)) {
      requestBodyBuffer = await request.arrayBuffer();
      debugLog('Forwarding request body (%d bytes)', requestBodyBuffer.byteLength);
    }

    const response = await fetchWithRetry(
      urlWithParams,
      () => ({
        method: request.method,
        headers: new Headers(headerEntries),
        body: requestBodyBuffer ? requestBodyBuffer.slice(0) : undefined,
      }),
      MAX_RETRIES
    );

    debugLog(`Backend responded with ${response.status} ${response.statusText}`);

    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      debugLog('Handling SSE stream response');

      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      });

      const sseHeaders = createResponseHeaders(response);
      if (!sseHeaders.has('content-type')) {
        sseHeaders.set('content-type', 'text/event-stream');
      }
      if (!sseHeaders.has('cache-control')) {
        sseHeaders.set('cache-control', 'no-cache');
      }
      if (!sseHeaders.has('connection')) {
        sseHeaders.set('connection', 'keep-alive');
      }

      return new Response(stream, {
        status: response.status,
        statusText: response.statusText,
        headers: sseHeaders,
      });
    }

    const responseHeaders = createResponseHeaders(response);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Proxy] Failed to forward request', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    const responseBody = {
      error: 'Failed to proxy request',
      message,
      backend: BACKEND_URL,
      path: pathSegments,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request: NextRequest, context: ParamsContext) {
  return handler(request, context);
}

export async function POST(request: NextRequest, context: ParamsContext) {
  return handler(request, context);
}

export async function PUT(request: NextRequest, context: ParamsContext) {
  return handler(request, context);
}

export async function DELETE(request: NextRequest, context: ParamsContext) {
  return handler(request, context);
}

export async function OPTIONS(request: NextRequest, context: ParamsContext) {
  return handler(request, context);
}