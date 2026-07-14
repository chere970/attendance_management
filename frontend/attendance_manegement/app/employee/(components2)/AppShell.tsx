"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome =
    pathname?.startsWith("/employee/login") ||
    pathname?.startsWith("/employee/signup");

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen max-h-screen flex-col">
      <Nav />
      <div className="flex-grow overflow-y-auto bg-muted">{children}</div>
      <Footer />
    </div>
  );
}
