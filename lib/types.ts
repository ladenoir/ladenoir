export type Category = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string | null;
  price_inr: number;
  tag: string | null;
  image_url: string | null;
  images: string[];
  sizes: string[];
  stock: number;
  status: string;
  featured: boolean;
  sold_count: number;
  created_at: string;
  updated_at: string;
  // joined
  category?: Category | null;
};

export const formatINR = (rupees: number) =>
  "₹" + rupees.toLocaleString("en-IN");
