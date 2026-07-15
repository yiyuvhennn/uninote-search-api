import { execFileSync } from "node:child_process";

const DEFAULT_TEST_DATABASE_URL =
  "postgresql://uninote:uninote_password@localhost:55432/uninote_test?schema=public";

export function setupTestEnv() {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL;
  process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;
  process.env.JWT_SECRET = "integration_test_secret";
  process.env.FRONTEND_URL = "http://localhost:5173";
}

export function resetTestDatabase() {
  setupTestEnv();

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
