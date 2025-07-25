// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { useMemo, useEffect, useRef } from "react";

import { useStore } from "~/core/store";
import { cn } from "~/lib/utils";

import { ChatHeader } from "./components/chat-header";
import { MessagesBlock } from "./components/messages-block";
import { ResearchBlock } from "./components/research-block";

export default function Main() {
  const openResearchId = useStore((state) => state.openResearchId);
  const messagesBlockRef = useRef<{ sendQuery: (query: string) => void }>(null);
  
  const doubleColumnMode = useMemo(
    () => openResearchId !== null,
    [openResearchId],
  );

  useEffect(() => {
    const handleSelectHistoryQuery = (event: CustomEvent<{ query: string }>) => {
      const { query } = event.detail;
      messagesBlockRef.current?.sendQuery(query);
    };

    window.addEventListener('selectHistoryQuery', handleSelectHistoryQuery as EventListener);
    
    return () => {
      window.removeEventListener('selectHistoryQuery', handleSelectHistoryQuery as EventListener);
    };
  }, []);
  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a]">
      <ChatHeader />
      <div
        className={cn(
          "flex h-full w-full px-2 sm:px-4 pt-4 pb-4",
          "justify-center",
        )}
      >
        <div
          className={cn(
            "flex transition-all duration-300 ease-out w-full",
            !doubleColumnMode && "max-w-[768px]",
            doubleColumnMode && "gap-4 md:gap-6 lg:gap-8 flex-col lg:flex-row max-w-[1600px]",
          )}
        >
        <MessagesBlock
          ref={messagesBlockRef}
          className={cn(
            "shrink-0 transition-all duration-300 ease-out",
            !doubleColumnMode && "w-full",
            doubleColumnMode && "w-full lg:w-[538px] lg:max-w-[45%]",
          )}
        />
        <ResearchBlock
          className={cn(
            "pb-4 transition-all duration-300 ease-out",
            !doubleColumnMode && "hidden",
            doubleColumnMode && "block w-full lg:flex-1",
          )}
          researchId={openResearchId}
        />
        </div>
      </div>
    </div>
  );
}
