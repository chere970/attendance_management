import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./(components2)/AppShell";

export const metadata: Metadata = {
  title: "AttendHub | Employee",
  description: "Check in, request leave, and view your attendance history.",
};

export default function EmployeeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
