import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8005';

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params as required by Next.js 15
    const { path } = await params;
    
    // Construct the backend path
    const backendPath = `/api/${path.join('/')}`;
    const backendUrl = `${BACKEND_URL}${backendPath}`;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams.toString();
    const urlWithParams = searchParams ? `${backendUrl}?${searchParams}` : backendUrl;
    
    console.log(`[Proxy] Forwarding ${request.method} request to: ${urlWithParams}`);
    
    // Prepare headers for the backend request
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // Skip host and Next.js specific headers
      if (!['host', 'x-forwarded-host', 'x-forwarded-proto'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method: request.method,
      headers,
    };
    
    // Add body for non-GET requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text();
      requestOptions.body = body;
      console.log(`[Proxy] Request body:`, body);
    }
    
    console.log(`[Proxy] Request headers:`, Object.fromEntries(headers.entries()));
    
    // Forward the request to the backend
    const response = await fetch(urlWithParams, requestOptions);
    
    console.log(`[Proxy] Backend response status: ${response.status} ${response.statusText}`);
    
    // Handle SSE (Server-Sent Events) streams
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      console.log(`[Proxy] Handling SSE stream`);
      
      // Create a TransformStream to handle the SSE data
      const encoder = new TextEncoder();
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
            console.error('[Proxy] SSE stream error:', error);
            controller.error(error);
          } finally {
            controller.close();
          }
        }
      });
      
      // Return SSE response with appropriate headers
      return new Response(stream, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // For non-SSE responses
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Skip some headers that should not be forwarded
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    
    // Return the response
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Proxy] Error details:', error);
    console.error('[Proxy] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to proxy request', 
        details: error instanceof Error ? error.message : 'Unknown error',
        backend: BACKEND_URL,
        path: path.join('/')
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(request, context);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handler(request, context);
}