"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createProduct, type NewProductResult } from "./actions";
import type { Category } from "@/lib/types";

const inputCls =
  "w-full border border-gold/25 bg-ink-panel px-4 py-3 font-mono text-[13px] text-cream outline-none transition-colors focus:border-gold placeholder:text-cream/35";
const labelCls =
  "mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/55";

export function NewProductForm({
  categories,
  r2Ready,
}: {
  categories: Category[];
  r2Ready: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    NewProductResult,
    FormData
  >(createProduct, {});

  useEffect(() => {
    if (state.ok) router.push("/admin");
  }, [state.ok, router]);

  return (
    <form action={formAction} className="max-w-2xl">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Product name</label>
          <input name="name" required placeholder="Panthère Overcoat" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Category</label>
          <select name="category_id" className={inputCls} defaultValue="">
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Price (₹)</label>
          <input name="price_inr" type="number" min="0" required placeholder="32000" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Stock</label>
          <input name="stock" type="number" min="0" defaultValue={0} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Tag</label>
          <input name="tag" placeholder="New / Icon / Drop" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <select name="status" className={inputCls} defaultValue="Live">
            <option value="Live">Live</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Sizes (comma-separated)</label>
          <input name="sizes" defaultValue="S, M, L, XL" className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>
            Product image{" "}
            {r2Ready ? (
              <span className="text-status-green">· R2 ready</span>
            ) : (
              <span className="text-status-amber">
                · R2 not configured — paste a URL below instead
              </span>
            )}
          </label>
          <input
            name="image"
            type="file"
            accept="image/*"
            disabled={!r2Ready}
            className="w-full border border-gold/25 bg-ink-panel px-4 py-3 font-mono text-xs text-cream/70 file:mr-3 file:border-0 file:bg-gold file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:font-bold file:uppercase file:text-noir-deep disabled:opacity-50"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>…or image URL</label>
          <input name="image_url" placeholder="https://…" className={inputCls} />
        </div>
      </div>

      {state.error && (
        <div className="mt-5 border border-status-red/40 bg-status-red/10 px-4 py-2.5 font-mono text-[11px] text-status-red">
          {state.error}
        </div>
      )}

      <div className="mt-7 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-gold px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-noir-deep transition-colors hover:bg-cream disabled:opacity-60"
        >
          {pending ? "Saving…" : "Create product"}
        </button>
        <Link
          href="/admin"
          className="border border-gold/30 px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/70 transition-colors hover:border-gold hover:text-gold"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
