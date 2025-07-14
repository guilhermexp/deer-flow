interface DashboardGreetingProps {
  userName: string
}

export default function DashboardGreeting({ userName }: DashboardGreetingProps) {
  return (
    <section className="text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tighter leading-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500">
        Bom dia, <span className="text-glow-white">{userName}!</span>
      </h1>
    </section>
  )
}
