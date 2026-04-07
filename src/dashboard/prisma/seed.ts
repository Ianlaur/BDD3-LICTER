// Seed script for the Zara Social Data Intelligence dashboard.
// Run with: npm run db:seed (after `prisma migrate dev`).
//
// Generates realistic-but-synthetic data so the dashboard renders end-to-end
// before the real pipeline (Apify → N8N → OpenAI → DB) is wired up.

import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, AlertLevel } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to src/dashboard/.env before seeding.");
  process.exit(1);
}
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const STORES = [
  { code: "ZAR-ES-001", name: "Zara Gran Vía", city: "Madrid", country: "ES", lat: 40.4203, lng: -3.7058 },
  { code: "ZAR-ES-002", name: "Zara Passeig de Gràcia", city: "Barcelona", country: "ES", lat: 41.3924, lng: 2.1649 },
  { code: "ZAR-FR-001", name: "Zara Champs-Élysées", city: "Paris", country: "FR", lat: 48.8698, lng: 2.3076 },
  { code: "ZAR-FR-002", name: "Zara La Part-Dieu", city: "Lyon", country: "FR", lat: 45.7606, lng: 4.8597 },
  { code: "ZAR-FR-003", name: "Zara Vieux-Port", city: "Marseille", country: "FR", lat: 43.2960, lng: 5.3699 },
  { code: "ZAR-GB-001", name: "Zara Oxford Street", city: "London", country: "GB", lat: 51.5152, lng: -0.1417 },
  { code: "ZAR-GB-002", name: "Zara Manchester Arndale", city: "Manchester", country: "GB", lat: 53.4839, lng: -2.2376 },
  { code: "ZAR-IT-001", name: "Zara Corso Vittorio", city: "Milan", country: "IT", lat: 45.4625, lng: 9.1899 },
  { code: "ZAR-IT-002", name: "Zara Via del Corso", city: "Rome", country: "IT", lat: 41.9009, lng: 12.4833 },
  { code: "ZAR-DE-001", name: "Zara Kurfürstendamm", city: "Berlin", country: "DE", lat: 52.5028, lng: 13.3289 },
  { code: "ZAR-DE-002", name: "Zara Zeil", city: "Frankfurt", country: "DE", lat: 50.1144, lng: 8.6831 },
  { code: "ZAR-NL-001", name: "Zara Kalverstraat", city: "Amsterdam", country: "NL", lat: 52.3702, lng: 4.8927 },
  { code: "ZAR-PT-001", name: "Zara Chiado", city: "Lisbon", country: "PT", lat: 38.7106, lng: -9.1421 },
  { code: "ZAR-BE-001", name: "Zara Rue Neuve", city: "Brussels", country: "BE", lat: 50.8519, lng: 4.3539 },
  { code: "ZAR-US-001", name: "Zara Fifth Avenue", city: "New York", country: "US", lat: 40.7589, lng: -73.9758 },
  { code: "ZAR-US-002", name: "Zara Michigan Avenue", city: "Chicago", country: "US", lat: 41.8954, lng: -87.6243 },
  { code: "ZAR-MX-001", name: "Zara Polanco", city: "Mexico City", country: "MX", lat: 19.4326, lng: -99.1936 },
  { code: "ZAR-JP-001", name: "Zara Shibuya", city: "Tokyo", country: "JP", lat: 35.6595, lng: 139.7004 },
  { code: "ZAR-CN-001", name: "Zara Nanjing Road", city: "Shanghai", country: "CN", lat: 31.2353, lng: 121.4760 },
  { code: "ZAR-AE-001", name: "Zara Dubai Mall", city: "Dubai", country: "AE", lat: 25.1972, lng: 55.2796 },
];

const REVIEW_SOURCES = ["trustpilot", "google", "reddit", "tiktok", "instagram"] as const;

const POSITIVE_PHRASES = [
  "Loved the staff, very helpful and friendly.",
  "Great selection this season, found exactly what I wanted.",
  "Fast checkout, no queue at all.",
  "Fitting rooms were clean and well organised.",
  "The new collection is stunning, on-trend pieces everywhere.",
];

