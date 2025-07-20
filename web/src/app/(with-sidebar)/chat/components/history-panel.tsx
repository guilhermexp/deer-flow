// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { History, Search, Trash2, Clock, Plus, MessageSquare } from "lucide-react";
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

export function HistoryPanel({ onSelectQuery, onLoadConversation }: HistoryPanelProps) {
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
      return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
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
            className="rounded-lg bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] text-gray-300"
          >
            <History className="h-5 w-5" />
          </Button>
        </SheetTrigger>
      </Tooltip>
      
      <SheetContent side="left" className="w-96 bg-[#0a0a0a] border-white/10">
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
            className="w-full mt-4 rounded-xl bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30 text-blue-400"
            onClick={() => {
              handleClearHistory();
              setOpen(false);
            }}
          >
            Nova Conversa
            <Plus className="h-4 w-4 ml-1" />
          </Button>
        </SheetHeader>

        <div className="flex flex-col gap-3 h-full">
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-8 bg-white/[0.05] border-white/10 text-gray-100 placeholder:text-gray-500 focus:border-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {filteredConversations.length > 0 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">
                {filteredConversations.length} conversa{filteredConversations.length > 1 ? "s" : ""}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar Tudo
              </Button>
            </div>
          )}

          <ScrollArea className="flex-1 -mr-4 pr-4">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <MessageSquare className="h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-gray-300">Comece uma nova conversa!</h3>
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
                      "group relative p-3 rounded-xl border border-white/10 cursor-pointer transition-all",
                      "bg-white/[0.05] backdrop-blur-sm",
                      "hover:bg-white/[0.08] hover:border-white/20",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-semibold text-base line-clamp-2 flex-1 text-gray-100">
                        {conversation.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                        onClick={(e) => handleRemoveConversation(conversation.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                      {conversation.query}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(conversation.timestamp)}
                      </div>
                      
                      {conversation.fileName && (
                        <Badge variant="secondary" className="text-xs bg-white/10 text-gray-300 border-0">
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