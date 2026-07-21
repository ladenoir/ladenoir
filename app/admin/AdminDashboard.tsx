"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  ClipboardList,
  Package,
  Users,
  Search,
  Bell,
  Menu,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/* ---------- types & data ---------- */

type View = "dash" | "orders" | "products" | "customers";
type OrderStatus = "Paid" | "Fulfilled" | "Shipped" | "Pending" | "Refunded";

type Order = {
  id: string;
  customer: string;
  email: string;
  items: string;
  date: string;
  total: string;
  status: OrderStatus;
};

type ProductStatus = "Live" | "Draft";
type StockTone = "green" | "amber" | "red";
type Tier = "VIP" | "Member" | "New";

export type AdminKpi = { label: string; value: string; delta: string };
export type AdminTopProduct = {
  name: string;
  sold: number;
  rev: string;
  img: string;
};
export type AdminProduct = {
  name: string;
  cat: string;
  price: string;
  stock: string;
  stockTone: StockTone;
  status: ProductStatus;
  img: string;
};
export type AdminCustomer = {
  name: string;
  email: string;
  location: string;
  orders: string;
  spent: string;
  tier: Tier;
};

export type AdminData = {
  kpis: AdminKpi[];
  chart: number[];
  topProducts: AdminTopProduct[];
  orders: Order[];
  products: AdminProduct[];
  customers: AdminCustomer[];
  adminName: string;
};

const CHART_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const NAV: { key: View; label: string; icon: typeof LayoutGrid }[] = [
  { key: "dash", label: "Dashboard", icon: LayoutGrid },
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "products", label: "Products", icon: Package },
  { key: "customers", label: "Customers", icon: Users },
];

const TITLES: Record<View, [string, string]> = {
  dash: ["Dashboard", "Welcome back, Arjun — here's the house today."],
  orders: ["Orders", "Manage, fulfil and track every order."],
  products: ["Products", "Your catalogue, stock and pricing."],
  customers: ["Customers", "The people of the house."],
};

const ORDER_FILTERS: (OrderStatus | "All")[] = ["All", "Pending", "Shipped", "Fulfilled"];

/* ---------- style helpers (tailwind class maps) ---------- */

const pillBase =
  "rounded-[2px] px-3 py-1 h-auto font-mono text-[9.5px] font-semibold tracking-[0.08em] uppercase border-0";

const STATUS_CLASSES: Record<OrderStatus, string> = {
  Paid: "bg-[rgba(122,178,120,0.16)] text-status-green",
  Fulfilled: "bg-[rgba(198,160,76,0.16)] text-status-gold",
  Shipped: "bg-[rgba(110,150,210,0.16)] text-status-blue",
  Pending: "bg-[rgba(224,158,74,0.16)] text-status-amber",
  Refunded: "bg-[rgba(224,87,74,0.16)] text-status-red",
};

const TIER_CLASSES: Record<Tier, string> = {
  VIP: "bg-[rgba(198,160,76,0.18)] text-status-gold",
  Member: "bg-[rgba(110,150,210,0.16)] text-status-blue",
  New: "bg-cream/10 text-cream/60",
};

const STOCK_TEXT: Record<StockTone, string> = {
  green: "text-status-green",
  amber: "text-status-amber",
  red: "text-status-red",
};

const productPill = (s: ProductStatus) =>
  s === "Live" ? "bg-[rgba(122,178,120,0.16)] text-status-green" : "bg-cream/10 text-cream/60";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("");

/* ---------- component ---------- */

