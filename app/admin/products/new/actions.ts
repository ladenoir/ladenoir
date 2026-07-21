"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { r2Configured, uploadToR2 } from "@/lib/r2";

export type NewProductResult = { error?: string; ok?: boolean };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function createProduct(
  _prev: NewProductResult,
  formData: FormData
): Promise<NewProductResult> {
  const supabase = await createClient();

  // admin gate
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { error: "Admin access required." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  const priceInr = parseInt(String(formData.get("price_inr") ?? "0"), 10);
  if (!priceInr || priceInr < 0) return { error: "Valid price is required." };

  const slug = slugify(name);
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10) || 0;
  const tag = String(formData.get("tag") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "Live");
  const sizes = String(formData.get("sizes") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // image: R2 upload if a file is provided and R2 is configured; else fall back
  // to a pasted image URL so the flow works before R2 credentials are added.
  let imageUrl = String(formData.get("image_url") ?? "").trim() || null;
  const file = formData.get("image") as File | null;
  if (file && file.size > 0) {
    if (!r2Configured()) {
      return {
        error:
          "Image upload needs R2 configured. Add R2_* env vars, or paste an image URL instead.",
      };
    }
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const key = `products/${slug}-${Date.now()}.${ext}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      imageUrl = await uploadToR2(key, bytes, file.type || "image/jpeg");
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Upload failed." };
    }
  }

  const { error } = await supabase.from("products").insert({
    slug,
    name,
    category_id: categoryId,
    price_inr: priceInr,
    tag,
    image_url: imageUrl,
    sizes,
    stock,
    status,
  });
  if (error) {
    if (error.code === "23505")
      return { error: `A product with slug "${slug}" already exists.` };
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/shop");
  return { ok: true };
}
