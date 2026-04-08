import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Star } from "lucide-react";
import { KpiTile } from "@/components/kpi-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStoreDetail } from "@/lib/data";

function polarityVariant(p: number) {
  if (p >= 0.2) return "success" as const;
  if (p <= -0.2) return "danger" as const;
  return "warning" as const;
}

function sentimentVariant(label: string | undefined) {
  if (label === "positive") return "success" as const;
  if (label === "negative") return "danger" as const;
  return "neutral" as const;
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

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const detail = await getStoreDetail(code);
  if (!detail) notFound();

  const { store, reviews, stats } = detail;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/stores"
          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-3 w-3" />
          All stores
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{store.name}</h1>
          <Badge variant="info">{store.code}</Badge>
          <Badge variant="neutral">
            {store.city}, {store.country}
          </Badge>
        </div>
        {store.address && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{store.address}</p>
        )}
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          {store.lat.toFixed(4)}, {store.lng.toFixed(4)}
        </p>
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

      <section>
        <Card className="p-0">
          <CardHeader className="mb-0 border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              What people say
            </CardTitle>
            <Badge variant="default">{reviews.length} reviews</Badge>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {reviews.length === 0 ? (
              <p className="px-6 py-6 text-sm text-neutral-500">No reviews yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {reviews.map((review) => (
                  <li key={review.id} className="space-y-2 px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {review.author ?? "Anonymous"}
                        </span>
                        {ratingStars(review.rating)}
                        <Badge variant="neutral" className="uppercase">
                          {review.source}
                        </Badge>
                      </div>
                      <time className="text-xs text-neutral-500">
                        {format(review.postedAt, "MMM d, yyyy")}
                      </time>
                    </div>
                    <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                      {review.body}
                    </p>
                    {review.sentimentScore && (
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant={sentimentVariant(review.sentimentScore.label)}>
                          {review.sentimentScore.label}
                        </Badge>
                        <span className="text-xs text-neutral-500">
                          polarity {review.sentimentScore.polarity.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-neutral-500 dark:text-neutral-500">
        Sentiment polarity is derived from the star rating as a stand-in until the
        analysis agent runs.{" "}
        <span className={polarityVariant(stats.avgPolarity) === "success" ? "text-emerald-600" : polarityVariant(stats.avgPolarity) === "danger" ? "text-red-600" : "text-amber-600"}>
          Store avg: {stats.avgPolarity.toFixed(2)}
        </span>
      </p>
    </div>
  );
}
