"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/chat", label: "💬 Chat", shortLabel: "💬" },
  { href: "/transactions", label: "📊 Transactions", shortLabel: "📊" },
  { href: "/upload", label: "📤 Upload", shortLabel: "📤" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="glass border-b border-white/10 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-lg font-bold hover:opacity-80 transition-opacity">
          💰 Finance Advisor
        </Link>
        <div className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname === link.href
                  ? "bg-white/15 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="hidden sm:inline">{link.label}</span>
              <span className="sm:hidden">{link.shortLabel}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
