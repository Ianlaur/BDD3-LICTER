// Quick connectivity check using the exact same Prisma + Neon adapter the
// dashboard uses at runtime. Run with: npx tsx scripts/test-connection.ts
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const url = process.env.DATABASE_URL;
  console.log("DATABASE_URL set:", !!url);
  console.log("DATABASE_URL host:", url ? new URL(url).host : "(none)");

  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const adapter = new PrismaNeon({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  console.log("\nQuerying kpi.findMany()…");
  const kpis = await prisma.kpi.findMany();
  console.log(`✓ Got ${kpis.length} KPI rows`);
  if (kpis[0]) console.log("  Sample:", kpis[0].name, "=", kpis[0].value);

  console.log("\nQuerying store.findMany()…");
  const stores = await prisma.store.findMany({ take: 3 });
  console.log(`✓ Got ${stores.length} stores (showing 3)`);
  for (const s of stores) console.log(" -", s.name, s.city, s.country);

  await prisma.$disconnect();
  console.log("\n✓ All good. The runtime credentials and adapter work.");
}

main().catch((e) => {
  console.error("✗ Test failed:");
  console.error(e);
  process.exit(1);
});
