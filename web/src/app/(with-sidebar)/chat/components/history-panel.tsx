// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import {
  History,
  Search,
  Trash2,
  Clock,
  Plus,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

import { Tooltip } from "~/components/deer-flow/tooltip";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { useHistoryStore } from "~/core/store/history-store";
import type { HistoryItem } from "~/core/store/history-store";
import { cn } from "~/lib/utils";

interface HistoryPanelProps {
  onSelectQuery?: (query: string, fileName?: string) => void;
  onLoadConversation?: (conversation: HistoryItem) => void;
}

export function HistoryPanel({
  onSelectQuery,
  onLoadConversation,
}: HistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { conversations, removeConversation, clearHistory } = useHistoryStore();

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Há poucos minutos";
    } else if (diffInHours < 24) {
      return `Há ${Math.floor(diffInHours)} hora${Math.floor(diffInHours) > 1 ? "s" : ""}`;
    } else if (diffInHours < 168) {
      return `Há ${Math.floor(diffInHours / 24)} dia${Math.floor(diffInHours / 24) > 1 ? "s" : ""}`;
    } else {
      return date.toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const handleSelectConversation = (conversation: HistoryItem) => {
    if (conversation.messages && conversation.messages.length > 0) {
      // Load saved conversation
      onLoadConversation?.(conversation);
    } else {
      // Fallback to old behavior for conversations without saved messages
      onSelectQuery?.(conversation.query, conversation.fileName);
    }
    setOpen(false);
  };

  const handleRemoveConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeConversation(id);
  };

  const handleClearHistory = () => {
    clearHistory();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Tooltip title="Histórico de Conversas">
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg border border-white/10 bg-white/[0.05] text-gray-300 hover:bg-white/[0.08]"
          >
            <History className="h-5 w-5" />
          </Button>
        </SheetTrigger>
      </Tooltip>

      <SheetContent side="left" className="w-96 border-white/10 bg-[#0a0a0a]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-white">
            <History className="h-5 w-5" />
            Histórico de Conversas
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            Acesse suas pesquisas e interações anteriores
          </SheetDescription>
          <Button
            variant="default"
            className="mt-4 w-full rounded-xl border border-blue-500/50 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
            onClick={() => {
              handleClearHistory();
              setOpen(false);
            }}
          >
            Nova Conversa
            <Plus className="ml-1 h-4 w-4" />
          </Button>
        </SheetHeader>

        <div className="flex h-full flex-col gap-3">
          <div className="relative">
            <Search className="absolute top-3 left-2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              className="border-white/10 bg-white/[0.05] pl-8 text-gray-100 placeholder:text-gray-500 focus:border-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {filteredConversations.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {filteredConversations.length} conversa
                {filteredConversations.length > 1 ? "s" : ""}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Limpar Tudo
              </Button>
            </div>
          )}

          <ScrollArea className="-mr-4 flex-1 pr-4">
            {filteredConversations.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <MessageSquare className="mb-4 h-12 w-12 text-gray-500" />
                <h3 className="mb-2 text-lg font-medium text-gray-300">
                  Comece uma nova conversa!
                </h3>
                <p className="text-sm text-gray-400">
                  Suas pesquisas e interações aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group relative cursor-pointer rounded-xl border border-white/10 p-3 transition-all",
                      "bg-white/[0.05] backdrop-blur-sm",
                      "hover:border-white/20 hover:bg-white/[0.08]",
                      "focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                    )}
                    onClick={() => handleSelectConversation(conversation)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleSelectConversation(conversation);
                      }
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="line-clamp-2 flex-1 text-base font-semibold text-gray-100">
                        {conversation.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                        onClick={(e) =>
                          handleRemoveConversation(conversation.id, e)
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <p className="mb-3 line-clamp-2 text-xs text-gray-400">
                      {conversation.query}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(conversation.timestamp)}
                      </div>

                      {conversation.fileName && (
                        <Badge
                          variant="secondary"
                          className="border-0 bg-white/10 text-xs text-gray-300"
                        >
                          {conversation.fileName}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
