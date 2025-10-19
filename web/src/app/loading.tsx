export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="mb-4 animate-pulse text-4xl">🦌</div>
        <div className="text-muted-foreground">Carregando DeerFlow...</div>
      </div>
    </div>
  );
}
