// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { MagicWandIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Lightbulb, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { Detective } from "~/components/deer-flow/icons/detective";
import MessageInput, {
  type MessageInputRef,
} from "~/components/deer-flow/message-input";
import { ReportStyleDialog } from "~/components/deer-flow/report-style-dialog";
import { Tooltip } from "~/components/deer-flow/tooltip";
import { BorderBeam } from "~/components/magicui/border-beam";
import { Button } from "~/components/ui/button";
import { enhancePrompt } from "~/core/api";
import { useConfig } from "~/core/api/hooks";
import type { Option, Resource } from "~/core/messages";
import {
  setEnableDeepThinking,
  setEnableBackgroundInvestigation,
  useSettingsStore,
} from "~/core/store";
import { cn } from "~/lib/utils";

export function InputBox({
  className,
  responding,
  feedback,
  onSend,
  onCancel,
  onRemoveFeedback,
}: {
  className?: string;
  size?: "large" | "normal";
  responding?: boolean;
  feedback?: { option: Option } | null;
  onSend?: (
    message: string,
    options?: {
      interruptFeedback?: string;
      resources?: Array<Resource>;
    },
  ) => void;
  onCancel?: () => void;
  onRemoveFeedback?: () => void;
}) {
  const enableDeepThinking = useSettingsStore(
    (state) => state.general.enableDeepThinking,
  );
  const backgroundInvestigation = useSettingsStore(
    (state) => state.general.enableBackgroundInvestigation,
  );
  const { config, loading } = useConfig();
  const reportStyle = useSettingsStore((state) => state.general.reportStyle);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<MessageInputRef>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Enhancement state
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhanceAnimating, setIsEnhanceAnimating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");

  const handleSendMessage = useCallback(
    (message: string, resources: Array<Resource>) => {
      if (responding) {
        onCancel?.();
      } else {
        if (message.trim() === "") {
          return;
        }
        if (onSend) {
          onSend(message, {
            interruptFeedback: feedback?.option.value,
            resources,
          });
          onRemoveFeedback?.();
          // Clear enhancement animation after sending
          setIsEnhanceAnimating(false);
        }
      }
    },
    [responding, onCancel, onSend, feedback, onRemoveFeedback],
  );

  const handleEnhancePrompt = useCallback(async () => {
    if (currentPrompt.trim() === "" || isEnhancing) {
      return;
    }

    setIsEnhancing(true);
    setIsEnhanceAnimating(true);

    try {
      const enhancedPrompt = await enhancePrompt({
        prompt: currentPrompt,
        report_style: reportStyle.toUpperCase(),
      });

      // Add a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update the input with the enhanced prompt with animation
      if (inputRef.current) {
        inputRef.current.setContent(enhancedPrompt);
        setCurrentPrompt(enhancedPrompt);
      }

      // Keep animation for a bit longer to show the effect
      setTimeout(() => {
        setIsEnhanceAnimating(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to enhance prompt:", error);
      setIsEnhanceAnimating(false);
      // Could add toast notification here
    } finally {
      setIsEnhancing(false);
    }
  }, [currentPrompt, isEnhancing, reportStyle]);

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col rounded-xl border border-white/10",
        "bg-white/[0.05] backdrop-blur-md overflow-hidden",
        className,
      )}
      ref={containerRef}
    >
      <div className="w-full">
        <AnimatePresence>
          {feedback && (
            <motion.div
              ref={feedbackRef}
              className="absolute top-0 left-0 mt-2 ml-4 flex items-center justify-center gap-1 rounded-xl border border-blue-500/50 bg-blue-500/10 px-2 py-0.5 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div className="text-blue-400 flex h-full w-full items-center justify-center text-sm opacity-90">
                {feedback.option.text}
              </div>
              <X
                className="cursor-pointer opacity-60 text-blue-400"
                size={16}
                onClick={onRemoveFeedback}
              />
            </motion.div>
          )}
          {isEnhanceAnimating && (
            <motion.div
              className="pointer-events-none absolute inset-0 z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative h-full w-full">
                {/* Sparkle effect overlay */}
                <motion.div
                  className="absolute inset-0 rounded-[24px] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"
                  animate={{
                    background: [
                      "linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))",
                      "linear-gradient(225deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))",
                      "linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {/* Floating sparkles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-2 w-2 rounded-full bg-blue-400"
                    style={{
                      left: `${20 + i * 12}%`,
                      top: `${30 + (i % 2) * 40}%`,
                    }}
                    animate={{
                      y: [-10, -20, -10],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <MessageInput
          className={cn(
            "h-24 px-4 pt-5",
            feedback && "pt-9",
            isEnhanceAnimating && "transition-all duration-500",
          )}
          ref={inputRef}
          loading={loading}
          config={config}
          onEnter={handleSendMessage}
          onChange={setCurrentPrompt}
        />
      </div>
      <div className="flex flex-col lg:flex-row items-start lg:items-center px-4 py-2 gap-2">
        <div className="flex gap-2 min-w-0 flex-wrap lg:flex-nowrap">
          {config?.models.reasoning?.[0] && (
            <Tooltip
              className="max-w-60"
              title={
                <div>
                  <h3 className="mb-2 font-bold">
                    Modo de Pensamento Profundo: {enableDeepThinking ? "Ligado" : "Desligado"}
                  </h3>
                  <p>
                    Quando ativado, o DeerFlow usará o modelo de raciocínio (
                    {config.models.reasoning?.[0]}) para gerar planos mais elaborados.
                  </p>
                </div>
              }
            >
              <Button
                className={cn(
                  "rounded-xl bg-white/[0.05] backdrop-blur-sm border-white/10 hover:bg-white/[0.08] text-gray-300 text-xs whitespace-nowrap flex-shrink-0",
                  enableDeepThinking && "!border-blue-500/50 !text-blue-400 !bg-blue-500/10",
                )}
                variant="outline"
                onClick={() => {
                  setEnableDeepThinking(!enableDeepThinking);
                }}
              >
                <Lightbulb className="h-4 w-4 mr-1" /> 
                <span className="hidden xl:inline">Pensamento Profundo</span>
                <span className="xl:hidden">Profundo</span>
              </Button>
            </Tooltip>
          )}

          <Tooltip
            className="max-w-60"
            title={
              <div>
                <h3 className="mb-2 font-bold">
                  Modo de Investigação: {backgroundInvestigation ? "Ligado" : "Desligado"}
                </h3>
                <p>
                  Quando ativado, o DeerFlow realizará uma busca rápida antes do
                  planejamento. Isso é útil para pesquisas relacionadas a eventos e notícias
                  em andamento.
                </p>
              </div>
            }
          >
            <Button
              className={cn(
                "rounded-xl bg-white/[0.05] backdrop-blur-sm border-white/10 hover:bg-white/[0.08] text-gray-300 text-xs whitespace-nowrap flex-shrink-0",
                backgroundInvestigation && "!border-blue-500/50 !text-blue-400 !bg-blue-500/10",
              )}
              variant="outline"
              onClick={() =>
                setEnableBackgroundInvestigation(!backgroundInvestigation)
              }
            >
              <Detective className="h-4 w-4 mr-1" /> 
              <span className="hidden sm:inline md:hidden lg:inline">Investigação</span>
              <span className="sm:hidden lg:hidden">Investig.</span>
            </Button>
          </Tooltip>
          <ReportStyleDialog />
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
          <Tooltip title="Melhorar prompt com IA">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] flex-shrink-0",
                isEnhancing && "animate-pulse",
              )}
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || currentPrompt.trim() === ""}
            >
              {isEnhancing ? (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="bg-blue-400 h-2 w-2 animate-bounce rounded-full opacity-70" />
                </div>
              ) : (
                <MagicWandIcon className="text-blue-400 h-4 w-4" />
              )}
            </Button>
          </Tooltip>
          <Tooltip title={responding ? "Parar" : "Enviar"}>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full bg-white/[0.05] border-white/10 hover:bg-white/[0.08] flex-shrink-0",
                responding && "bg-red-500/10 border-red-500/50 hover:bg-red-500/20"
              )}
              onClick={() => inputRef.current?.submit()}
            >
              {responding ? (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="bg-red-400 h-3 w-3 rounded-sm opacity-70" />
                </div>
              ) : (
                <ArrowUp className="text-gray-300 h-4 w-4" />
              )}
            </Button>
          </Tooltip>
        </div>
      </div>
      {isEnhancing && (
        <>
          <BorderBeam
            duration={5}
            size={250}
            className="from-transparent via-red-500 to-transparent"
          />
          <BorderBeam
            duration={5}
            delay={3}
            size={250}
            className="from-transparent via-blue-500 to-transparent"
          />
        </>
      )}
    </div>
  );
}
