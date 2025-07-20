// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { zodResolver } from "@hookform/resolvers/zod";
import { Settings } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import type { SettingsState } from "~/core/store";

import type { Tab } from "./types";

const generalFormSchema = z.object({
  autoAcceptedPlan: z.boolean(),
  maxPlanIterations: z.number().min(1, {
    message: "O número máximo de iterações do plano deve ser pelo menos 1.",
  }),
  maxStepNum: z.number().min(1, {
    message: "O número máximo de etapas deve ser pelo menos 1.",
  }),
  maxSearchResults: z.number().min(1, {
    message: "O número máximo de resultados de pesquisa deve ser pelo menos 1.",
  }),
  // Others
  enableBackgroundInvestigation: z.boolean(),
  enableDeepThinking: z.boolean(),
  reportStyle: z.enum(["academic", "popular_science", "news", "social_media"]),
  selectedModel: z.enum(["google/gemini-2.5-pro", "moonshotai/kimi-k2", "grok-4-latest", "deepseek/deepseek-chat-v3-0324:free"]),
});

export const GeneralTab: Tab = ({
  settings,
  onChange,
}: {
  settings: SettingsState;
  onChange: (changes: Partial<SettingsState>) => void;
}) => {
  const generalSettings = useMemo(() => settings.general, [settings]);
  const form = useForm<z.infer<typeof generalFormSchema>>({
    resolver: zodResolver(generalFormSchema, undefined, undefined),
    defaultValues: generalSettings,
    mode: "all",
    reValidateMode: "onBlur",
  });

  const currentSettings = form.watch();
  useEffect(() => {
    let hasChanges = false;
    for (const key in currentSettings) {
      if (
        currentSettings[key as keyof typeof currentSettings] !==
        settings.general[key as keyof SettingsState["general"]]
      ) {
        hasChanges = true;
        break;
      }
    }
    if (hasChanges) {
      onChange({ general: currentSettings });
    }
  }, [currentSettings, onChange, settings]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-medium">Geral</h1>
      </header>
      <main>
        <Form {...form}>
          <form className="space-y-8">
            <FormField
              control={form.control}
              name="autoAcceptedPlan"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="autoAcceptedPlan"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label className="text-sm" htmlFor="autoAcceptedPlan">
                        Permitir aceitação automática de planos
                      </Label>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxPlanIterations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máximo de iterações do plano</FormLabel>
                  <FormControl>
                    <Input
                      className="w-60"
                      type="number"
                      defaultValue={field.value}
                      min={1}
                      onChange={(event) =>
                        field.onChange(parseInt(event.target.value || "0"))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Defina como 1 para planejamento de etapa única. Defina como 2 ou mais para
                    habilitar o replanejamento.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxStepNum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máximo de etapas de um plano de pesquisa</FormLabel>
                  <FormControl>
                    <Input
                      className="w-60"
                      type="number"
                      defaultValue={field.value}
                      min={1}
                      onChange={(event) =>
                        field.onChange(parseInt(event.target.value || "0"))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Por padrão, cada plano de pesquisa tem 3 etapas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxSearchResults"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máximo de resultados de pesquisa</FormLabel>
                  <FormControl>
                    <Input
                      className="w-60"
                      type="number"
                      defaultValue={field.value}
                      min={1}
                      onChange={(event) =>
                        field.onChange(parseInt(event.target.value || "0"))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Por padrão, cada etapa de pesquisa tem 3 resultados.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </main>
    </div>
  );
};
GeneralTab.displayName = "Geral";
GeneralTab.icon = Settings;
