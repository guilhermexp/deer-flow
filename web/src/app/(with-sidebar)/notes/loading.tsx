export default function NotesLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-4">
        <div className="animate-pulse">
          <div className="w-48 h-4 bg-white/10 rounded mx-auto mb-4"></div>
          <div className="w-32 h-4 bg-white/5 rounded mx-auto"></div>
        </div>
      </div>
    </div>
  );
}