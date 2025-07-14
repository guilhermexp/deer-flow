// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { motion } from "framer-motion";

import { cn } from "~/lib/utils";

export function Welcome({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("flex flex-col", className)}
      style={{ transition: "all 0.2s ease-out" }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <h3 className="mb-2 text-center text-3xl font-medium text-white">
        👋 Olá!
      </h3>
      <div className="px-4 text-center text-lg text-gray-400">
        Bem-vindo ao{" "}
        <a
          href="https://github.com/bytedance/deer-flow"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 hover:underline"
        >
          🦌 DeerFlow
        </a>
        , um assistente de pesquisa profunda construído com modelos de linguagem de ponta, que ajuda
        você a pesquisar na web, navegar por informações e lidar com tarefas complexas.
      </div>
    </motion.div>
  );
}