export default function AdminDashboard({ data }: { data: AdminData }) {
  const [view, setView] = useState<View>("dash");
  const [orderFilter, setOrderFilter] = useState<(OrderStatus | "All")>("All");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [title, subtitle] = TITLES[view];
  const allOrders = data.orders;
  const orders =
    orderFilter === "All"
      ? allOrders
      : allOrders.filter((o) => o.status === orderFilter);
  const recentOrders = allOrders.slice(0, 5);
  const adminInitials = initialsOf(data.adminName) || "AN";

  const go = (v: View) => {
    setView(v);
    setMobileNavOpen(false);
  };

  const navItems = (
    <div className="flex flex-col gap-1">
      {NAV.map((n) => {
        const on = n.key === view;
        const Icon = n.icon;
        return (
          <button
            key={n.key}
            onClick={() => go(n.key)}
            className={cn(
              "flex w-full items-center gap-3 border-l-2 px-3 py-[11px] text-left text-[12.5px] font-semibold transition-all",
              on
                ? "border-gold bg-gold/15 text-gold"
                : "border-transparent text-cream/60 hover:text-cream"
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.5} />
            {n.label}
          </button>
        );
      })}
    </div>
  );

  const brand = (
    <div className="border-b border-gold/[0.12] px-2.5 pb-6">
      <div className="font-mono text-[9px] tracking-[0.42em] text-cream/50">LA DE</div>
      <div className="font-serif text-[22px] font-semibold tracking-[0.24em] text-gold">
        NOIR
      </div>
      <div className="mt-1.5 font-mono text-[8.5px] font-semibold tracking-[0.24em] text-cream/40">
        ADMIN CONSOLE
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="mt-auto flex flex-col gap-1 border-t border-gold/[0.12] pt-4">
      <Link
        href="/"
        className="flex items-center gap-3 px-3 py-[11px] font-mono text-xs tracking-[0.04em] text-cream/55 transition-colors hover:text-gold"
      >
        <ExternalLink className="size-[18px]" strokeWidth={1.5} />
        View storefront
      </Link>
      <div className="flex items-center gap-2.5 px-3 py-[11px]">
        <div className="flex size-[30px] items-center justify-center rounded-full bg-gold font-mono text-xs font-bold text-ink-deep">
          {adminInitials}
        </div>
        <div>
          <div className="text-xs font-medium text-cream">{data.adminName}</div>
          <div className="font-mono text-[10px] text-cream/40">Owner</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-ink text-cream lg:grid lg:grid-cols-[248px_1fr]">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-gold/15 bg-ink-deep px-[18px] py-[26px] lg:flex">
        {brand}
        <div className="mt-5">{navItems}</div>
        {sidebarFooter}
      </aside>

      {/* mobile sidebar */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="flex w-[248px] flex-col border-gold/15 bg-ink-deep px-[18px] py-[26px] text-cream sm:max-w-[248px]"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {brand}
          <div className="mt-5">{navItems}</div>
          {sidebarFooter}
        </SheetContent>
      </Sheet>

      {/* main */}
      <div className="flex min-w-0 flex-col">
        {/* topbar */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-5 border-b border-gold/[0.12] bg-ink/90 px-5 py-5 backdrop-blur-md sm:px-[34px]">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="text-gold lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-6" strokeWidth={1.5} />
            </button>
            <div className="min-w-0">
              <div className="truncate font-serif text-[22px] font-medium text-cream">
                {title}
              </div>
              <div className="truncate font-mono text-[11px] tracking-[0.08em] text-cream/45">
                {subtitle}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="hidden min-w-[220px] items-center gap-2 border border-gold/20 bg-ink-panel px-3.5 py-2 md:flex">
              <Search className="size-3.5 text-gold/70" />
              <Input
                placeholder="Search orders, products…"
                className="h-auto rounded-none border-0 bg-transparent p-0 font-mono text-xs text-cream shadow-none focus-visible:ring-0"
              />
            </div>
            <button className="relative flex size-10 items-center justify-center border border-gold/20 bg-ink-panel text-gold">
              <Bell className="size-[18px]" strokeWidth={1.5} />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#e0574a]" />
            </button>
          </div>
        </header>

        <div className="px-5 pb-16 pt-7 sm:px-[34px]">
          {view === "dash" && (
            <DashboardView
              kpis={data.kpis}
              chart={data.chart}
              topProducts={data.topProducts}
              recentOrders={recentOrders}
              onViewAll={() => setView("orders")}
            />
          )}
          {view === "orders" && (
            <OrdersView
              orders={orders}
              orderFilter={orderFilter}
              setOrderFilter={setOrderFilter}
            />
          )}
          {view === "products" && <ProductsView products={data.products} />}
          {view === "customers" && (
            <CustomersView customers={data.customers} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- shared bits ---------- */

function StatusBadge({ className, label }: { className: string; label: string }) {
  return <Badge className={cn(pillBase, className)}>{label}</Badge>;
}

const panel = "border border-gold/15 bg-ink-panel rounded-none";

/* ---------- Dashboard ---------- */

function DashboardView({
  kpis,
  chart,
  topProducts,
  recentOrders,
  onViewAll,
}: {
  kpis: AdminKpi[];
  chart: number[];
  topProducts: AdminTopProduct[];
  recentOrders: Order[];
  onViewAll: () => void;
}) {
  return (
    <>
      {/* KPIs */}
      <div className="mb-[26px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className={cn(panel, "gap-0 p-[22px]")}>
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/50">
              {k.label}
            </div>
            <div className="my-[10px] mb-1.5 font-serif text-[32px] font-medium text-cream">
              {k.value}
            </div>
            <div className="font-mono text-[11px] font-medium text-status-green">
              {k.delta}
            </div>
          </Card>
        ))}
      </div>

      {/* chart + top pieces */}
      <div className="mb-[26px] grid grid-cols-1 gap-[18px] lg:grid-cols-[1.6fr_1fr]">
        <Card className={cn(panel, "p-6")}>
          <div className="mb-6 flex items-baseline justify-between">
            <div className="font-serif text-lg font-medium">Revenue · last 7 days</div>
            <div className="font-mono text-xs font-medium text-gold">₹6.4L total</div>
          </div>
          <div className="flex h-[180px] items-end gap-3.5">
            {chart.map((h, i) => (
              <div
                key={i}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2.5"
              >
                <div
                  className="w-full bg-gradient-to-b from-gold to-[#8f7333] transition-[height] duration-500"
                  style={{ height: `${h}%` }}
                  title={String(h)}
                />
                <div className="font-mono text-[10px] text-cream/45">
                  {CHART_DAYS[i]}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className={cn(panel, "p-6")}>
          <div className="mb-5 font-serif text-lg font-medium">Top pieces</div>
          <div className="flex flex-col gap-4">
            {topProducts.map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className="h-[46px] w-[38px] shrink-0 overflow-hidden bg-ink-raise">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.img}
                    alt=""
                    className="size-full object-cover grayscale-[0.3]"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{p.name}</div>
                  <div className="font-mono text-[10px] text-cream/45">
                    {p.sold} sold
                  </div>
                </div>
                <div className="font-mono text-xs font-medium text-gold">{p.rev}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* recent orders */}
      <Card className={cn(panel, "gap-0 overflow-hidden p-0")}>
        <div className="flex items-center justify-between border-b border-gold/[0.12] px-6 py-5">
          <div className="font-serif text-lg font-medium">Recent orders</div>
          <button
            onClick={onViewAll}
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-gold"
          >
            View all →
          </button>
        </div>
        {/* desktop header */}
        <div className="hidden grid-cols-[1fr_1.4fr_1fr_0.9fr_0.8fr] border-b border-gold/[0.08] px-6 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-cream/40 md:grid">
          <div>Order</div>
          <div>Customer</div>
          <div>Date</div>
          <div>Total</div>
          <div>Status</div>
        </div>
        {recentOrders.map((o) => (
          <div key={o.id}>
            {/* desktop row */}
            <div className="hidden grid-cols-[1fr_1.4fr_1fr_0.9fr_0.8fr] items-center border-b border-gold/[0.06] px-6 py-4 text-[13px] md:grid">
              <div className="font-mono text-xs font-medium text-gold">{o.id}</div>
              <div>{o.customer}</div>
              <div className="font-mono text-xs text-cream/55">{o.date}</div>
              <div className="font-mono text-xs font-medium">{o.total}</div>
              <div>
                <StatusBadge className={STATUS_CLASSES[o.status]} label={o.status} />
              </div>
            </div>
            {/* mobile card */}
            <MobileOrderCard order={o} />
          </div>
        ))}
      </Card>
    </>
  );
}

/* ---------- Orders ---------- */

function OrdersView({
  orders,
  orderFilter,
  setOrderFilter,
}: {
  orders: Order[];
  orderFilter: OrderStatus | "All";
  setOrderFilter: (f: OrderStatus | "All") => void;
}) {
  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {ORDER_FILTERS.map((f) => {
          const on = f === orderFilter;
          return (
            <button
              key={f}
              onClick={() => setOrderFilter(f)}
              className={cn(
                "border px-[18px] py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-all",
                on
                  ? "border-gold bg-gold text-ink-deep"
                  : "border-gold/25 bg-transparent text-cream/70 hover:border-gold/50"
              )}
            >
              {f}
            </button>
          );
        })}
      </div>

      <Card className={cn(panel, "gap-0 overflow-hidden p-0")}>
        <div className="hidden grid-cols-[1fr_1.4fr_1.2fr_1fr_0.9fr_1fr] border-b border-gold/[0.12] px-6 py-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-cream/40 md:grid">
          <div>Order</div>
          <div>Customer</div>
          <div>Items</div>
          <div>Date</div>
          <div>Total</div>
          <div>Status</div>
        </div>
        {orders.map((o) => (
          <div key={o.id}>
            <div className="hidden cursor-pointer grid-cols-[1fr_1.4fr_1.2fr_1fr_0.9fr_1fr] items-center border-b border-gold/[0.06] px-6 py-[18px] text-[13px] transition-colors hover:bg-ink-hover md:grid">
              <div className="font-mono text-xs font-medium text-gold">{o.id}</div>
              <div>
                <div className="text-[13px] font-medium">{o.customer}</div>
                <div className="font-mono text-[10px] text-cream/40">{o.email}</div>
              </div>
              <div className="font-mono text-xs text-cream/60">{o.items}</div>
              <div className="font-mono text-xs text-cream/55">{o.date}</div>
              <div className="font-mono text-xs font-medium">{o.total}</div>
              <div>
                <StatusBadge className={STATUS_CLASSES[o.status]} label={o.status} />
              </div>
            </div>
            <MobileOrderCard order={o} showItems />
          </div>
        ))}
      </Card>
    </>
  );
}

function MobileOrderCard({ order, showItems }: { order: Order; showItems?: boolean }) {
  return (
    <div className="flex flex-col gap-2 border-b border-gold/[0.06] px-5 py-4 md:hidden">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-medium text-gold">{order.id}</span>
        <StatusBadge className={STATUS_CLASSES[order.status]} label={order.status} />
      </div>
      <div className="text-sm font-medium">{order.customer}</div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-cream/50">
        <span>{order.date}</span>
        {showItems && <span>{order.items}</span>}
        <span className="font-medium text-cream/80">{order.total}</span>
      </div>
    </div>
  );
}

/* ---------- Products ---------- */

function ProductsView({ products }: { products: AdminProduct[] }) {
  return (
    <>
      <div className="mb-5 flex justify-end">
        <Button
          render={<Link href="/admin/products/new" />}
          className="h-auto rounded-none bg-gold px-[22px] py-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink-deep hover:bg-cream"
        >
          + New product
        </Button>
      </div>

      <Card className={cn(panel, "gap-0 overflow-hidden p-0")}>
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] border-b border-gold/[0.12] px-6 py-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-cream/40 md:grid">
          <div>Product</div>
          <div>Category</div>
          <div>Price</div>
          <div>Stock</div>
          <div>Status</div>
        </div>
        {products.map((p) => (
          <div key={p.name}>
            {/* desktop */}
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center border-b border-gold/[0.06] px-6 py-3.5 transition-colors hover:bg-ink-hover md:grid">
              <div className="flex items-center gap-3.5">
                <div className="h-[52px] w-[42px] shrink-0 overflow-hidden bg-ink-raise">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt="" className="size-full object-cover grayscale-[0.3]" />
                </div>
                <div className="font-serif text-sm font-medium">{p.name}</div>
              </div>
              <div className="font-mono text-xs text-cream/60">{p.cat}</div>
              <div className="font-mono text-xs font-medium text-gold">{p.price}</div>
              <div className={cn("font-mono text-xs font-medium", STOCK_TEXT[p.stockTone])}>
                {p.stock}
              </div>
              <div>
                <StatusBadge className={productPill(p.status)} label={p.status} />
              </div>
            </div>
            {/* mobile */}
            <div className="flex items-center gap-3.5 border-b border-gold/[0.06] px-5 py-4 md:hidden">
              <div className="h-[56px] w-[46px] shrink-0 overflow-hidden bg-ink-raise">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt="" className="size-full object-cover grayscale-[0.3]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-sm font-medium">{p.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-cream/50">
                  <span>{p.cat}</span>
                  <span className="font-medium text-gold">{p.price}</span>
                  <span className={STOCK_TEXT[p.stockTone]}>{p.stock}</span>
                </div>
              </div>
              <StatusBadge className={productPill(p.status)} label={p.status} />
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

/* ---------- Customers ---------- */

function CustomersView({ customers }: { customers: AdminCustomer[] }) {
  return (
    <Card className={cn(panel, "gap-0 overflow-hidden p-0")}>
      <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr] border-b border-gold/[0.12] px-6 py-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-cream/40 md:grid">
        <div>Customer</div>
        <div>Location</div>
        <div>Orders</div>
        <div>Spent</div>
        <div>Tier</div>
      </div>
      {customers.map((c) => {
        const initials = initialsOf(c.name);
        return (
          <div key={c.email}>
            {/* desktop */}
            <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr] items-center border-b border-gold/[0.06] px-6 py-4 transition-colors hover:bg-ink-hover md:grid">
              <div className="flex items-center gap-3">
                <Initials initials={initials} />
                <div>
                  <div className="text-[13px] font-medium">{c.name}</div>
                  <div className="font-mono text-[10px] text-cream/40">{c.email}</div>
                </div>
              </div>
              <div className="font-mono text-xs text-cream/60">{c.location}</div>
              <div className="font-mono text-xs font-medium">{c.orders}</div>
              <div className="font-mono text-xs font-medium text-gold">{c.spent}</div>
              <div>
                <StatusBadge className={TIER_CLASSES[c.tier]} label={c.tier} />
              </div>
            </div>
            {/* mobile */}
            <div className="flex items-center gap-3 border-b border-gold/[0.06] px-5 py-4 md:hidden">
              <Initials initials={initials} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{c.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-cream/50">
                  <span>{c.location}</span>
                  <span>{c.orders} orders</span>
                  <span className="font-medium text-gold">{c.spent}</span>
                </div>
              </div>
              <StatusBadge className={TIER_CLASSES[c.tier]} label={c.tier} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function Initials({ initials }: { initials: string }) {
  return (
    <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full border border-gold/25 bg-ink-raise font-mono text-[11px] font-bold text-gold">
      {initials}
    </div>
  );
}
