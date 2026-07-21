"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full border border-gold/25 bg-transparent px-4 py-[15px] font-mono text-[13px] text-cream outline-none transition-colors focus:border-gold placeholder:text-cream/35";

const CHANNELS = [
  { label: "Client care", value: "care@ladenoir.com", note: "Orders, sizing, repairs · replies within 1 day" },
  { label: "Press", value: "press@ladenoir.com", note: "Samples, features, interviews" },
  { label: "Wholesale", value: "stockists@ladenoir.com", note: "Retail & partnership enquiries" },
  { label: "Atelier", value: "12 Rue du Soir, Paris · Mumbai", note: "By appointment only" },
];

const TOPICS = ["Order", "Product", "Press"];

export default function ContactPage() {
  const [topic, setTopic] = useState("Order");
  const [sent, setSent] = useState(false);

  return (
    <div className="grid items-stretch lg:grid-cols-[1fr_1.1fr]">
      {/* info */}
      <div className="border-gold/15 px-[5vw] py-16 lg:border-r lg:pr-[4vw]">
        <div className="mb-3.5 font-mono text-[11px] tracking-[0.2em] text-cream/50">
          HOME / CONTACT
        </div>
        <h1 className="font-serif text-[40px] font-medium leading-[0.9] tracking-[-0.01em] sm:text-[64px] lg:text-[80px]">
          Get in touch<span className="text-gold">.</span>
        </h1>
        <p className="mb-11 mt-5 max-w-[400px] text-sm leading-[1.7] text-cream/60">
          Client care replies within one business day. For press and wholesale,
          use the dedicated lines below.
        </p>
        <div className="flex flex-col gap-[30px]">
          {CHANNELS.map((c) => (
            <div key={c.label}>
              <div className="mb-[7px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold">
                {c.label}
              </div>
              <div className="font-serif text-base">{c.value}</div>
              <div className="mt-[3px] text-xs text-cream/50">{c.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* form */}
      <div className="flex flex-col justify-center bg-noir-deep px-[5vw] py-16">
        {sent ? (
          <div className="mx-auto w-full max-w-[480px] py-10 text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-gold text-[28px] text-gold">
              ✓
            </div>
            <div className="mb-3 font-serif text-3xl font-medium">
              Message sent.
            </div>
            <p className="text-[13px] text-cream/60">
              Thank you — a member of client care will be in touch within one
              business day.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="w-full max-w-[480px]"
          >
            <div className="mb-6 font-serif text-[26px] font-medium">
              Send a message
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <input required placeholder="Name" className={inputCls} />
              <input required type="email" placeholder="Email" className={inputCls} />
            </div>
            <div className="mb-3 flex gap-2.5">
              {TOPICS.map((t) => {
                const on = t === topic;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className={cn(
                      "flex-1 border py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] transition-all",
                      on
                        ? "border-gold bg-gold text-noir-deep"
                        : "border-gold/30 text-cream/70 hover:border-gold/60"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <textarea
              required
              rows={5}
              placeholder="How can we help?"
              className={cn(inputCls, "mb-4 resize-y leading-relaxed")}
            />
            <button
              type="submit"
              className="w-full bg-gold p-[17px] font-mono text-xs font-bold uppercase tracking-[0.14em] text-noir-deep transition-colors hover:bg-cream"
            >
              Send message →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
