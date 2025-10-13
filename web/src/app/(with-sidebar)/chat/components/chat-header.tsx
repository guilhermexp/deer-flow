"use client";

import { Search, History, Settings } from "lucide-react";
import { useState } from "react";

import { SearchDialog } from "~/components/deer-flow/search-dialog";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface ChatHeaderProps {
  className?: string;
  onToggleHistory?: () => void;
  showHistoryButton?: boolean;
}

export function ChatHeader({ 
  className, 
  onToggleHistory,
  showHistoryButton = true 
}: ChatHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  
  return (
    <>
      <div className={cn(
        "flex items-center justify-between px-3 py-1.5 border-b border-border/50",
        "bg-background/80 backdrop-blur-sm",
        className
      )}>
        <div className="flex items-center gap-1.5">
          <h1 className="text-sm font-semibold">DeerFlow Chat</h1>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSearchOpen(true)}
            title="Buscar conversas"
            className="h-7 w-7"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          
          {showHistoryButton && onToggleHistory && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleHistory}
              title="Histórico"
              className="h-7 w-7"
            >
              <History className="h-3.5 w-3.5" />
            </Button>
          )}
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => window.location.href = '/settings'}
            title="Configurações"
            className="h-7 w-7"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}