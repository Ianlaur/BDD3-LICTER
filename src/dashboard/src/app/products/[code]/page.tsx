import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Star } from "lucide-react";
import { KpiTile } from "@/components/kpi-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProductDetail } from "@/lib/data";

const SOURCE_LABEL: Record<string, string> = {
  google_merchant: "Google Merchant",
  trustpilot: "Trustpilot",
  instagram: "Instagram",
  tiktok: "TikTok",
  reddit: "Reddit",
};

function sentimentVariant(label: string | null | undefined) {
  if (label === "positive") return "success" as const;
  if (label === "negative") return "danger" as const;
  return "neutral" as const;
}

function polarityVariant(p: number) {
  if (p >= 0.2) return "success" as const;
  if (p <= -0.2) return "danger" as const;
  return "warning" as const;
}

function ratingStars(rating: number | null) {
  if (rating === null) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < rating
              ? "h-3.5 w-3.5 fill-amber-400 text-amber-400"
              : "h-3.5 w-3.5 text-neutral-300 dark:text-neutral-700"
          }
        />
      ))}
    </div>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const detail = await getProductDetail(code);
  if (!detail) notFound();

  const { product, reviews, stats, sources } = detail;

  // Group reviews by source for the tabs-like section.
  const reviewsBySource = new Map<string, typeof reviews>();
  for (const r of reviews) {
    const existing = reviewsBySource.get(r.source) ?? [];
    existing.push(r);
    reviewsBySource.set(r.source, existing);
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-3 w-3" />
          All products
        </Link>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
          <div
            className="h-48 w-full rounded-2xl md:h-full"
            style={{
              background: `linear-gradient(135deg, ${product.color ?? "#d4d4d4"} 0%, #0f0f0f 180%)`,
            }}
          />
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              <Badge variant="info">{product.code}</Badge>
              <Badge variant="neutral" className="uppercase">
                {product.category}
              </Badge>
              {product.priceEur && (
                <span className="text-xl font-semibold tabular-nums">
                  €{product.priceEur.toFixed(2)}
                </span>
              )}
            </div>
            {product.description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {product.description}
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiTile label="Reviews" value={stats.reviewCount.toString()} />
        <KpiTile
          label="Avg rating"
          value={stats.avgRating !== null ? stats.avgRating.toFixed(2) : "—"}
          hint="out of 5"
        />
        <KpiTile
          label="Avg sentiment"
          value={stats.avgPolarity.toFixed(2)}
          hint="-1.0 to 1.0"
        />
        <KpiTile
          label="Negative share"
          value={`${(stats.negativeShare * 100).toFixed(0)}%`}
          invertDelta
        />
      </section>

      {/* Per-source breakdown card */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Signal by source</CardTitle>
            <Badge variant="info">{sources.length} sources</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {sources.map((s) => (
                <div
                  key={s.source}
                  className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
                >
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    {SOURCE_LABEL[s.source] ?? s.source}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-semibold tabular-nums">
                      {s.avgRating.toFixed(2)}
                    </span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-neutral-500">· {s.count}</span>
                  </div>
                  <Badge className="mt-2" variant={polarityVariant(s.avgPolarity)}>
                    polarity {s.avgPolarity.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Reviews grouped by source */}
      <section className="space-y-6">
        {Array.from(reviewsBySource.entries()).map(([source, items]) => (
          <Card key={source} className="p-0">
            <CardHeader className="mb-0 border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
              <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {SOURCE_LABEL[source] ?? source}
              </CardTitle>
              <Badge variant="default">{items.length} reviews</Badge>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {items.map((review) => (
                  <li key={review.id} className="space-y-2 px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {review.author ?? "Anonymous"}
                        </span>
                        {ratingStars(review.rating)}
                      </div>
                      <time className="text-xs text-neutral-500">
                        {format(review.postedAt, "MMM d, yyyy")}
                      </time>
                    </div>
                    <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                      {review.body}
                    </p>
                    {review.label && (
                      <Badge variant={sentimentVariant(review.label)}>{review.label}</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>

      <p className="text-xs text-neutral-500 dark:text-neutral-500">
        Sentiment polarity is derived from the star rating as a stand-in until the
        analysis agent runs.
      </p>
    </div>
  );
}
