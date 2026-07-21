"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FAQS = [
  { q: "How long does shipping take?", a: "Domestic orders ship within 2–4 business days with free insured delivery on orders over ₹10,000. International delivery takes 5–9 days; duties are estimated at checkout." },
  { q: "What is your returns policy?", a: "Unworn pieces can be returned within 30 days for a full refund. Return shipping is free — request a label from your account or client care and we handle the rest." },
  { q: "Do you offer repairs?", a: "Yes. Every La De Noir piece includes free repairs for life — re-stitching, button and lining replacement, and hardware servicing at our atelier." },
  { q: "How do I find my size?", a: "Each product page has a detailed size guide with garment measurements. When between sizes on outerwear, we recommend sizing up. Client care can advise on specific fits." },
  { q: "Are drops restocked?", a: "Rarely. Most runs are finite (40–120 pieces) and not repeated. Create an account and join the list to see each drop before it goes public." },
  { q: "Which payment methods do you accept?", a: "Cards, UPI, Apple Pay and net banking. All payments are processed over an encrypted, PCI-compliant connection." },
];

export function HelpFaq() {
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto max-w-[820px] px-[5vw] pb-20 pt-14">
      {FAQS.map((f, i) => {
        const on = i === open;
        return (
          <div key={f.q} className="border-b border-gold/15">
            <button
              onClick={() => setOpen(on ? -1 : i)}
              className="flex w-full items-center justify-between gap-5 py-[26px] text-left font-serif text-lg font-medium sm:text-2xl"
            >
              <span>{f.q}</span>
              <span
                className={cn(
                  "shrink-0 text-[22px] text-gold transition-transform duration-300",
                  on && "rotate-45"
                )}
              >
                +
              </span>
            </button>
            <div
              className={cn(
                "grid overflow-hidden transition-all duration-500",
                on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="min-h-0">
                <p className="max-w-[640px] pb-[26px] text-sm leading-[1.8] text-cream/65">
                  {f.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
