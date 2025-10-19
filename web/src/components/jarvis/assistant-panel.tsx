"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";

interface AssistantPanelProps {
  noteId: string;
  onChatSessionUpdate?: (noteId: string, session: any) => void;
}

export function AssistantPanel({
  noteId,
  onChatSessionUpdate,
}: AssistantPanelProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<string[]>([]);

  const handleSendMessage = React.useCallback(
    (message: string) => {
      setIsLoading(true);
      // Simulate AI response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          `User: ${message}`,
          `AI: Esta é uma resposta simulada para "${message}"`,
        ]);
        setIsLoading(false);
        if (onChatSessionUpdate) {
          onChatSessionUpdate(noteId, {
            messages: [
              ...messages,
              `User: ${message}`,
              `AI: Esta é uma resposta simulada`,
            ],
          });
        }
      }, 1000);
    },
    [noteId, messages, onChatSessionUpdate]
  );

  return (
    <Card className="h-full border-0 bg-transparent">
      <CardHeader className="border-b border-white/10 px-6 py-4">
        <CardTitle className="text-lg font-semibold text-white">
          Assistente AI
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="max-h-[400px] min-h-[200px] space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02] p-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400">
                Faça perguntas sobre esta nota...
              </p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="text-sm text-gray-100">
                  {msg}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-400">Pensando...</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite sua pergunta..."
              className="flex-1 rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-white/20 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value) {
                  handleSendMessage(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
              disabled={isLoading}
            />
            <Button
              size="sm"
              disabled={isLoading}
              className="border-white/10 bg-white/[0.05] text-gray-100 hover:bg-white/[0.08]"
            >
              Enviar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AssistantPanel;
