import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { ProductDetail } from "./ProductDetail";
import { ProductCard } from "@/components/store/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product ? `${product.name} · La De Noir` : "La De Noir",
    description: product?.description ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(slug, 4);

  return (
    <>
      <ViewTransition enter="slide-up" default="none">
        <ProductDetail product={product} />
      </ViewTransition>

      <section className="border-t border-gold/20 px-[5vw] pb-20 pt-16">
        <h2 className="mb-7 font-serif text-[28px] font-medium sm:text-[40px]">
          Complete the look<span className="text-gold">.</span>
        </h2>
        <div className="grid grid-cols-2 gap-[22px] lg:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
