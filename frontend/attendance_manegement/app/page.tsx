"use client";

import {
  BarChart3,
  ClipboardCheck,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: Timer,
    title: "Check-in & check-out",
    description: "Employees log daily attendance with clear status and timers.",
  },
  {
    icon: ClipboardCheck,
    title: "Leave requests",
    description: "Submit leave or sick requests and track approval status.",
  },
  {
    icon: BarChart3,
    title: "Admin analytics",
    description: "Summaries and working-hours views for managers.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description: "JWT auth with separate employee and admin experiences.",
  },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="relative min-h-svh overflow-hidden bg-slate-50 text-slate-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(13,148,136,0.16),_transparent_55%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-5xl flex-col px-6 py-8 md:px-10">
        <header className="flex items-center justify-between">
          <Brand />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => router.push("/employee/login")}
            >
              Log in
            </Button>
            <Button
              className="bg-teal-700 hover:bg-teal-800"
              onClick={() => router.push("/employee/signup")}
            >
              Sign up
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-16 md:py-20">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-teal-800">
            Attendance management
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
            AttendHub
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            A full-stack system for daily attendance, leave workflows, and admin
            reporting — built with Next.js, Express, Prisma, and MongoDB.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-teal-700 px-6 hover:bg-teal-800"
              onClick={() => router.push("/employee/login")}
            >
              Open app
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-300 bg-white/70"
              onClick={() => router.push("/employee/signup")}
            >
              Create employee account
            </Button>
          </div>
        </main>

        <section className="grid gap-6 border-t border-slate-200/80 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="space-y-2">
              <Icon className="size-5 text-teal-700" />
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              <p className="text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
