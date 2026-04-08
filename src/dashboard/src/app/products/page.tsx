import Link from "next/link";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProducts } from "@/lib/data";

const SOURCE_LABEL: Record<string, string> = {
  google_merchant: "Google",
  trustpilot: "Trustpilot",
  instagram: "Instagram",
  tiktok: "TikTok",
  reddit: "Reddit",
};

function polarityVariant(p: number) {
  if (p >= 0.2) return "success" as const;
  if (p <= -0.2) return "danger" as const;
  return "warning" as const;
}

export default async function ProductsPage() {
  const products = await getProducts();
  const totalReviews = products.reduce((sum, p) => sum + p.reviewCount, 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {products.length} Zara products · {totalReviews} reviews across Google Merchant,
          Trustpilot, Instagram, TikTok and Reddit.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.code}`}
            className="group"
          >
            <Card className="flex h-full flex-col gap-4 p-0 transition-shadow group-hover:shadow-md">
              {/* Product swatch — colored gradient stand-in for a product image */}
              <div
                className="relative h-36 w-full rounded-t-2xl"
                style={{
                  background: `linear-gradient(135deg, ${p.color ?? "#d4d4d4"} 0%, #0f0f0f 180%)`,
                }}
              >
                <div className="absolute left-4 top-4">
                  <Badge variant="default" className="uppercase tracking-wide">
                    {p.category}
                  </Badge>
                </div>
                <div className="absolute bottom-4 right-4 text-lg font-semibold text-white drop-shadow-md">
                  {p.priceEur ? `€${p.priceEur.toFixed(2)}` : ""}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 px-5 pb-5">
                <div>
                  <h3 className="font-semibold tracking-tight group-hover:underline">
                    {p.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {p.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium tabular-nums">
                      {p.avgRating !== null ? p.avgRating.toFixed(2) : "—"}
                    </span>
                    <span className="text-neutral-500">· {p.reviewCount} reviews</span>
                  </div>
                  <Badge variant={polarityVariant(p.avgPolarity)}>
                    {p.avgPolarity.toFixed(2)}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {p.sources.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
                    >
                      {SOURCE_LABEL[s] ?? s}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
