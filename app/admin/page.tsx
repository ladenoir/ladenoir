import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getKpiWindowCutoffs } from "@/lib/queries";
import { formatINR } from "@/lib/types";
import AdminDashboard, {
  type AdminData,
  type AdminCustomer,
  type AdminProduct,
} from "./AdminDashboard";

type OrderStatus = "Paid" | "Fulfilled" | "Shipped" | "Pending" | "Refunded";

const compactINR = (rupees: number) => {
  if (rupees >= 100000) return "₹" + (rupees / 100000).toFixed(1) + "L";
  if (rupees >= 1000) return "₹" + (rupees / 1000).toFixed(1) + "K";
  return "₹" + rupees;
};

const stockTone = (n: number): AdminProduct["stockTone"] =>
  n === 0 ? "red" : n <= 8 ? "amber" : "green";

const stockLabel = (n: number) =>
  n === 0 ? "0 sold out" : n <= 8 ? `${n} low` : `${n} in stock`;

const tierFor = (spent: number, orders: number): AdminCustomer["tier"] =>
  spent >= 150000 || orders >= 6 ? "VIP" : orders >= 2 ? "Member" : "New";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // gate: admins only
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = !!profile?.is_admin;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6 text-center text-cream">
        <div>
          <div className="font-mono text-[9px] tracking-[0.42em] text-cream/50">
            LA DE
          </div>
          <div className="font-serif text-[28px] font-semibold tracking-[0.24em] text-gold">
            NOIR
          </div>
          <div className="mt-1 font-mono text-[8.5px] tracking-[0.24em] text-cream/40">
            ADMIN CONSOLE
          </div>
        </div>
        <p className="max-w-sm font-mono text-xs leading-relaxed text-cream/55">
          {user
            ? "This account doesn't have admin access."
            : "Sign in with an admin account to open the console."}
        </p>
        <Link
          href="/account"
          className="bg-gold px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink-deep transition-colors hover:bg-cream"
        >
          {user ? "Switch account →" : "Sign in →"}
        </Link>
      </div>
    );
  }

  // ---- live data ----
  const [{ data: productRows }, { data: orderRows }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "slug,name,price_inr,stock,status,sold_count,image_url,category:categories(name)"
      )
      .order("created_at", { ascending: true }),
    supabase
      .from("orders")
      .select(
        "order_no,email,full_name,city,state,total_inr,status,created_at,order_items(qty)"
      )
      .order("created_at", { ascending: false }),
  ]);

  const products = productRows ?? [];
  const orders = orderRows ?? [];

  // KPIs
  const { last7: cutoff7, last30: cutoff30 } = getKpiWindowCutoffs();
  const in30 = (iso: string) => new Date(iso).getTime() >= cutoff30;
  const last30 = orders.filter((o) => in30(o.created_at));
  const revenue30 = last30.reduce((n, o) => n + (o.total_inr ?? 0), 0);
  const avgOrder = last30.length ? Math.round(revenue30 / last30.length) : 0;

  const kpis = [
    { label: "Revenue (30d)", value: compactINR(revenue30), delta: `${last30.length} orders` },
    { label: "Orders", value: String(orders.length), delta: "all time" },
    { label: "Avg. order", value: avgOrder ? compactINR(avgOrder) : "—", delta: "last 30 days" },
    { label: "Catalogue", value: String(products.length), delta: `${products.filter((p) => p.status === "Live").length} live` },
  ];

  // 7-day revenue chart (Mon→Sun), scaled to % of max
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  orders.forEach((o) => {
    const d = new Date(o.created_at);
    if (d.getTime() >= cutoff7) {
      const idx = (d.getDay() + 6) % 7; // Mon=0
      dayTotals[idx] += o.total_inr ?? 0;
    }
  });
  const maxDay = Math.max(1, ...dayTotals);
  const chart = dayTotals.map((v) => Math.max(6, Math.round((v / maxDay) * 100)));

  // top pieces by sold_count
  const topProducts = [...products]
    .sort((a, b) => (b.sold_count ?? 0) - (a.sold_count ?? 0))
    .slice(0, 4)
    .map((p) => ({
      name: p.name,
      sold: p.sold_count ?? 0,
      rev: compactINR((p.sold_count ?? 0) * (p.price_inr ?? 0)),
      img: p.image_url ?? "",
    }));

  // admin orders table
  const adminOrders = orders.map((o) => ({
    id: `#${o.order_no}`,
    customer: o.full_name || o.email,
    email: o.email,
    items: `${(o.order_items ?? []).reduce((n, it) => n + (it.qty ?? 0), 0)} items`,
    date: new Date(o.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    total: formatINR(o.total_inr ?? 0),
    status: (o.status as OrderStatus) ?? "Paid",
  }));

  // admin products table
  const adminProducts: AdminProduct[] = products.map((p) => ({
    name: p.name,
    cat:
      (Array.isArray(p.category) ? p.category[0]?.name : (p.category as { name?: string } | null)?.name) ??
      "—",
    price: formatINR(p.price_inr ?? 0),
    stock: stockLabel(p.stock ?? 0),
    stockTone: stockTone(p.stock ?? 0),
    status: (p.status as AdminProduct["status"]) ?? "Live",
    img: p.image_url ?? "",
  }));

  // customers aggregated from orders
  const byEmail = new Map<
    string,
    { name: string; email: string; location: string; orders: number; spent: number }
  >();
  orders.forEach((o) => {
    const key = o.email;
    const loc = [o.city, o.state].filter(Boolean).join(", ") || "—";
    const ex = byEmail.get(key);
    if (ex) {
      ex.orders += 1;
      ex.spent += o.total_inr ?? 0;
      if (loc !== "—" && ex.location === "—") ex.location = loc;
    } else {
      byEmail.set(key, {
        name: o.full_name || o.email,
        email: o.email,
        location: loc,
        orders: 1,
        spent: o.total_inr ?? 0,
      });
    }
  });
  const customers: AdminCustomer[] = [...byEmail.values()]
    .sort((a, b) => b.spent - a.spent)
    .map((c) => ({
      name: c.name,
      email: c.email,
      location: c.location,
      orders: String(c.orders),
      spent: compactINR(c.spent),
      tier: tierFor(c.spent, c.orders),
    }));

  const data: AdminData = {
    kpis,
    chart,
    topProducts,
    orders: adminOrders,
    products: adminProducts,
    customers,
    adminName:
      (user!.user_metadata?.full_name as string | undefined) ??
      user!.email ??
      "Admin",
  };

  return <AdminDashboard data={data} />;
}
