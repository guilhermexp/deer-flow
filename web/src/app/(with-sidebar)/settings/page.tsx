// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent } from "~/components/ui/tabs";
import { useReplay } from "~/core/replay";
import {
  type SettingsState,
  changeSettings,
  saveSettings,
  useSettingsStore,
} from "~/core/store";
import { cn } from "~/lib/utils";

import { SETTINGS_TABS } from "./tabs";

function SettingsContent() {
  const { isReplay } = useReplay();
  const [activeTabId, setActiveTabId] = useState(SETTINGS_TABS[0]!.id);
  const [settings, setSettings] = useState(useSettingsStore.getState());
  const [changes, setChanges] = useState<Partial<SettingsState>>({});

  const handleTabChange = useCallback((newChanges: Partial<SettingsState>) => {
    setTimeout(() => {
      setChanges((prev) => ({
        ...prev,
        ...newChanges,
      }));
    }, 0);
  }, []);

  const handleSave = useCallback(() => {
    if (Object.keys(changes).length > 0) {
      const newSettings: SettingsState = {
        ...settings,
        ...changes,
      };
      setSettings(newSettings);
      setChanges({});
      changeSettings(newSettings);
      saveSettings();
    }
  }, [settings, changes]);

  const handleReset = useCallback(() => {
    setSettings(useSettingsStore.getState());
    setChanges({});
  }, []);

  useEffect(() => {
    setSettings(useSettingsStore.getState());
  }, []);

  const mergedSettings = useMemo<SettingsState>(() => {
    return {
      ...settings,
      ...changes,
    };
  }, [settings, changes]);

  const hasChanges = Object.keys(changes).length > 0;

  if (isReplay) {
    return null;
  }

  return (
    <div className="bg-background flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-4xl p-6">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie suas preferências do DeerFlow
            </p>
          </div>

          <Tabs
            value={activeTabId}
            onValueChange={setActiveTabId}
            className="w-full"
          >
            <div className="mb-6 flex gap-4 border-b">
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={cn(
                    "relative px-1 pb-3 text-sm font-medium transition-colors",
                    "hover:text-foreground",
                    activeTabId === tab.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {tab.beta && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Beta
                      </Badge>
                    )}
                  </div>
                  {activeTabId === tab.id && (
                    <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
                  )}
                </button>
              ))}
            </div>

            {SETTINGS_TABS.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                <tab.component
                  settings={mergedSettings}
                  onChange={handleTabChange}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-background/95 sticky bottom-0 border-t p-4 backdrop-blur-sm">
          <div className="container mx-auto flex max-w-4xl justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar alterações</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex h-full flex-col">
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto max-w-4xl p-6">
              <div className="mb-6">
                <h1 className="mb-2 text-3xl font-bold">Configurações</h1>
                <p className="text-muted-foreground">
                  Gerencie suas preferências do DeerFlow
                </p>
              </div>
              <div className="animate-pulse">
                <div className="bg-muted mb-6 h-10 w-1/3 rounded"></div>
                <div className="space-y-4">
                  <div className="bg-muted h-20 rounded"></div>
                  <div className="bg-muted h-20 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
