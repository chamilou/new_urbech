// app/products/page.js
import { redirect } from "next/navigation";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;

  const category = sp.category;
  const scope = sp.category_scope;

  // If category filter present => use canonical URL
  if (category) {
    const params = new URLSearchParams(sp);
    params.delete("category");
    params.delete("category_scope");

    const qs = params.toString();
    const dest = `/category/${category}`;
    redirect(qs ? `${dest}?${qs}` : dest);
    //redirect(qs ? `/category${category}?${qs}` : `/category${category}`);
  }

  return <ProductsClient initialCategory="" initialScope="exact" />;
}

