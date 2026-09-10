import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!product) return notFound();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, name, sell_price")
    .eq("product_id", product.id)
    .eq("is_active", true)
    .order("sort_order");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-2xl font-bold">{product.name}</h1>
      <p className="mt-1 text-ink-muted dark:text-ink-mutedDark">{product.description}</p>

      <div className="mt-8 rounded-xl2 border border-borderc dark:border-borderc-dark bg-surface dark:bg-surface-dark p-6">
        <CheckoutClient product={product} variants={variants || []} isLoggedIn={!!user} />
      </div>
    </div>
  );
}
