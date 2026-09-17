import { execFileSync } from "node:child_process";
import path from "node:path";

const DEFAULT_TEST_DATABASE_URL =
  "postgresql://uninote:uninote_password@localhost:55432/uninote_test?schema=public";

export function setupTestEnv() {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL;
  process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;
  process.env.JWT_SECRET = "integration_test_secret";
  process.env.FRONTEND_URL = "http://localhost:5173";
  process.env.UPLOAD_DIR = path.resolve(process.cwd(), "uploads-test");
}

export function resetTestDatabase() {
  setupTestEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (process.env.NODE_ENV !== "test" || !databaseUrl) {
    throw new Error("Refusing to reset the database outside the test environment");
  }

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
  if (!/(^|[-_])test([-_]|$)/i.test(databaseName)) {
    throw new Error(`Refusing to reset a non-test database: ${databaseName}`);
  }

  execFileSync(
    "npx",
    ["prisma", "migrate", "reset", "--force", "--skip-seed"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      stdio: "pipe",
    }
  );
}
