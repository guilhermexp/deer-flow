export interface WebhookData {
  type: string
  url?: string
  file?: File
  text?: string
  username?: string
  limitPages?: boolean
  sessionId?: string
  sessionData?: {
    sessionId: string
    
    createdAt: string
    lastActivity: string
    messageCount: number
    conversation: Array<{
      id: number
      type: "assistant" | "user"
      content: string
      timestamp: string
    }>
  }
}

export interface WebhookResponse {
  success: boolean
  summary?: string
  transcript?: string
  title?: string
  thumbnail?: string
  error?: string
  resumo?: string
  transcricao?: string
  titulo?: string
  response?: string
}

export interface WebhookRequest {
  message: string
  sessionId?: string
  metadata?: Record<string, unknown>
}

// URL do proxy local para evitar problemas de CORS
const WEBHOOK_URL = '/api/webhook-proxy'

export async function sendToWebhook(data: WebhookData): Promise<WebhookResponse> {
  try {
    const formData = new FormData()
    
    // Adiciona o tipo de conteúdo
    formData.append('type', data.type)
    
    // Adiciona dados específicos baseados no tipo
    if (data.url) {
      formData.append('url', data.url)
    }
    
    if (data.file) {
      formData.append('file', data.file)
    }
    
    if (data.text) {
      formData.append('text', data.text)
    }
    
    if (data.username) {
      formData.append('username', data.username)
    }
    
    if (data.limitPages !== undefined) {
      formData.append('limitPages', data.limitPages.toString())
    }

    if (data.sessionId) {
      formData.append('sessionId', data.sessionId)
    }

    if (data.sessionData) {
      formData.append('sessionData', JSON.stringify(data.sessionData))
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Check if response has content
    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')
    
    // Check if response is empty or not JSON
    if (!contentType || !contentType.includes('application/json') || contentLength === '0') {
      console.log('⚠️ Webhook returned non-JSON or empty response')
      return {
        success: true,
        summary: 'Webhook executado com sucesso',
        transcript: '',
        title: 'Resposta do webhook'
      }
    }

    let result
    try {
      const text = await response.text()
      if (!text || text.trim() === '') {
        console.log('⚠️ Webhook returned empty response body')
        return {
          success: true,
          summary: 'Webhook executado com sucesso',
          transcript: '',
          title: 'Resposta do webhook'
        }
      }
      result = JSON.parse(text)
    } catch (parseError) {
      console.error('❌ Error parsing webhook response:', parseError)
      console.log('Response text:', await response.text())
      return {
        success: false,
        error: 'Resposta inválida do webhook'
      }
    }
    
    // Log da resposta completa para debug
    console.log('🔄 Resposta completa do webhook:', result)
    console.log('🔍 Tipo de resposta:', typeof result)
    console.log('🔍 É array?', Array.isArray(result))
    console.log('🔍 Chaves disponíveis:', Object.keys(result))
    
    // Se for array, pegar o primeiro elemento
    const responseData = Array.isArray(result) ? result[0] : result
    console.log('📦 Dados processados:', responseData)
    
    const webhookResponse = {
      success: true,
      summary: responseData.summary ?? responseData.resumo ?? responseData.Resumo ?? responseData.Summary ?? responseData.output ?? responseData.texto ?? responseData.content,
      transcript: responseData.transcript ?? responseData.transcricao ?? responseData.Transcricao ?? responseData.Transcript ?? responseData.transcription,
      title: responseData.title ?? responseData.titulo ?? responseData.Titulo ?? responseData.Title ?? responseData.name ?? responseData.nome,
      thumbnail: responseData.thumbnail ?? responseData.thumb ?? responseData.image ?? responseData.imagem,
      resumo: responseData.resumo ?? responseData.summary ?? responseData.output,
      transcricao: responseData.transcricao ?? responseData.transcript,
      titulo: responseData.titulo ?? responseData.title
    }
    
    console.log('✅ Response final:', webhookResponse)
    return webhookResponse
  } catch (error) {
    console.error('Erro ao enviar para webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}



 