// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useState } from "react";
import { Check, FileText, Newspaper, Users, GraduationCap } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { setReportStyle, useSettingsStore } from "~/core/store";
import { cn } from "~/lib/utils";

import { Tooltip } from "./tooltip";

const REPORT_STYLES = [
  {
    value: "academic" as const,
    label: "Acadêmico",
    description: "Formal, objetivo e analítico com terminologia precisa",
    icon: GraduationCap,
  },
  {
    value: "popular_science" as const,
    label: "Ciência Popular",
    description: "Cativante e acessível para o público em geral",
    icon: FileText,
  },
  {
    value: "news" as const,
    label: "Notícias",
    description: "Estilo jornalístico factual, conciso e imparcial",
    icon: Newspaper,
  },
  {
    value: "social_media" as const,
    label: "Mídia Social",
    description: "Conciso, chamativo e compartilhável",
    icon: Users,
  },
];

export function ReportStyleDialog() {
  const [open, setOpen] = useState(false);
  const currentStyle = useSettingsStore((state) => state.general.reportStyle);

  const handleStyleChange = (
    style: "academic" | "popular_science" | "news" | "social_media",
  ) => {
    setReportStyle(style);
    setOpen(false);
  };

  const currentStyleConfig =
    REPORT_STYLES.find((style) => style.value === currentStyle) ||
    REPORT_STYLES[0]!;
  const CurrentIcon = currentStyleConfig.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip
        className="max-w-60"
        title={
          <div>
            <h3 className="mb-2 font-bold">
              Estilo de Escrita: {currentStyleConfig.label}
            </h3>
            <p>
              Escolha o estilo de escrita para seus relatórios de pesquisa. Diferentes
              estilos são otimizados para diferentes públicos e propósitos.
            </p>
          </div>
        }
      >
        <DialogTrigger asChild>
          <Button
            className="rounded-xl bg-white/[0.05] backdrop-blur-sm border-white/10 hover:bg-white/[0.08] text-gray-300 text-xs whitespace-nowrap flex-shrink-0"
            variant="outline"
          >
            <CurrentIcon className="h-4 w-4 mr-1" /> 
            <span className="hidden xl:inline">{currentStyleConfig.label}</span>
            <span className="xl:hidden">
              {currentStyle === "academic" ? "Acadêm." : 
               currentStyle === "popular_science" ? "Popular" :
               currentStyle === "news" ? "Notícias" : "Social"}
            </span>
          </Button>
        </DialogTrigger>
      </Tooltip>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Escolher Estilo de Escrita</DialogTitle>
          <DialogDescription>
            Selecione o estilo de escrita para seus relatórios de pesquisa. Cada estilo é
            otimizado para diferentes públicos e propósitos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {REPORT_STYLES.map((style) => {
            const Icon = style.icon;
            const isSelected = currentStyle === style.value;

            return (
              <button
                key={style.value}
                className={cn(
                  "hover:bg-accent flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                  isSelected && "border-primary bg-accent",
                )}
                onClick={() => handleStyleChange(style.value)}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{style.label}</h4>
                    {isSelected && <Check className="text-primary h-4 w-4" />}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {style.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
