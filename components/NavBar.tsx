"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/",             label: "Home" },
  { href: "/players",      label: "Players" },
  { href: "/matches",      label: "Matches" },
  { href: "/records",      label: "Records" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Kingfut-style red top strip */}
      <div className="h-1 bg-eg-red" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-13">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group py-3">
          <span className="text-2xl leading-none">🇪🇬</span>
          <div className="leading-tight">
            <span className="block font-bold text-sm tracking-widest uppercase text-eg-text group-hover:text-eg-red transition-colors">
              Egypt Football
            </span>
          </div>
        </Link>

        {/* Nav links — bottom-border active indicator */}
        <div className="flex h-full items-stretch">
          {links.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center px-4 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors
                  ${active
                    ? "border-eg-red text-eg-red"
                    : "border-transparent text-eg-muted hover:text-eg-text hover:border-eg-border-2"
                  }
                `}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
