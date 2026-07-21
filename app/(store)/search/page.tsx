import { getProducts } from "@/lib/queries";
import { SearchClient } from "./SearchClient";

export const metadata = { title: "Search · La De Noir" };

export default async function SearchPage() {
  const products = await getProducts();
  return <SearchClient products={products} />;
}
