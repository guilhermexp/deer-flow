"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";

export default function DashboardStatsSimple() {
  return (
    <div className="w-full space-y-6 lg:space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className={cn("border-white/10 bg-white/5 backdrop-blur-xl")}>
          <CardHeader>
            <CardTitle className="text-white">Welcome to Jarvis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">Your AI-powered personal assistant</p>
          </CardContent>
        </Card>

        <Card className={cn("border-white/10 bg-white/5 backdrop-blur-xl")}>
          <CardHeader>
            <CardTitle className="text-white">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">Manage your daily tasks</p>
          </CardContent>
        </Card>

        <Card className={cn("border-white/10 bg-white/5 backdrop-blur-xl")}>
          <CardHeader>
            <CardTitle className="text-white">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70">View your schedule</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
