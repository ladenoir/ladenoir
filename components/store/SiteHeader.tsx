"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useCart } from "./cart-context";
import { cn } from "@/lib/utils";

const LEFT_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/maison", label: "Maison" },
  { href: "/help", label: "Help" },
];

const RIGHT_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/account", label: "Account" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const bag = ready ? count : 0;

  const linkCls = (href: string) =>
    cn(
      "transition-colors hover:text-gold",
      pathname === href ? "text-gold" : "text-cream/65"
    );

  return (
    <header
      className="sticky top-0 z-30 border-b border-gold/20 bg-noir/90 backdrop-blur-md"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="flex items-center justify-between px-[5vw] py-[22px]">
        {/* left nav (desktop) */}
        <nav className="hidden flex-1 items-center gap-[26px] font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em] md:flex">
          {LEFT_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* mobile menu button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 text-gold md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <Menu className="size-5" /> : <Menu className="size-5" />}
        </button>

        {/* logo */}
        <Link href="/" className="flex-1 text-center leading-none">
          <div className="mb-[3px] font-mono text-[9px] tracking-[0.42em] text-cream/55">
            LA DE
          </div>
          <div className="font-serif text-2xl font-semibold tracking-[0.28em] text-gold">
            NOIR
          </div>
        </Link>

        {/* right nav */}
        <div className="flex flex-1 items-center justify-end gap-[22px] font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em]">
          {RIGHT_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn("hidden md:inline", linkCls(l.href))}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/cart" className="text-gold">
            Bag ({bag})
          </Link>
        </div>
      </div>

      {/* mobile drawer */}
      {open && (
        <div className="border-t border-gold/15 px-[5vw] py-4 md:hidden">
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/45">
              Menu
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="size-4 text-cream/60" />
            </button>
          </div>
          <nav className="flex flex-col gap-3 font-mono text-sm uppercase tracking-[0.08em]">
            {[...LEFT_LINKS, ...RIGHT_LINKS].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={linkCls(l.href)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
