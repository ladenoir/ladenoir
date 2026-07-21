"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthResult } from "./actions";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full border border-gold/25 bg-transparent px-4 py-[15px] font-mono text-[13px] text-cream outline-none transition-colors focus:border-gold";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const isLogin = mode === "login";
  const action = isLogin ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(
    action,
    {}
  );

  return (
    <div className="mx-auto w-full max-w-[420px]">
      {/* tabs */}
      <div className="mb-9 flex gap-[26px] border-b border-gold/20">
        {(
          [
            { key: "login", label: "Sign in" },
            { key: "register", label: "Create account" },
          ] as const
        ).map((t) => {
          const on = t.key === mode;
          return (
            <button
              key={t.key}
              onClick={() => setMode(t.key)}
              className={cn(
                "-mb-px border-b-2 pb-3.5 font-mono text-xs font-semibold uppercase tracking-[0.08em] transition-all",
                on ? "border-gold text-gold" : "border-transparent text-cream/50"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <h1 className="mb-2 font-serif text-[30px] font-medium leading-[0.95] sm:text-[42px]">
        {isLogin ? "Welcome back." : "Join the house."}
      </h1>
      <p className="mb-7 text-[13px] leading-relaxed text-cream/55">
        {isLogin
          ? "Sign in to your account to see orders and early access."
          : "Create an account for first look at every drop and invites to fittings."}
      </p>

      <form action={formAction} className="flex flex-col gap-3">
        {!isLogin && (
          <input name="full_name" placeholder="Full name" className={inputCls} />
        )}
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          className={inputCls}
        />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Password"
          className={inputCls}
        />

        {isLogin && (
          <div className="text-right">
            <span className="font-mono text-[11px] tracking-[0.06em] text-cream/55">
              Forgot password?
            </span>
          </div>
        )}

        {state.error && (
          <div className="border border-status-red/40 bg-status-red/10 px-4 py-2.5 font-mono text-[11px] text-status-red">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 bg-gold p-[17px] font-mono text-xs font-bold uppercase tracking-[0.14em] text-noir-deep transition-colors hover:bg-cream disabled:opacity-60"
        >
          {pending
            ? "…"
            : isLogin
              ? "Sign in →"
              : "Create account →"}
        </button>
      </form>

      <div className="my-[26px] flex items-center gap-4 font-mono text-[10px] tracking-[0.2em] text-cream/35">
        <span className="h-px flex-1 bg-gold/20" />
        OR
        <span className="h-px flex-1 bg-gold/20" />
      </div>
      <button
        disabled
        className="w-full border border-gold/30 p-[15px] font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/70 transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
      >
        Continue with Apple
      </button>
    </div>
  );
}
