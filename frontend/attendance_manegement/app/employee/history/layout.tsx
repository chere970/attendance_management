import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AttendHub | Attendance History",
  description: "Review your past check-ins and worked hours.",
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
