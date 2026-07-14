import { Clock3 } from "lucide-react";
import Link from "next/link";

type BrandProps = {
  href?: string;
  className?: string;
  compact?: boolean;
};

export function Brand({
  href = "/",
  className = "",
  compact = false,
}: BrandProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 font-semibold tracking-tight text-slate-900 ${className}`}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm">
        <Clock3 className="size-5" />
      </span>
      {!compact && (
        <span className="text-xl">
          Attend<span className="text-teal-700">Hub</span>
        </span>
      )}
    </Link>
  );
}
