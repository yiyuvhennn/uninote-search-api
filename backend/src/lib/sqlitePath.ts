import path from "node:path";

/**
 * resolvePrismaSqliteUrl
 *
 * Prisma CLI 會把 SQLite 的 file: 相對路徑視為相對 prisma/schema.prisma。
 * better-sqlite3 adapter 則會用 Node process cwd 解析路徑。
 * 這個函式把 runtime 的路徑也轉成 Prisma CLI 的規則，避免兩邊連到不同 dev.db。
 */
export function resolvePrismaSqliteUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    return databaseUrl;
  }

  const sqlitePath = databaseUrl.replace(/^file:/, "");

  if (
    sqlitePath === ":memory:" ||
    path.isAbsolute(sqlitePath)
  ) {
    return databaseUrl;
  }

  return `file:${path.resolve(process.cwd(), "prisma", sqlitePath)}`;
}
