"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

const links = [
  { href: "/admin/dashboard", label: "Employees", exact: true },
  { href: "/admin/dashboard/attendanceSummary", label: "Summary" },
  { href: "/admin/dashboard/requests", label: "Requests" },
  { href: "/admin/dashboard/performance", label: "Performance" },
];

export const Nav = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Brand href="/admin/dashboard" />

        <div className="flex flex-wrap items-center gap-1">
          {links.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname?.startsWith(link.href);
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

        <Button
          className="bg-teal-700 hover:bg-teal-800"
          onClick={() => router.push("/admin/dashboard/addNewEmployee")}
        >
          <UserPlus className="size-4" />
          Add Employee
        </Button>
      </div>
    </nav>
  );
};

export default Nav;
