import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StoreMap } from "@/components/charts/store-map";
import { getStoresWithSignals } from "@/lib/data";

export default async function MapPage() {
  const stores = await getStoresWithSignals();
  const totalReviews = stores.reduce((sum, s) => sum + s.reviewCount, 0);
  const avgPolarity =
    stores.length > 0
      ? stores.reduce((sum, s) => sum + s.avgPolarity, 0) / stores.length
      : 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Geo Map</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {stores.length} stores · {totalReviews.toLocaleString()} reviews · global polarity {avgPolarity.toFixed(2)}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Store sentiment worldwide</CardTitle>
        </CardHeader>
        <CardContent>
          <StoreMap stores={stores} />
        </CardContent>
      </Card>
    </div>
  );
}
