import "./employee/globals.css";
import React from "react";

const fontVariables = {
  "--font-geist-sans": "ui-sans-serif, system-ui, sans-serif",
  "--font-geist-mono": "ui-monospace, SFMono-Regular, monospace",
} as React.CSSProperties;

export const metadata = {
  title: {
    default: "AttendHub",
    template: "%s | AttendHub",
  },
  description:
    "Full-stack attendance management — check-in/out, leave requests, and admin analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased" style={fontVariables}>
        {children}
      </body>
    </html>
  );
}
