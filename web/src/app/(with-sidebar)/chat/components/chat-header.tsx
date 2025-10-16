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
        <div className="flex items-center gap-1">
          <h1 className="text-sm font-semibold text-center">DeerFlow Chat</h1>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSearchOpen(true)}
            title="Buscar conversas"
            className="h-6 w-6"
          >
            <Search className="h-3 w-3" />
          </Button>
          
          {showHistoryButton && onToggleHistory && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleHistory}
              title="Histórico"
              className="h-6 w-6"
            >
              <History className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => window.location.href = '/settings'}
            title="Configurações"
            className="h-6 w-6"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}