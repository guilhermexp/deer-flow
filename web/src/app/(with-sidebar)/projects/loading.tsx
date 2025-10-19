import { Kanban } from "lucide-react";

export default function ProjectsLoadingSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-[#0a0a0a] text-gray-100">
      <div className="space-y-4 text-center">
        <div className="inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-white/5">
          <Kanban className="h-8 w-8 text-gray-400" />
        </div>
        <p className="animate-pulse text-gray-400">Carregando projetos...</p>
      </div>
    </div>
  );
}