const NEGATIVE_PHRASES = [
  "Queue at the fitting room was endless, gave up after 20 minutes.",
  "Staff ignored me at the till, very rude experience.",
  "Quality is going downhill — the seams came apart after one wash.",
  "Return policy is a nightmare, they refused without a receipt.",
  "Stock was a mess, couldn't find my size anywhere.",
];

const NEUTRAL_PHRASES = [
  "Standard Zara experience, nothing special.",
  "Store was busy but manageable.",
  "Found what I needed, checkout took a few minutes.",
  "Decent collection but a bit pricey.",
];

const TOPICS = [
  "fitting room",
  "staff",
  "queue",
  "quality",
  "returns",
  "stock",
  "fitting",
  "collection",
  "price",
  "checkout",
];

const PRODUCT_CATEGORIES = ["tops", "bottoms", "outerwear", "dresses", "knitwear", "accessories"];

const COMPETITORS = ["H&M", "Mango", "Uniqlo", "Shein", "COS"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("Cleaning existing data…");
  await prisma.competitive.deleteMany();
  await prisma.kpi.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.trend.deleteMany();
  await prisma.productHealth.deleteMany();
  await prisma.sentimentScore.deleteMany();
  await prisma.review.deleteMany();
  await prisma.store.deleteMany();

  console.log(`Seeding ${STORES.length} stores…`);
  const stores = await Promise.all(
    STORES.map((s) =>
      prisma.store.create({
        data: {
          ...s,
          openedAt: new Date(2000 + randomInt(0, 24), randomInt(0, 11), randomInt(1, 28)),
        },
      })
    )
  );

  console.log("Seeding ~500 reviews + sentiment scores…");
  let reviewCounter = 0;
  for (const store of stores) {
    const count = randomInt(20, 35);
    for (let i = 0; i < count; i++) {
      reviewCounter++;
      const polarity = randomFloat(-1, 1);
      const label = polarity > 0.2 ? "positive" : polarity < -0.2 ? "negative" : "neutral";
      const body =
        label === "positive"
          ? pick(POSITIVE_PHRASES)
          : label === "negative"
            ? pick(NEGATIVE_PHRASES)
            : pick(NEUTRAL_PHRASES);
      const rating = label === "positive" ? randomInt(4, 5) : label === "negative" ? randomInt(1, 2) : 3;
      const source = pick(REVIEW_SOURCES);

      await prisma.review.create({
        data: {
          source,
          externalId: `${source}-${reviewCounter}`,
          author: `user_${reviewCounter}`,
          rating,
          title: label === "negative" ? "Disappointing" : label === "positive" ? "Loved it" : "OK",
          body,
          language: pick(["en", "fr", "es", "it", "de"]),
          postedAt: daysAgo(randomInt(0, 90)),
          storeId: store.id,
          sentimentScore: {
            create: {
              storeId: store.id,
              polarity,
              confidence: randomFloat(0.6, 0.99),
              label,
              topics: [pick(TOPICS), pick(TOPICS)].filter((v, i, a) => a.indexOf(v) === i),
            },
          },
        },
      });
    }
  }
  console.log(`  → ${reviewCounter} reviews created`);

  console.log("Seeding product health…");
  const products = [
    { code: "ZW-001", name: "Linen Blazer", category: "outerwear" },
    { code: "ZW-002", name: "High-Rise Jeans", category: "bottoms" },
    { code: "ZW-003", name: "Cropped T-Shirt", category: "tops" },
    { code: "ZW-004", name: "Midi Dress", category: "dresses" },
    { code: "ZW-005", name: "Cashmere Jumper", category: "knitwear" },
    { code: "ZW-006", name: "Leather Tote", category: "accessories" },
    { code: "ZW-007", name: "Oversized Coat", category: "outerwear" },
    { code: "ZW-008", name: "Pleated Skirt", category: "bottoms" },
  ];
  await Promise.all(
    products.map((p) =>
      prisma.productHealth.create({
        data: {
          productCode: p.code,
          productName: p.name,
          category: p.category,
          healthScore: randomFloat(45, 92),
          reviewCount: randomInt(40, 350),
          averageRating: randomFloat(2.8, 4.7),
          returnRate: randomFloat(0.05, 0.32),
          topComplaints: [pick(["sizing runs small", "thin fabric", "color faded", "stitching loose"])],
          topPraises: [pick(["great fit", "soft fabric", "true to size", "stylish cut"])],
        },
      })
    )
  );

  console.log("Seeding trends…");
  const trendTopics = [
    { topic: "linen blazer", category: "product" },
    { topic: "fitting room wait", category: "service" },
    { topic: "checkout speed", category: "service" },
    { topic: "return policy", category: "service" },
    { topic: "summer collection", category: "product" },
    { topic: "size availability", category: "service" },
    { topic: "Mango comparison", category: "competitor" },
    { topic: "sustainability", category: "brand" },
  ];
  for (const t of trendTopics) {
    for (let week = 0; week < 8; week++) {
      const periodEnd = daysAgo(week * 7);
      const periodStart = daysAgo(week * 7 + 6);
      await prisma.trend.create({
        data: {
          topic: t.topic,
          category: t.category,
          mentionCount: randomInt(10, 250),
          momentum: randomFloat(-0.6, 0.8),
          sentiment: randomFloat(-0.5, 0.7),
          periodStart,
          periodEnd,
        },
      });
    }
  }

  console.log("Seeding alerts…");
  const alertSeeds: Array<{
    severity: AlertLevel;
    title: string;
    message: string;
    source: string;
    storeId?: string;
    resolved?: boolean;
  }> = [
    {
      severity: "CRITICAL",
      title: "Sentiment collapse — Paris flagship",
      message: "Polarity dropped 38% in 48h after a viral TikTok about queue times.",
      source: "sentiment_drop",
      storeId: stores.find((s) => s.code === "ZAR-FR-001")?.id,
    },
    {
      severity: "HIGH",
      title: "Return policy backlash",
      message: "Spike in negative mentions of return policy across 4 EU markets.",
      source: "spike",
    },
    {
      severity: "MEDIUM",
      title: "Rating drop — Berlin",
      message: "Average rating fell from 4.1 to 3.4 over the past week.",
      source: "rating_drop",
      storeId: stores.find((s) => s.code === "ZAR-DE-001")?.id,
    },
    {
      severity: "MEDIUM",
      title: "Stock complaints — Madrid",
      message: "Customers reporting size availability issues in the new collection.",
      source: "stock_issue",
      storeId: stores.find((s) => s.code === "ZAR-ES-001")?.id,
    },
    {
      severity: "LOW",
      title: "Competitor mention — Mango",
      message: "12% week-over-week increase in comparative mentions vs Mango.",
      source: "competitor",
      resolved: true,
    },
  ];
  await Promise.all(
    alertSeeds.map((a) =>
      prisma.alert.create({
        data: {
          severity: a.severity,
          title: a.title,
          message: a.message,
          source: a.source,
          storeId: a.storeId,
          resolved: a.resolved ?? false,
          resolvedAt: a.resolved ? daysAgo(2) : null,
          triggeredAt: daysAgo(randomInt(0, 7)),
        },
      })
    )
  );

  console.log("Seeding KPIs…");
  const kpiNames: Array<{ name: string; unit: string; min: number; max: number }> = [
    { name: "brand_health", unit: "score", min: 60, max: 80 },
    { name: "nps", unit: "score", min: 10, max: 45 },
    { name: "review_volume", unit: "count", min: 800, max: 2200 },
    { name: "avg_rating", unit: "score", min: 3.4, max: 4.4 },
    { name: "negative_share", unit: "%", min: 18, max: 38 },
  ];
  const periodEnd = new Date();
  const periodStart = daysAgo(30);
  await Promise.all(
    kpiNames.map((k) =>
      prisma.kpi.create({
        data: {
          name: k.name,
          value: randomFloat(k.min, k.max),
          unit: k.unit,
          delta: randomFloat(-0.15, 0.15),
          periodStart,
          periodEnd,
        },
      })
    )
  );

  console.log("Seeding competitive benchmarks…");
  const compMetrics = ["brand_health", "sentiment", "share_of_voice"];
  for (const competitor of COMPETITORS) {
    for (const metric of compMetrics) {
      await prisma.competitive.create({
        data: {
          competitor,
          metric,
          zaraValue: randomFloat(40, 85),
          competitorValue: randomFloat(35, 80),
          unit: metric === "share_of_voice" ? "%" : "score",
          periodStart,
          periodEnd,
        },
      });
    }
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
