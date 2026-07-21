import { createClient } from "@/lib/supabase/server";
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

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("status", "Live")
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Product) ?? null;
}

export async function getRelatedProducts(
  excludeSlug: string,
  limit = 4
): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "Live")
    .neq("slug", excludeSlug)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

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
