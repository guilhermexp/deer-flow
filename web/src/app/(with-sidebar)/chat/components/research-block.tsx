// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { Check, Copy, Headphones, Pencil, Undo2, X, Download, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ScrollContainer } from "~/components/deer-flow/scroll-container";
import { Tooltip } from "~/components/deer-flow/tooltip";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useReplay } from "~/core/replay";
import { closeResearch, listenToPodcast, useStore } from "~/core/store";
import { cn } from "~/lib/utils";

import { ResearchActivitiesBlock } from "./research-activities-block";
import { ResearchReportBlock } from "./research-report-block";
import { ResearchSummaryBlock } from "./research-summary-block";

export function ResearchBlock({
  className,
  researchId = null,
}: {
  className?: string;
  researchId: string | null;
}) {
  const reportId = useStore((state) =>
    researchId ? state.researchReportIds.get(researchId) : undefined,
  );
  const [activeTab, setActiveTab] = useState("activities");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingPodcast, setGeneratingPodcast] = useState(false);
  
  const hasReport = useStore((state) =>
    researchId ? state.researchReportIds.has(researchId) : false,
  );
  const reportStreaming = useStore((state) =>
    reportId ? (state.messages.get(reportId)?.isStreaming ?? false) : false,
  );
  const { isReplay } = useReplay();
  
  useEffect(() => {
    if (hasReport) {
      setActiveTab("report");
    }
  }, [hasReport]);

  const handleGeneratePodcast = useCallback(async () => {
    if (!researchId || generatingPodcast) {
      return;
    }
    setGeneratingPodcast(true);
    try {
      await listenToPodcast(researchId);
    } catch (error) {
      console.error("Failed to generate podcast:", error);
      // Error is already handled in the store with toast notification
    } finally {
      setGeneratingPodcast(false);
    }
  }, [researchId, generatingPodcast]);
  const handleCopy = useCallback(() => {
    if (!reportId) {
      return;
    }
    const report = useStore.getState().messages.get(reportId);
    if (!report) {
      return;
    }
    void navigator.clipboard.writeText(report.content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  }, [reportId]);

  // Download report as markdown
  const handleDownload = useCallback(() => {
    if (!reportId) {
      return;
    }
    const report = useStore.getState().messages.get(reportId);
    if (!report) {
      return;
    }
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const filename = `research-report-${timestamp}.md`;
    const blob = new Blob([report.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }, [reportId]);

    
  const handleEdit = useCallback(() => {
    setEditing((editing) => !editing);
  }, []);

  // When the research id changes, set the active tab to activities
  useEffect(() => {
    if (!hasReport) {
      setActiveTab("activities");
    }
  }, [hasReport, researchId]);

  return (
    <div className={cn("h-full w-full", className)}>
      <Card className={cn("relative h-full w-full pt-4", className)}>
        <div className="absolute right-2 top-2 flex flex-wrap items-center justify-end gap-1 z-10 max-w-[50%] sm:max-w-none">
          {hasReport && !reportStreaming && (
            <>
              <Tooltip title={generatingPodcast ? "Generating podcast..." : "Generate Podcast"}>
                <Button
                  className="text-gray-400 hover:text-gray-200"
                  size="icon"
                  variant="ghost"
                  disabled={generatingPodcast}
                  onClick={handleGeneratePodcast}
                >
                  {generatingPodcast ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Headphones className="h-4 w-4" />
                  )}
                </Button>
              </Tooltip>
              <Tooltip title="Edit">
                <Button
                  className="text-gray-400 hover:text-gray-200"
                  size="icon"
                  variant="ghost"
                  disabled={isReplay}
                  onClick={handleEdit}
                >
                  {editing ? <Undo2 className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
              </Tooltip>
              <Tooltip title="Copy">
                <Button
                  className="text-gray-400 hover:text-gray-200"
                  size="icon"
                  variant="ghost"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </Tooltip>
              <Tooltip title="Download report as markdown">
                <Button
                  className="text-gray-400 hover:text-gray-200"
                  size="icon"
                  variant="ghost"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </Tooltip>
            </>
          )}
          <Tooltip title="Close">
            <Button
              className="text-gray-400 hover:text-gray-200"
              size="icon"
              variant="ghost"
              onClick={() => {
                closeResearch();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        <Tabs
          className="flex h-full w-full flex-col"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
        >
          <div className="flex w-full justify-center mt-8 overflow-x-auto scrollbar-hide">
            <TabsList className="flex-shrink-0">
              <TabsTrigger
                className="px-8"
                value="report"
                disabled={!hasReport}
              >
                Report
              </TabsTrigger>
              <TabsTrigger
                className="px-8"
                value="summary"
                disabled={!hasReport}
              >
                Summary
              </TabsTrigger>
              <TabsTrigger className="px-8" value="activities">
                Activities
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            className="h-full min-h-0 flex-grow px-8"
            value="report"
            forceMount
            hidden={activeTab !== "report"}
          >
            <ScrollContainer
              className="px-5pb-20 h-full"
              scrollShadowColor="var(--card)"
              autoScrollToBottom={!hasReport || reportStreaming}
            >
              {reportId && researchId && (
                <ResearchReportBlock
                  className="mt-4"
                  researchId={researchId}
                  messageId={reportId}
                  editing={editing}
                />
              )}
            </ScrollContainer>
          </TabsContent>
          <TabsContent
            className="h-full min-h-0 flex-grow px-8"
            value="activities"
            forceMount
            hidden={activeTab !== "activities"}
          >
            <ScrollContainer
              className="h-full"
              scrollShadowColor="var(--card)"
              autoScrollToBottom={!hasReport || reportStreaming}
            >
              {researchId && (
                <ResearchActivitiesBlock
                  className="mt-4"
                  researchId={researchId}
                />
              )}
            </ScrollContainer>
          </TabsContent>
          <TabsContent
            className="h-full min-h-0 flex-grow px-8"
            value="summary"
            forceMount
            hidden={activeTab !== "summary"}
          >
            <ScrollContainer
              className="h-full"
              scrollShadowColor="var(--card)"
            >
              {reportId && researchId && (
                <ResearchSummaryBlock
                  className="mt-4"
                  researchId={researchId}
                  reportId={reportId}
                />
              )}
            </ScrollContainer>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
