import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { Category, Product } from "@/lib/types";

const PRODUCT_SELECT =
  "id,slug,name,description,category_id,price_inr,tag,image_url,images,sizes,stock,status,featured,sold_count,created_at,updated_at,category:categories(id,slug,name,sort_order)";

export async function getProducts(options?: {
  category?: string;
  limit?: number;
}): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "Live")
    .order("created_at", { ascending: true });

  if (options?.category && options.category !== "All") {
    // category filter by name via joined categories
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("name", options.category)
      .maybeSingle();
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "Live")
    .eq("featured", true)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

/**
 * PDP data fetch, cached across navigations/requests.
 *
 * The shared-element morph from a shop/home ProductCard into the PDP hero
 * image only fires when the navigation resolves within a single browser
 * View Transition — if `/product/[slug]`'s Supabase round trip (~500-600ms
 * uncached) is still in flight when the transition starts, Next shows
 * `loading.tsx` first, which splits the navigation into two transitions and
 * breaks React's named-ViewTransition pairing. Wrapping the query in
 * `unstable_cache` means repeat navigations to the same product — including
 * the RSC payload a hovered `<Link prefetch>` fetches ahead of the click —
 * are served from cache instead of hitting Supabase again, so the click
 * itself resolves fast enough to stay inside one transition.
 *
 * Revalidation: `revalidate: 60` bounds staleness to at most one minute
 * (each entry is independently keyed by `slug`, via unstable_cache's
 * automatic argument-based cache key). The `"products"` tag is exposed for
 * on-demand invalidation (`revalidateTag("products")`/`updateTag`) once an
 * admin edit/delete flow exists — today only product *creation* exists
 * (`app/admin/products/new/actions.ts`), which can't make an already-cached
 * product stale since the product didn't exist yet. This uses a
 * cookie-free `createPublicClient()` (see `lib/supabase/public.ts`) because
 * `unstable_cache` scopes cannot call the runtime-only `cookies()` API that
 * the request-scoped Supabase client depends on.
 */
export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<Product | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("status", "Live")
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as Product) ?? null;
  },
  ["product-by-slug"],
  { revalidate: 60, tags: ["products"] }
);

/**
 * "Complete the look" rail on the PDP. Cached for the same reason as
 * {@link getProductBySlug} — it's part of the same PDP render and its
 * latency counts against the single-transition budget.
 */
export const getRelatedProducts = unstable_cache(
  async (excludeSlug: string, limit = 4): Promise<Product[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "Live")
      .neq("slug", excludeSlug)
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as Product[];
  },
  ["related-products"],
  { revalidate: 60, tags: ["products"] }
);

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,slug,name,sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export type OrderRow = {
  id: string;
  order_no: string;
  email: string;
  full_name: string | null;
  total_inr: number;
  status: string;
  created_at: string;
  order_items: {
    id: string;
    name: string;
    size: string | null;
    qty: number;
    price_inr: number;
  }[];
};

/**
 * Cutoff timestamps (ms since epoch) for rolling KPI windows, e.g. "orders
 * placed in the last 30 days". Wrapped in React's `cache()` so every call
 * within a single request/render pass reads the clock exactly once and
 * returns the identical memoized value — render stays idempotent even
 * though a real clock read has to happen somewhere.
 */
export const getKpiWindowCutoffs = cache(function getKpiWindowCutoffs() {
  const now = Date.now();
  return {
    last7: now - 7 * 864e5,
    last30: now - 30 * 864e5,
  };
});

export async function getUserOrders(): Promise<OrderRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_no,email,full_name,total_inr,status,created_at,order_items(id,name,size,qty,price_inr)"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OrderRow[];
}
