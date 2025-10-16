"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, MessageSquare, Loader2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { conversationsApiService } from "~/services/api/conversations";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface SearchResult {
  type: "conversation" | "message";
  id: string;
  conversationId?: string;
  title: string;
  content: string;
  createdAt: string;
  highlight?: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  
  // Função de busca com debounce
  const performSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!user || searchQuery.length < 2) {
        setResults([]);
        return;
      }
      
      setIsSearching(true);
      
      try {
        // Buscar conversas
        const conversationsResponse = await conversationsApiService.list({ search: searchQuery });
        const conversations = conversationsResponse.items;

        const searchResults: SearchResult[] = conversations.map(conv => ({
          type: "conversation" as const,
          id: conv.thread_id || conv.id.toString(),
          title: conv.title || "Conversa sem título",
          content: conv.query || "",
          createdAt: conv.created_at || new Date().toISOString(),
          highlight: conv.query?.toLowerCase().includes(searchQuery.toLowerCase()) 
            ? conv.query 
            : conv.title || undefined
        }));
        
        // TODO: Implementar busca em mensagens quando o backend suportar
        // const messages = await messagesService.search(searchQuery);
        
        setResults(searchResults);
      } catch (error) {
        console.error("Erro na busca:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [user]
  );
  
  // Executar busca quando query mudar
  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);
  
  // Limpar ao fechar
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);
  
  const handleResultClick = (result: SearchResult) => {
    if (result.type === "conversation") {
      router.push(`/chat?thread=${result.id}`);
    } else if (result.conversationId) {
      router.push(`/chat?thread=${result.conversationId}&message=${result.id}`);
    }
    onOpenChange(false);
  };
  
  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? <mark key={i} className="bg-yellow-500/30 text-yellow-200">{part}</mark>
        : part
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buscar Conversas</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou conteúdo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        <ScrollArea className="h-[400px] mt-4">
          {results.length === 0 && query.length >= 2 && !isSearching ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum resultado encontrado para "{query}"
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <Button
                  key={result.id}
                  variant="ghost"
                  className="w-full justify-start text-left p-4 h-auto"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <MessageSquare className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {highlightText(result.title, query)}
                      </div>
                      {result.content && (
                        <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {highlightText(result.content, query)}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(result.createdAt), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
