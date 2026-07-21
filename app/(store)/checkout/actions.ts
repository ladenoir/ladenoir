"use server";

import { createClient } from "@/lib/supabase/server";

export type CheckoutPayload = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  method: string;
  items: { slug: string; size: string; qty: number }[];
};

export type PlaceOrderResult = { orderNo?: string; error?: string };

export async function placeOrder(
  payload: CheckoutPayload
): Promise<PlaceOrderResult> {
  if (!payload.items.length) return { error: "Your bag is empty." };
  if (!payload.email) return { error: "Email is required." };

  const supabase = await createClient();

  // atomic, price-authoritative order placement (SECURITY DEFINER RPC).
  // prices are recomputed server-side from the live catalogue — client totals are ignored.
  const { data, error } = await supabase.rpc("place_order", {
    p_email: payload.email,
    p_full_name: `${payload.firstName} ${payload.lastName}`.trim(),
    p_address: payload.address || null,
    p_city: payload.city || null,
    p_state: payload.state || null,
    p_pin: payload.pin || null,
    p_method: payload.method,
    p_items: payload.items,
  });

  if (error) return { error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.order_no) return { error: "Order could not be placed." };

  return { orderNo: row.order_no };
}
