// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useCallback, useEffect, useState } from "react";

import { Markdown } from "~/components/deer-flow/markdown";
import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useStore } from "~/core/store";
import { cn } from "~/lib/utils";

interface ResearchSummaryBlockProps {
  className?: string;
  researchId: string;
  reportId: string;
}

export function ResearchSummaryBlock({
  className,
  researchId: _researchId,
  reportId,
}: ResearchSummaryBlockProps) {
  const report = useStore((state) => state.messages.get(reportId));
  const [summary, setSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = useCallback((content: string): string => {
    // Extract key sections from the report
    const lines = content.split("\n");
    const sections: { title: string; content: string[] }[] = [];
    let currentSection: { title: string; content: string[] } | null = null;

    for (const line of lines) {
      if (!line) continue;

      // Main headers (##)
      if (line.startsWith("## ") && !line.toLowerCase().includes("reference")) {
        if (currentSection && currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace("## ", "").trim(),
          content: [],
        };
      }
      // Collect content for current section
      else if (currentSection && line.trim() && !line.startsWith("#")) {
        currentSection.content.push(line.trim());
      }
    }

    // Add last section
    if (currentSection && currentSection.content.length > 0) {
      sections.push(currentSection);
    }

    // Create summary
    let summaryText = "# 📋 Resumo Executivo\n\n";

    // Extract introduction or overview
    const introSection = sections.find(
      (s) =>
        s.title.toLowerCase().includes("introdução") ||
        s.title.toLowerCase().includes("overview") ||
        s.title.toLowerCase().includes("visão geral")
    );

    if (introSection && introSection.content.length > 0) {
      summaryText += "## 🎯 Visão Geral\n\n";
      summaryText += introSection.content[0] + "\n\n";
    }

    // Extract key findings or main points
    summaryText += "## 🔍 Principais Descobertas\n\n";

    const keyFindings = sections
      .filter(
        (s) =>
          !s.title.toLowerCase().includes("conclus") &&
          !s.title.toLowerCase().includes("referenc") &&
          !s.title.toLowerCase().includes("introduç")
      )
      .slice(0, 3);

    keyFindings.forEach((section) => {
      if (section.content.length > 0) {
        summaryText += `**${section.title}**\n`;
        // Get first meaningful paragraph
        const firstPara =
          section.content.find((p) => p.length > 50) ?? section.content[0];
        summaryText += `${firstPara}\n\n`;
      }
    });

    // Extract conclusion
    const conclusionSection = sections.find((s) =>
      s.title.toLowerCase().includes("conclus")
    );

    if (conclusionSection && conclusionSection.content.length > 0) {
      summaryText += "## 💡 Conclusão\n\n";
      summaryText += conclusionSection.content[0] + "\n\n";
    }

    // Add quick stats
    const totalSections = sections.length;
    const wordCount = content.split(/\s+/).length;
    summaryText += "---\n\n";
    summaryText += `📊 **Estatísticas**: ${totalSections} seções • ~${Math.round(wordCount / 100) * 100} palavras\n`;

    return summaryText;
  }, []);

  useEffect(() => {
    if (report?.content && !summary && !isGenerating) {
      setIsGenerating(true);
      // Simulate async generation
      setTimeout(() => {
        const generatedSummary = generateSummary(report.content);
        setSummary(generatedSummary);
        setIsGenerating(false);
      }, 500);
    }
  }, [report, summary, isGenerating, generateSummary]);

  if (!report) {
    return null;
  }

  return (
    <Card className={cn("p-6", className)}>
      {isGenerating ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Markdown>{summary}</Markdown>
        </div>
      )}
    </Card>
  );
}
