import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserOrders } from "@/lib/queries";
import { formatINR } from "@/lib/types";
import { AuthForm } from "./AuthForm";
import { signOut } from "./actions";

export const metadata = { title: "Account · La De Noir" };

const AUTH_IMG =
  "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=900&q=80";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="grid min-h-[560px] lg:grid-cols-2">
        {/* image */}
        <div className="relative hidden min-h-[520px] overflow-hidden bg-noir-panel lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={AUTH_IMG}
            alt="La De Noir"
            className="absolute inset-0 size-full object-cover brightness-[0.8] contrast-[1.1] grayscale"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,15,19,0.2),rgba(14,15,19,0.7))]" />
          <div className="absolute inset-x-11 bottom-11">
            <div className="font-serif text-[28px] font-normal italic leading-tight text-cream sm:text-[42px]">
              &ldquo;Members see the drop first.&rdquo;
            </div>
            <div className="mt-4 font-mono text-[11px] tracking-[0.2em] text-gold">
              — THE HOUSE OF NOIR
            </div>
          </div>
        </div>
        {/* form */}
        <div className="flex flex-col justify-center px-[6vw] py-14">
          <AuthForm />
        </div>
      </div>
    );
  }

  const orders = await getUserOrders();
  const profileName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email;

  return (
    <div className="px-[5vw] py-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-gold/20 pb-8">
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-cream/50">
            THE HOUSE OF NOIR
          </div>
          <h1 className="mt-2 font-serif text-[40px] font-medium leading-[0.95] sm:text-[56px]">
            {profileName}
          </h1>
          <div className="mt-2 font-mono text-xs text-cream/50">
            {user.email}
          </div>
        </div>
        <form action={signOut}>
          <button className="border border-gold/30 px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/70 transition-colors hover:border-gold hover:text-gold">
            Sign out
          </button>
        </form>
      </div>

      <h2 className="mb-6 font-serif text-[26px] font-medium">Order history</h2>

      {orders.length === 0 ? (
        <div className="border border-gold/15 bg-noir-panel p-10 text-center">
          <p className="font-mono text-xs tracking-[0.12em] text-cream/50">
            NO ORDERS YET
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block bg-gold px-7 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-noir-deep transition-colors hover:bg-cream"
          >
            Start shopping →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => (
            <div key={o.id} className="border border-gold/15 bg-noir-panel">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/10 px-6 py-4">
                <div className="font-mono text-xs font-medium text-gold">
                  #{o.order_no}
                </div>
                <div className="font-mono text-[11px] text-cream/50">
                  {new Date(o.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-status-green">
                  {o.status}
                </div>
                <div className="font-mono text-sm font-medium">
                  {formatINR(o.total_inr)}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 px-6 py-4 font-mono text-xs text-cream/60">
                {o.order_items.map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span>
                      {it.qty} × {it.name}
                      {it.size ? ` · ${it.size}` : ""}
                    </span>
                    <span>{formatINR(it.price_inr * it.qty)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
