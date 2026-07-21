"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/store/cart-context";
import { formatINR } from "@/lib/types";
import { placeOrder } from "./actions";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full border border-gold/25 bg-transparent px-4 py-[15px] font-mono text-[13px] text-cream outline-none transition-colors focus:border-gold placeholder:text-cream/35";

const METHODS = ["Card", "UPI", "Apple Pay"];

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const duties = Math.round(subtotal * 0.02);
  const total = subtotal + duties;

  const [method, setMethod] = useState("Card");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    pin: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(null);
    setPlacing(true);
    const res = await placeOrder({
      ...form,
      method,
      items: items.map((i) => ({ slug: i.slug, size: i.size, qty: i.qty })),
    });
    setPlacing(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.orderNo) {
      setOrderNo(res.orderNo);
      clear();
    }
  };

  // confirmation
  if (orderNo) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-[5vw] py-16 text-center">
        <div className="mb-7 flex size-[72px] items-center justify-center rounded-full border border-gold text-[32px] text-gold">
          ✓
        </div>
        <div className="mb-4 font-mono text-[11px] tracking-[0.24em] text-gold">
          ORDER CONFIRMED
        </div>
        <h1 className="font-serif text-[40px] font-medium leading-[0.95] sm:text-[64px]">
          Welcome to the house.
        </h1>
        <p className="mx-auto mt-5 max-w-[420px] text-sm leading-relaxed text-cream/60">
          Order <span className="text-gold">#{orderNo}</span> is confirmed. A
          receipt is on its way to your inbox, and your pieces ship within 2–4
          days.
        </p>
        <Link
          href="/"
          className="mt-7 bg-gold px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-noir-deep transition-colors hover:bg-cream"
        >
          Back to home →
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-[5vw] py-24 text-center">
        <h1 className="font-serif text-[40px] font-medium sm:text-[56px]">
          Checkout<span className="text-gold">.</span>
        </h1>
        <p className="mt-4 font-mono text-xs tracking-[0.12em] text-cream/50">
          YOUR BAG IS EMPTY
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block bg-gold px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-noir-deep transition-colors hover:bg-cream"
        >
          Discover the collection →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid items-start lg:grid-cols-[1.4fr_1fr]">
      {/* form */}
      <div className="px-[5vw] pb-16 pt-12 lg:pr-[4vw]">
        <h1 className="mb-2 font-serif text-[32px] font-medium leading-[0.95] sm:text-[48px]">
          Checkout<span className="text-gold">.</span>
        </h1>
        <div className="mb-9 flex gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/50">
          <span className="text-gold">01 Details</span>
          <span>·</span>
          <span>02 Shipping</span>
          <span>·</span>
          <span>03 Payment</span>
        </div>

        <SectionLabel>Contact</SectionLabel>
        <input
          value={form.email}
          onChange={set("email")}
          type="email"
          placeholder="Email address"
          className={cn(inputCls, "mb-3")}
        />

        <SectionLabel className="mt-8">Shipping address</SectionLabel>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <input value={form.firstName} onChange={set("firstName")} placeholder="First name" className={inputCls} />
          <input value={form.lastName} onChange={set("lastName")} placeholder="Last name" className={inputCls} />
        </div>
        <input value={form.address} onChange={set("address")} placeholder="Address" className={cn(inputCls, "mb-3")} />
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3">
          <input value={form.city} onChange={set("city")} placeholder="City" className={inputCls} />
          <input value={form.state} onChange={set("state")} placeholder="State" className={inputCls} />
          <input value={form.pin} onChange={set("pin")} placeholder="PIN" className={inputCls} />
        </div>

        <SectionLabel className="mt-8">Payment</SectionLabel>
        <div className="mb-3 flex gap-2.5">
          {METHODS.map((m) => {
            const on = m === method;
            return (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  "flex-1 border py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] transition-all",
                  on
                    ? "border-gold bg-gold text-noir-deep"
                    : "border-gold/30 text-cream/70 hover:border-gold/60"
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
        <input placeholder="Card number" className={cn(inputCls, "mb-3")} />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="MM / YY" className={inputCls} />
          <input placeholder="CVC" className={inputCls} />
        </div>

        {error && (
          <div className="mt-4 border border-status-red/40 bg-status-red/10 px-4 py-2.5 font-mono text-[11px] text-status-red">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={placing}
          className="mt-7 w-full bg-gold p-[18px] font-mono text-xs font-bold uppercase tracking-[0.14em] text-noir-deep transition-colors hover:bg-cream disabled:opacity-60"
        >
          {placing ? "Placing order…" : `Place order · ${formatINR(total)}`}
        </button>
        <div className="mt-3.5 text-center font-mono text-[10.5px] tracking-[0.08em] text-cream/40">
          By placing your order you agree to the terms &amp; privacy policy.
        </div>
      </div>

      {/* summary */}
      <div className="border-t border-gold/15 bg-noir-deep px-[5vw] py-12 lg:sticky lg:top-0 lg:border-l lg:border-t-0 lg:pl-[4vw]">
        <div className="mb-6 font-serif text-2xl font-medium">In your bag</div>
        {items.map((it) => (
          <div
            key={`${it.slug}-${it.size}`}
            className="mb-5 grid grid-cols-[64px_1fr_auto] items-center gap-3.5"
          >
            <div className="relative aspect-[4/5] overflow-hidden border border-gold/12 bg-noir-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.image} alt={it.name} className="size-full object-cover contrast-[1.05] grayscale-[0.2]" />
              <div className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-gold font-mono text-[10px] font-bold text-noir-deep">
                {it.qty}
              </div>
            </div>
            <div>
              <div className="font-serif text-[15px] font-medium">{it.name}</div>
              <div className="mt-0.5 font-mono text-[10px] text-cream/50">SIZE {it.size}</div>
            </div>
            <div className="whitespace-nowrap font-mono text-xs font-medium text-gold">
              {formatINR(it.price * it.qty)}
            </div>
          </div>
        ))}
        <div className="mt-2 flex flex-col gap-3 border-t border-gold/15 pt-5 font-mono text-xs text-cream/70">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span className="text-gold">Free</span></div>
          <div className="flex justify-between"><span>Est. duties</span><span>{formatINR(duties)}</span></div>
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t border-gold/20 pt-[18px]">
          <span className="font-serif text-lg font-medium">Total</span>
          <span className="font-mono text-[22px] font-medium text-gold">{formatINR(total)}</span>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-gold",
        className
      )}
    >
      {children}
    </div>
  );
}
