import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";

export const metadata: Metadata = {
  title: "AttendHub | Admin",
  description: "Manage employees, requests, and attendance analytics.",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen max-h-screen flex-col">
      <Nav />
      <div className="flex-grow overflow-y-auto bg-muted">{children}</div>
    </div>
  );
}
