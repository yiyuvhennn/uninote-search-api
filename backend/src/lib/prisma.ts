import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import { resolvePrismaSqliteUrl } from "./sqlitePath";

const adapter = new PrismaBetterSQLite3({
  url: resolvePrismaSqliteUrl(process.env.DATABASE_URL!),
});

export const prisma = new PrismaClient({ adapter });
