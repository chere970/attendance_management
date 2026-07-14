"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { Brand } from "@/components/brand";

const links = [
  { href: "/employee/dashboard", label: "Home" },
  { href: "/employee/attendance", label: "Attendance" },
  { href: "/employee/request", label: "Requests" },
  { href: "/employee/history", label: "History" },
];

export const Nav = () => {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Brand href="/employee/dashboard" />

        <div className="flex flex-wrap items-center gap-1">
          {links.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-teal-50 text-teal-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/employee/profile"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
          aria-label="Profile"
        >
          <User className="size-4" />
          <span className="hidden sm:inline">Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default Nav;
