interface DashboardGreetingProps {
  userName: string;
}

export default function DashboardGreeting({
  userName,
}: DashboardGreetingProps) {
  return (
    <section className="text-center">
      <h1 className="bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 bg-clip-text text-4xl leading-tight font-bold tracking-tighter text-transparent md:text-5xl lg:text-6xl xl:text-7xl">
        Bom dia, <span className="text-glow-white">{userName}!</span>
      </h1>
    </section>
  );
}
