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

// URL padrão do webhook; pode ser sobrescrita via variável de ambiente
const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_WEBHOOK_URL ??
  "https://auto-n8n.brnfyg.easypanel.host/webhook/6ee109b8-8f6c-4530-a360-a62b18887422"

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

    const result = await response.json()
    
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



 