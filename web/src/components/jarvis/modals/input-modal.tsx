"use client"

import React from "react"
import { useState, useCallback } from "react"
import { ArrowLeft, X, Loader } from "lucide-react"
import { Button } from "~/components/ui/button"
import { sendToWebhook, type WebhookData, type WebhookResponse } from "~/lib/webhook-service"
import { WebhookStatus } from "~/components/jarvis/modals/webhook-status"
import { UrlInput, TwitterInput } from "~/components/jarvis/modals/input-types/url-input"
import { TextInput } from "~/components/jarvis/modals/input-types/text-input"
import { ImageInput } from "~/components/jarvis/modals/input-types/image-input"
import { VoiceInput } from "~/components/jarvis/modals/input-types/voice-input"
import {
  validateTwitterInput,
  validateUrlInput,
  validateFileInput,
  validateTextInput,
  isSubmitDisabled,
} from "~/lib/input-modal-utils"

interface InputModalProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  title: string
  type: string
  onSave: (data: WebhookResponse, originalData: WebhookData) => void
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

export const InputModal = React.memo(({ isOpen, onClose, onBack, title, type, onSave, sessionId, sessionData }: InputModalProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [limitPages, setLimitPages] = useState(false)
  const [twitterUsername, setTwitterUsername] = useState("")
  const [twitterUrl, setTwitterUrl] = useState("")
  const [textInput, setTextInput] = useState("")
  const [processStatus, setProcessStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState("")

  const resetState = useCallback(() => {
    setInputValue("")
    setFile(null)
    setLimitPages(false)
    setTwitterUsername("")
    setTwitterUrl("")
    setTextInput("")
    setIsLoading(false)
    setProcessStatus('idle')
    setErrorMessage("")
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [onClose, resetState])

  const handleBack = useCallback(() => {
    resetState()
    onBack()
  }, [onBack, resetState])

  const handleSubmit = async () => {
    // Basic validation
    const baseData: WebhookData = { 
      type,
      ...(sessionId && { sessionId }),
      ...(sessionData ? { sessionData } : {})
    }

    let validationResult = { isValid: false, webhookData: baseData }

    switch (type) {
      case "twitter":
        validationResult = validateTwitterInput(twitterUsername, twitterUrl, baseData)
        break
      case "youtube":
      case "tiktok":
      case "instagram":
      case "website":
      case "loom":
      case "article":
        validationResult = validateUrlInput(inputValue, type, limitPages, baseData)
        break
      case "pdf":
      case "txt":
      case "markdown":
      case "audio":
        validationResult = validateFileInput(file, baseData)
        break
      case "text":
        validationResult = validateTextInput(textInput, baseData)
        break
    }

    if (!validationResult.isValid) {
      alert("Por favor, preencha os campos necessários ou selecione um arquivo.")
      return
    }

    setIsLoading(true)
    setProcessStatus('processing')
    setErrorMessage("")

    try {
      const response = await sendToWebhook(validationResult.webhookData)
      
      if (response.success) {
        setProcessStatus('success')
        setTimeout(() => {
          onSave(response, validationResult.webhookData)
          handleClose()
        }, 2000) // Mostra sucesso por 2 segundos antes de fechar
      } else {
        setProcessStatus('error')
        setErrorMessage(response.error || 'Erro ao processar conteúdo')
      }
    } catch (error) {
      setProcessStatus('error')
      setErrorMessage('Erro de conexão com o servidor')
      console.error('Erro ao processar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = useCallback(() => {
    setProcessStatus('idle')
    setErrorMessage("")
  }, [])

  if (!isOpen) return null

  const renderContent = () => {
    if (type === "twitter") {
      return (
        <TwitterInput
          username={twitterUsername}
          url={twitterUrl}
          onUsernameChange={setTwitterUsername}
          onUrlChange={setTwitterUrl}
        />
      )
    }

    if (["youtube", "tiktok", "instagram", "website", "loom", "article"].includes(type)) {
      return (
        <UrlInput
          type={type}
          inputValue={inputValue}
          onChange={setInputValue}
          limitPages={limitPages}
          onLimitPagesChange={type === "website" ? setLimitPages : undefined}
        />
      )
    }

    if (["pdf", "txt", "markdown"].includes(type)) {
      return (
        <ImageInput
          type={type}
          file={file}
          onChange={setFile}
          onFileNameChange={setInputValue}
        />
      )
    }

    if (type === "audio") {
      return (
        <VoiceInput
          file={file}
          onChange={setFile}
          onFileNameChange={setInputValue}
        />
      )
    }

    if (type === "text") {
      return <TextInput value={textInput} onChange={setTextInput} />
    }

    return <p className="text-gray-400">Tipo de conteúdo não suportado: {type}</p>
  }

  // Determine if submit button should be disabled
  const submitDisabled = isSubmitDisabled(type, isLoading, processStatus, {
    twitterUsername,
    inputValue,
    file,
    textInput,
  })

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[55]">
        <div className="bg-white/[0.05] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg relative shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-gray-400 hover:text-gray-100"
              disabled={isLoading}
            >
              <ArrowLeft size={20} className="mr-2" />
              Voltar
            </Button>
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-100"
              aria-label="Close modal"
              disabled={isLoading}
            >
              <X size={24} />
            </Button>
          </div>

          <div className="min-h-[150px]">
            {renderContent()}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitDisabled}
            className="mt-6 sm:mt-8 w-full text-base"
            size="lg"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : null}
            {isLoading ? "Processando..." : "Processar Conteúdo"}
          </Button>
          
          {processStatus === 'error' && (
            <p className="text-sm text-red-500 text-center mt-3">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
      <WebhookStatus
        processStatus={processStatus}
        errorMessage={errorMessage}
        type={type}
        title={title}
        onRetry={handleRetry}
      />
    </>
  )
})

InputModal.displayName = "InputModal"
