"use client";

import * as React from "react";
import Image from "next/image";
import { useState, useCallback, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  ArrowLeft,
  Sparkles,
  Play,
  Clock,
  HardDrive,
  FileText,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import AnimatedPageWrapperOptimized from "~/components/jarvis/animated-page-wrapper-optimized";
import { cn } from "~/lib/utils";
import { formatWebhookText } from "~/lib/notes-utils";
import type { Note } from "~/app/(with-sidebar)/notes/page";
import type { ChatSession } from "~/lib/session-utils";
import type { WebhookResponse } from "~/lib/webhook-service";
import {
  createChatSession,
  addMessageToSession,
  formatSessionForWebhook,
} from "~/lib/session-utils";

// Lazy load heavy components
const AddContextModal = lazy(() =>
  import("~/components/jarvis/modals/add-context-modal").then((mod) => ({
    default: mod.AddContextModal,
  }))
);
const AssistantPanel = lazy(() =>
  import("~/components/jarvis/assistant-panel").then((mod) => ({
    default: mod.AssistantPanel,
  }))
);

interface OriginalData {
  url?: string;
}

interface NotesDetailViewProps {
  selectedNote: Note;
  onBack: () => void;
  getSourceIcon: (source: string) => LucideIcon;
  getSourceColor: (source: string) => string;
  chatSessions: Record<string, ChatSession>;
  onChatSessionsUpdate: (sessions: Record<string, ChatSession>) => void;
  onSaveContext: (
    contextType: string,
    webhookResponse: WebhookResponse & { originalData?: OriginalData }
  ) => void;
}

export function NotesDetailView({
  selectedNote,
  onBack,
  getSourceIcon,
  getSourceColor,
  chatSessions,
  onChatSessionsUpdate,
  onSaveContext,
}: NotesDetailViewProps) {
  const [activeTab, setActiveTab] = useState("resumo");
  const [chatInput, setChatInput] = useState("");
  const [isAddContextModalOpen, setIsAddContextModalOpen] = useState(false);
  const [showYoutubeIframe, setShowYoutubeIframe] = useState(false);

  // Get or create session helper
  const getOrCreateSession = (noteId: string): ChatSession => {
    return chatSessions[noteId] || createChatSession(noteId);
  };

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || !selectedNote) return;

    // Get or create session for current note
    let currentSession = chatSessions[selectedNote.id];
    if (!currentSession) {
      currentSession = createChatSession(selectedNote.id);
      onChatSessionsUpdate({
        ...chatSessions,
        [selectedNote.id]: currentSession,
      });
    }

    // Add user message
    const updatedSession = addMessageToSession(
      currentSession,
      chatInput,
      "user"
    );
    onChatSessionsUpdate({
      ...chatSessions,
      [selectedNote.id]: updatedSession,
    });

    setChatInput("");

    // Simulate assistant response
    setTimeout(() => {
      const finalSession = addMessageToSession(
        updatedSession,
        "Entendi sua pergunta. Posso ajudar você a analisar melhor suas notas ou encontrar informações específicas.",
        "assistant"
      );
      onChatSessionsUpdate({
        ...chatSessions,
        [selectedNote.id]: finalSession,
      });
    }, 1000);
  }, [chatInput, selectedNote, chatSessions, onChatSessionsUpdate]);

  const handleChatSessionUpdate = useCallback(
    (noteId: string, session: any) => {
      onChatSessionsUpdate({
        ...chatSessions,
        [noteId]: session,
      });
    },
    [chatSessions, onChatSessionsUpdate]
  );

  return (
    <AnimatedPageWrapperOptimized className="h-full">
      <div className="h-full bg-[#0a0a0a] text-gray-100">
        <div className="flex h-full">
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:mr-[24rem] lg:px-8">
            <div className="mx-auto max-w-7xl">
              {/* Back button and Title */}
              <div className="mb-6 flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onBack}
                    aria-label="Voltar para dashboard"
                    className="h-10 w-10 flex-shrink-0 rounded-lg border-white/10 bg-white/[0.05] transition-colors hover:bg-white/[0.08]"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 truncate text-2xl font-semibold text-white lg:text-3xl"
                >
                  {selectedNote.title}
                </motion.h1>
              </div>

              {/* Media Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row">
                  <div className="w-full flex-shrink-0 lg:w-2/3">
                    <motion.figure
                      id={`youtube-${selectedNote.id}`}
                      whileHover={{ scale: 1.005 }}
                      className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-white/[0.05] shadow-lg"
                    >
                      {selectedNote.source === "YouTube" &&
                      selectedNote.youtubeId ? (
                        <div className="relative h-full w-full">
                          {showYoutubeIframe ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${selectedNote.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                              title={selectedNote.title}
                              className="h-full w-full rounded-lg"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <div className="relative h-full w-full">
                              {selectedNote.mediaUrl ? (
                                <Image
                                  src={selectedNote.mediaUrl}
                                  alt={selectedNote.title}
                                  fill
                                  className="rounded-lg object-cover"
                                  priority
                                  sizes="(min-width: 1280px) 66vw, 100vw"
                                  onError={(e) => {
                                    // Fallback para thumbnail padrão se a imagem falhar
                                    const target = e.target as HTMLImageElement;
                                    if (selectedNote.youtubeId) {
                                      target.src = `https://img.youtube.com/vi/${selectedNote.youtubeId}/hqdefault.jpg`;
                                    }
                                  }}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-white/[0.05]">
                                  <Youtube className="h-20 w-20 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="cursor-pointer rounded-full border border-red-500/50 bg-red-600/90 p-4 shadow-lg backdrop-blur-sm transition-colors hover:bg-red-600"
                                  onClick={() => setShowYoutubeIframe(true)}
                                  aria-label="Reproduzir vídeo"
                                >
                                  <Play className="h-8 w-8 fill-white text-white" />
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : selectedNote.mediaType === "file" ? (
                        <div className="flex h-full items-center justify-center">
                          <FileText className="h-20 w-20 text-gray-400" />
                        </div>
                      ) : (
                        <>
                          {selectedNote.mediaUrl ? (
                            <Image
                              src={selectedNote.mediaUrl}
                              alt={selectedNote.title}
                              fill
                              className="rounded-lg object-cover"
                              priority
                              sizes="(min-width: 1280px) 66vw, 100vw"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-white/[0.05]">
                              <span className="text-gray-400">
                                {selectedNote.title}
                              </span>
                            </div>
                          )}
                          {selectedNote.mediaType === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="rounded-full bg-black/50 p-3 backdrop-blur-sm sm:p-4"
                              >
                                <Play className="h-6 w-6 fill-white text-white sm:h-8" />
                              </motion.div>
                            </div>
                          )}
                        </>
                      )}
                    </motion.figure>
                  </div>

                  {/* Note Info Section */}
                  <section className="flex-1 space-y-4">
                    <header className="flex items-center gap-3">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex"
                      >
                        <Badge
                          variant="outline"
                          className={cn(
                            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium shadow-sm transition-all duration-300",
                            getSourceColor(selectedNote.source)
                          )}
                        >
                          {React.createElement(
                            getSourceIcon(selectedNote.source),
                            { className: "h-4 w-4" }
                          )}
                          {selectedNote.source}
                        </Badge>
                      </motion.span>
                      <time className="text-xs font-medium tracking-wide text-gray-400">
                        {selectedNote.date}
                      </time>
                    </header>

                    <h1 className="text-xl leading-tight font-semibold tracking-tight text-white">
                      {selectedNote.title}
                    </h1>

                    <p className="max-w-2xl text-sm leading-relaxed text-gray-400">
                      {selectedNote.description}
                    </p>

                    {selectedNote.tags.length > 0 && (
                      <ul className="flex flex-wrap gap-2">
                        {selectedNote.tags.map((tag, index) => (
                          <li key={`${selectedNote.id}-tag-${index}`}>
                            <Badge
                              variant="outline"
                              className="cursor-pointer rounded-md border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 shadow-sm transition-all duration-300 hover:bg-blue-500/20"
                            >
                              {tag}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex items-center gap-4 pt-1 text-xs font-medium text-gray-400">
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
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="mb-6 grid h-auto w-full grid-cols-2 rounded-lg border border-white/10 bg-white/[0.05] p-1 sm:grid-cols-4">
                    {["resumo", "transcricao", "podcast", "aprendizado"].map(
                      (tabValue) => (
                        <TabsTrigger
                          key={tabValue}
                          value={tabValue}
                          className="rounded-md py-2 text-sm font-medium text-gray-400 transition-all duration-300 data-[state=active]:bg-white/10 data-[state=active]:text-gray-100 data-[state=active]:shadow-sm"
                        >
                          {tabValue.charAt(0).toUpperCase() + tabValue.slice(1)}
                        </TabsTrigger>
                      )
                    )}
                  </TabsList>

                  <TabsContent value="resumo" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="rounded-lg border-white/10 bg-white/[0.02] shadow-sm backdrop-blur-sm">
                        <CardHeader className="p-6 pb-4">
                          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                            <Sparkles className="h-5 w-5 text-blue-400" />{" "}
                            Resumo por IA
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 p-6 pt-0 text-sm">
                          {selectedNote.aiSummary &&
                          selectedNote.aiSummary.trim() ? (
                            <div className="formatted-content">
                              {formatWebhookText(selectedNote.aiSummary)}
                            </div>
                          ) : (
                            <div className="py-8 text-center">
                              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.05]">
                                <Sparkles className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="mb-2 font-medium text-gray-400">
                                Resumo será gerado automaticamente
                              </p>
                              <p className="text-sm text-gray-400">
                                Adicione conteúdo via webhook N8N para ver o
                                resumo aqui
                              </p>
                              {selectedNote.webhookData && (
                                <p className="mt-2 text-xs text-gray-400">
                                  Processado em:{" "}
                                  {new Date(
                                    selectedNote.webhookData.processedAt
                                  ).toLocaleString("pt-BR")}
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
                      <Card className="rounded-lg border-white/10 bg-white/[0.02] shadow-sm backdrop-blur-sm">
                        <CardHeader className="p-6 pb-4">
                          <CardTitle className="text-lg font-semibold">
                            Transcrição Completa
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                          <ScrollArea className="h-[400px] pr-3 sm:pr-4">
                            {selectedNote.transcript &&
                            selectedNote.transcript.trim() ? (
                              <div className="formatted-content text-sm">
                                {formatWebhookText(selectedNote.transcript)}
                              </div>
                            ) : (
                              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                                <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                                  <FileText className="text-muted-foreground h-8 w-8" />
                                </div>
                                <p className="mb-2 font-medium text-gray-400">
                                  Transcrição será gerada automaticamente
                                </p>
                                <p className="text-muted-foreground max-w-md text-sm">
                                  Para conteúdo de áudio/vídeo, a transcrição
                                  aparecerá aqui após o processamento via N8N
                                </p>
                                {selectedNote.webhookData && (
                                  <p className="mt-2 text-xs text-gray-400">
                                    Tipo: {selectedNote.webhookData.type} |
                                    Processado em:{" "}
                                    {new Date(
                                      selectedNote.webhookData.processedAt
                                    ).toLocaleString("pt-BR")}
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
                      <Card className="rounded-lg border-white/10 bg-white/[0.02] shadow-sm backdrop-blur-sm">
                        <CardHeader className="p-6 pb-4">
                          <CardTitle className="text-lg font-semibold">
                            Conteúdo do Podcast
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 p-6 pt-0 text-sm">
                          {selectedNote.podcastContent ? (
                            <p className="leading-relaxed text-gray-400">
                              {selectedNote.podcastContent}
                            </p>
                          ) : (
                            <p className="leading-relaxed text-gray-400 italic">
                              Conteúdo de podcast não disponível. Este conteúdo
                              pode ser adaptado para formato de podcast no
                              futuro.
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
                      <Card className="rounded-lg border-white/10 bg-white/[0.02] shadow-sm backdrop-blur-sm">
                        <CardHeader className="p-6 pb-4">
                          <CardTitle className="text-lg font-semibold">
                            Aprendizado
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 p-6 pt-0 text-sm">
                          <p className="leading-relaxed text-gray-400">
                            Aqui você pode registrar seus principais
                            aprendizados, insights ou reflexões sobre este
                            conteúdo. Use este espaço para anotações pessoais,
                            resumos ou links úteis.
                          </p>
                          <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.05] p-6">
                            <h4 className="mb-3 text-base font-semibold text-white">
                              Sugestões de Anotações:
                            </h4>
                            <ul className="list-inside list-disc space-y-2 text-gray-400">
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
          <aside className="fixed top-0 right-0 hidden h-screen w-[24rem] border-l border-white/10 bg-[#0a0a0a]/80 shadow-xl backdrop-blur-md lg:block">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <div className="animate-pulse text-gray-400">
                    Carregando assistente...
                  </div>
                </div>
              }
            >
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
            sessionData={formatSessionForWebhook(
              getOrCreateSession(selectedNote.id)
            )}
          />
        </Suspense>
      </div>
    </AnimatedPageWrapperOptimized>
  );
}
