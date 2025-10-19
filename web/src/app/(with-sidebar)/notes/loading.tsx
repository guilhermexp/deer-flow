export default function NotesLoadingSkeleton() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="animate-pulse">
          <div className="mx-auto mb-4 h-4 w-48 rounded bg-white/10"></div>
          <div className="mx-auto h-4 w-32 rounded bg-white/5"></div>
        </div>
      </div>
    </div>
  );
}
