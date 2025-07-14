"use client"

import * as React from "react"
import Image from "next/image"
import { useState, useCallback, lazy, Suspense } from "react"
import { motion } from "framer-motion"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { ScrollArea } from "~/components/ui/scroll-area"
import {
  ArrowLeft,
  Sparkles,
  Play,
  Clock,
  HardDrive,
  FileText,
  type LucideIcon,
} from "lucide-react"
import AnimatedPageWrapperOptimized from "~/components/jarvis/animated-page-wrapper-optimized"
import { cn } from "~/lib/utils"
import { formatWebhookText } from "~/lib/notes-utils"
import type { Note } from "~/app/(with-sidebar)/notes/page"
import type { ChatSession } from "~/lib/session-utils"
import type { WebhookResponse } from "~/lib/webhook-service"
import {
  createChatSession,
  addMessageToSession,
  formatSessionForWebhook,
} from "~/lib/session-utils"

// Lazy load heavy components
const AddContextModal = lazy(() => import("~/components/jarvis/modals/add-context-modal").then(mod => ({ default: mod.AddContextModal })))
const AssistantPanel = lazy(() => import("~/components/jarvis/assistant-panel").then(mod => ({ default: mod.AssistantPanel })))

interface OriginalData {
  url?: string
}

interface NotesDetailViewProps {
  selectedNote: Note
  onBack: () => void
  getSourceIcon: (source: string) => LucideIcon
  getSourceColor: (source: string) => string
  chatSessions: Record<string, ChatSession>
  onChatSessionsUpdate: (sessions: Record<string, ChatSession>) => void
  onSaveContext: (contextType: string, webhookResponse: WebhookResponse & { originalData?: OriginalData }) => void
}

