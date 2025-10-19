// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Sparkles, Zap, Brain, Waves } from "lucide-react";
import { cn } from "~/lib/utils";

export type Model =
  | "google/gemini-2.5-pro"
  | "moonshotai/kimi-k2"
  | "grok-4-latest"
  | "deepseek/deepseek-chat-v3-0324:free";

interface ModelSelectorProps {
  value: Model;
  onChange: (value: Model) => void;
  className?: string;
  size?: "sm" | "default";
}

const modelConfig = {
  "google/gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    icon: Sparkles,
    color: "text-blue-500",
  },
  "moonshotai/kimi-k2": {
    name: "Kimi K2",
    icon: Zap,
    color: "text-emerald-500",
  },
  "grok-4-latest": {
    name: "Grok 4",
    icon: Brain,
    color: "text-purple-500",
  },
  "deepseek/deepseek-chat-v3-0324:free": {
    name: "DeepSeek V3",
    icon: Waves,
    color: "text-cyan-500",
  },
};

export function ModelSelector({
  value,
  onChange,
  className,
  size = "default",
}: ModelSelectorProps) {
  const selectedModel = modelConfig[value];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "bg-background/50 border-border/50 backdrop-blur-sm",
          size === "sm"
            ? "h-8 w-auto px-2 text-xs sm:w-[120px]"
            : "h-10 w-[180px]",
          className
        )}
      >
        <SelectValue>
          <div className="flex items-center gap-1.5">
            <selectedModel.icon
              className={cn(
                selectedModel.color,
                size === "sm" ? "h-3 w-3" : "h-4 w-4"
              )}
            />
            <span className="text-muted-foreground hidden sm:inline">
              {selectedModel.name}
            </span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(modelConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", config.color)} />
                <span>{config.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
