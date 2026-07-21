import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";
import { r2Configured } from "@/lib/r2";
import { NewProductForm } from "./NewProductForm";

export const metadata = { title: "New product · La De Noir Admin" };

export default async function NewProductPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = !!profile?.is_admin;
  }
  if (!isAdmin) redirect("/admin");

  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-ink px-6 py-10 text-cream sm:px-[34px]">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin"
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/55 hover:text-gold"
        >
          ← Admin
        </Link>
      </div>
      <h1 className="mb-1 font-serif text-[32px] font-medium">New product</h1>
      <p className="mb-8 font-mono text-[11px] tracking-[0.06em] text-cream/45">
        Add a piece to the catalogue.
      </p>
      <NewProductForm categories={categories} r2Ready={r2Configured()} />
    </div>
  );
}
