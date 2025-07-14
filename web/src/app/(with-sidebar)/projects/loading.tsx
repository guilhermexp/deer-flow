import { Kanban } from "lucide-react";

export default function ProjectsLoadingSkeleton() {
  return (
    <div className="bg-[#0a0a0a] text-gray-100 h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 animate-pulse">
          <Kanban className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-400 animate-pulse">Carregando projetos...</p>
      </div>
    </div>
  );
}