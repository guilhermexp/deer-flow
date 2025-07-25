"use client";

import { useState } from "react";
import { Search, History, Settings } from "lucide-react";

import { Button } from "~/components/ui/button";
import { SearchDialog } from "~/components/deer-flow/search-dialog";
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
        "flex items-center justify-between px-4 py-2 border-b border-border/50",
        "bg-background/80 backdrop-blur-sm",
        className
      )}>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">DeerFlow Chat</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSearchOpen(true)}
            title="Buscar conversas"
          >
            <Search className="h-4 w-4" />
          </Button>
          
          {showHistoryButton && onToggleHistory && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleHistory}
              title="Histórico"
            >
              <History className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => window.location.href = '/settings'}
            title="Configurações"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}