export function NotesDetailView({
  selectedNote,
  onBack,
  getSourceIcon,
  getSourceColor,
  chatSessions,
  onChatSessionsUpdate,
  onSaveContext
}: NotesDetailViewProps) {
  const [activeTab, setActiveTab] = useState("resumo")
  const [chatInput, setChatInput] = useState("")
  const [isAddContextModalOpen, setIsAddContextModalOpen] = useState(false)
  const [showYoutubeIframe, setShowYoutubeIframe] = useState(false)

  // Get or create session helper
  const getOrCreateSession = (noteId: string): ChatSession => {
    return chatSessions[noteId] || createChatSession(noteId)
  }

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || !selectedNote) return
    
    // Get or create session for current note
    let currentSession = chatSessions[selectedNote.id]
    if (!currentSession) {
      currentSession = createChatSession(selectedNote.id)
      onChatSessionsUpdate({
        ...chatSessions,
        [selectedNote.id]: currentSession
      })
    }

    // Add user message
    const updatedSession = addMessageToSession(currentSession, chatInput, "user")
    onChatSessionsUpdate({
      ...chatSessions,
      [selectedNote.id]: updatedSession
    })
    
    setChatInput("")

    // Simulate assistant response
    setTimeout(() => {
      const finalSession = addMessageToSession(
        updatedSession,
        "Entendi sua pergunta. Posso ajudar você a analisar melhor suas notas ou encontrar informações específicas.",
        "assistant"
      )
      onChatSessionsUpdate({
        ...chatSessions,
        [selectedNote.id]: finalSession
      })
    }, 1000)
  }, [chatInput, selectedNote, chatSessions, onChatSessionsUpdate])

  const handleChatSessionUpdate = useCallback((noteId: string, session: any) => {
    onChatSessionsUpdate({
      ...chatSessions,
      [noteId]: session
    })
  }, [chatSessions, onChatSessionsUpdate])

  return (
    <AnimatedPageWrapperOptimized className="min-h-full">
      <div className="bg-[#0a0a0a] text-gray-100">
        <div className="flex">
          <main className="flex-1 lg:mr-[24rem]">
            <div>
              {/* Back button and Title */}
              <div className="mb-6 sm:mb-8 flex items-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onBack}
                    aria-label="Voltar para dashboard"
                    className="h-9 w-9 p-2 rounded-md flex-shrink-0 bg-white/[0.05] border-white/10 hover:bg-white/[0.08]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-semibold text-white truncate"
                >
                  {selectedNote.title}
                </motion.h1>
              </div>

              {/* Media Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8 sm:mb-12"
              >
                <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 mb-6 sm:mb-8">
                  <div className="w-full xl:w-2/3 flex-shrink-0">
                    <motion.figure
                      id={`youtube-${selectedNote.id}`}
                      whileHover={{ scale: 1.005 }}
                      className="aspect-video bg-white/[0.05] relative overflow-hidden rounded-lg shadow-lg border border-white/10"
                    >
                      {selectedNote.source === "YouTube" && selectedNote.youtubeId ? (
                        <div className="relative w-full h-full">
                          {showYoutubeIframe ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${selectedNote.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                              title={selectedNote.title}
                              className="w-full h-full rounded-lg"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
                            ></iframe>
                          ) : (
                            <div
                              className="w-full h-full bg-cover bg-center rounded-lg"
                              style={{
                                backgroundImage: selectedNote.mediaUrl ? `url(${selectedNote.mediaUrl})` : undefined,
                              }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  className="bg-blue-500/20 rounded-full p-3 sm:p-4 backdrop-blur-sm shadow-lg cursor-pointer border border-blue-500/50 hover:bg-blue-500/30"
                                  onClick={() => setShowYoutubeIframe(true)}
                                >
                                  <Play className="h-6 w-6 sm:h-8 text-white fill-white" />
                                </motion.div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : selectedNote.mediaType === "file" ? (
                        <div className="flex items-center justify-center h-full">
                          <FileText className="h-20 w-20 text-gray-400" />
                        </div>
                      ) : (
                        <>
                          {selectedNote.mediaUrl ? (
                            <Image
                              src={selectedNote.mediaUrl}
                              alt={selectedNote.title}
                              fill
                              className="object-cover rounded-lg"
                              priority
                              sizes="(min-width: 1280px) 66vw, 100vw"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/[0.05] flex items-center justify-center">
                              <span className="text-gray-400">{selectedNote.title}</span>
                            </div>
                          )}
                          {selectedNote.mediaType === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="bg-black/50 rounded-full p-3 sm:p-4 backdrop-blur-sm"
                              >
                                <Play className="h-6 w-6 sm:h-8 text-white fill-white" />
                              </motion.div>
                            </div>
                          )}
                        </>
                      )}
                    </motion.figure>
                  </div>

                  {/* Note Info Section */}
                  <section className="flex-1 space-y-4 sm:space-y-5">
                    <header className="flex items-center gap-3 mb-1">
                      <motion.span whileHover={{ scale: 1.05 }} className="inline-flex">
                        <Badge
                          variant="outline"
                          className={cn(
                            "transition-all duration-300 text-xs px-2.5 py-1 font-medium shadow-sm flex items-center gap-1.5 rounded-md",
                            getSourceColor(selectedNote.source),
                          )}
                        >
                          {React.createElement(getSourceIcon(selectedNote.source), { className: "h-4 w-4" })}
                          {selectedNote.source}
                        </Badge>
                      </motion.span>
                      <time className="text-xs text-gray-400 font-medium tracking-wide">
                        {selectedNote.date}
                      </time>
                    </header>

                    <h1 className="text-xl font-semibold text-white leading-tight tracking-tight">
                      {selectedNote.title}
                    </h1>

                    <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                      {selectedNote.description}
                    </p>

                    {selectedNote.tags.length > 0 && (
                      <ul className="flex flex-wrap gap-2">
                        {selectedNote.tags.map((tag, index) => (
                          <li key={`${selectedNote.id}-tag-${index}`}>
                            <Badge
                              variant="outline"
                              className="px-2 py-0.5 text-xs border-blue-500/40 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-300 cursor-pointer rounded-md font-medium shadow-sm"
                            >
                              {tag}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium pt-1">
                      {selectedNote.duration && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{selectedNote.duration}</span>
                        </span>
                      )}
                      {selectedNote.fileSize && (
                        <span className="flex items-center gap-1.5">
                          <HardDrive className="h-4 w-4" />
                          <span>{selectedNote.fileSize}</span>
                        </span>
                      )}
                    </div>
                  </section>
                </div>
              </motion.section>

              {/* Tabs Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-white/[0.05] rounded-lg mb-8 sm:mb-10 border border-white/10">
                    {["resumo", "transcricao", "podcast", "aprendizado"].map((tabValue) => (
                      <TabsTrigger
                        key={tabValue}
                        value={tabValue}
                        className="rounded-md text-sm font-medium text-gray-400 data-[state=active]:bg-white/10 data-[state=active]:text-gray-100 data-[state=active]:shadow-sm transition-all duration-300 py-2"
                      >
                        {tabValue.charAt(0).toUpperCase() + tabValue.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="resumo" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="shadow-sm border-white/10 bg-white/[0.02] backdrop-blur-sm rounded-lg">
                        <CardHeader className="p-6 pb-4">
                          <CardTitle className="text-lg font-semibold flex items-center gap-2.5">
                            <Sparkles className="h-5 w-5 text-blue-400" /> Resumo por IA
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-5 text-sm">
                          {selectedNote.aiSummary && selectedNote.aiSummary.trim() ? (
                            <div className="formatted-content">
                              {formatWebhookText(selectedNote.aiSummary)}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="bg-white/[0.05] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-gray-400 font-medium mb-2">
                                Resumo será gerado automaticamente
                              </p>
                              <p className="text-sm text-gray-400">
                                Adicione conteúdo via webhook N8N para ver o resumo aqui
                              </p>
                              {selectedNote.webhookData && (
                                <p className="text-xs text-gray-400 mt-2">
                                  Processado em: {new Date(selectedNote.webhookData.processedAt).toLocaleString('pt-BR')}
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="transcricao" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="shadow-sm border-white/10 bg-white/[0.02] backdrop-blur-sm rounded-lg">
                        <CardHeader className="p-6 pb-4">
                          <CardTitle className="text-lg font-semibold">Transcrição Completa</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                          <ScrollArea className="h-[400px] sm:h-[500px] pr-3 sm:pr-4">
                            {selectedNote.transcript && selectedNote.transcript.trim() ? (
                              <div className="formatted-content text-sm">
                                {formatWebhookText(selectedNote.transcript)}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                  <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-gray-400 font-medium mb-2">
                                  Transcrição será gerada automaticamente
                                </p>
                                <p className="text-sm text-muted-foreground max-w-md">
                                  Para conteúdo de áudio/vídeo, a transcrição aparecerá aqui após o processamento via N8N
                                </p>
                                {selectedNote.webhookData && (
                                  <p className="text-xs text-gray-400 mt-2">
                                    Tipo: {selectedNote.webhookData.type} | Processado em: {new Date(selectedNote.webhookData.processedAt).toLocaleString('pt-BR')}
                                  </p>
                                )}
                              </div>
                            )}
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="podcast" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="shadow-sm border-white/10 bg-white/[0.02] backdrop-blur-sm rounded-lg">
                        <CardHeader className="p-6 pb-4">
                          <CardTitle className="text-lg font-semibold">Conteúdo do Podcast</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-5 text-sm">
                          {selectedNote.podcastContent ? (
                            <p className="text-gray-400 leading-relaxed">{selectedNote.podcastContent}</p>
                          ) : (
                            <p className="text-gray-400 leading-relaxed italic">
                              Conteúdo de podcast não disponível. Este conteúdo pode ser adaptado para formato de podcast no futuro.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="aprendizado" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="shadow-sm border-white/10 bg-white/[0.02] backdrop-blur-sm rounded-lg">
                        <CardHeader className="p-6 pb-4">
                          <CardTitle className="text-lg font-semibold">Aprendizado</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-5 text-sm">
                          <p className="text-gray-400 leading-relaxed">
                            Aqui você pode registrar seus principais aprendizados, insights ou reflexões sobre este
                            conteúdo. Use este espaço para anotações pessoais, resumos ou links úteis.
                          </p>
                          <div className="mt-6 p-6 bg-white/[0.05] rounded-lg border border-white/10">
                            <h4 className="font-semibold mb-3 text-base text-white">Sugestões de Anotações:</h4>
                            <ul className="list-disc list-inside space-y-2 text-gray-400">
                              <li>O que você aprendeu de mais importante?</li>
                              <li>Como pode aplicar este conhecimento?</li>
                              <li>Links, referências ou recursos extras</li>
                              <li>Dúvidas ou pontos a pesquisar</li>
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </motion.section>
            </div>
          </main>

          {/* Assistant Panel */}
          <aside className="hidden lg:block fixed right-0 top-20 w-[24rem] h-[calc(100vh-5rem)] border-l border-white/10 bg-white/[0.05] backdrop-blur-md shadow-xl">
            <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Carregando assistente...</div></div>}>
              <AssistantPanel
                noteId={selectedNote.id}
                onChatSessionUpdate={handleChatSessionUpdate}
              />
            </Suspense>
          </aside>
        </div>
        
        {/* Add Context Modal */}
        <Suspense fallback={null}>
          <AddContextModal
            isOpen={isAddContextModalOpen}
            onClose={() => setIsAddContextModalOpen(false)}
            onSave={onSaveContext as any}
            sessionId={getOrCreateSession(selectedNote.id).id}
            sessionData={formatSessionForWebhook(getOrCreateSession(selectedNote.id))}
          />
        </Suspense>
      </div>
    </AnimatedPageWrapperOptimized>
  )
}