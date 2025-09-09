// Nested layout must NOT render <html> or <body>
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
