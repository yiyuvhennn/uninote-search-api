import { rmSync } from "node:fs";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

type TestApp = Awaited<typeof import("../app")>["default"];
type TestPrisma = Awaited<typeof import("../lib/prisma")>["prisma"];

let app: TestApp;
let prisma: TestPrisma;
let tokenA = "";
let tokenB = "";
let aPublicNoteId = 0;
let aPrivateNoteId = 0;
let bPublicNoteId = 0;
let bPrivateNoteId = 0;

const password = "123456";

function createTextPdfBuffer(text: string) {
  const escapedText = text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];
  const stream = `BT\n/F1 24 Tf\n72 720 Td\n(${escapedText}) Tj\nET`;
  objects.push(
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj\n`
  );

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += object;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf);
}

async function createTestSchema(db: TestPrisma) {
  await db.$executeRawUnsafe("PRAGMA foreign_keys=ON");
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Note" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "content" TEXT,
      "searchText" TEXT,
      "fileUrl" TEXT NOT NULL,
      "course" TEXT NOT NULL,
      "category" TEXT,
      "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
      "views" INTEGER NOT NULL DEFAULT 0,
      "likes" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      "authorId" INTEGER NOT NULL,
      CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Tag" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL UNIQUE
    )
  `);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NoteTag" (
      "noteId" INTEGER NOT NULL,
      "tagId" INTEGER NOT NULL,
      PRIMARY KEY ("noteId", "tagId"),
      CONSTRAINT "NoteTag_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "NoteTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Favorite" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "userId" INTEGER NOT NULL,
      "noteId" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Favorite_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Note_course_idx" ON "Note"("course")`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Note_category_idx" ON "Note"("category")`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Note_createdAt_idx" ON "Note"("createdAt")`);
  await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_noteId_key" ON "Favorite"("userId", "noteId")`);
}

async function registerAndLogin(email: string, name: string) {
  await request(app).post("/auth/register").send({
    name,
    email,
    password,
  });

  const loginRes = await request(app).post("/auth/login").send({
    email,
    password,
  });

  return loginRes.body.token as string;
}

async function createNote(
  token: string,
  title: string,
  visibility: "PUBLIC" | "PRIVATE"
) {
  const res = await request(app)
    .post("/notes")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title,
      description: `${title} description`,
      content: `${title} searchable content`,
      fileUrl: `https://example.com/${encodeURIComponent(title)}.pdf`,
      course: "Integration Test",
      category: "Visibility",
      visibility,
    });

  expect(res.status).toBe(201);
  return res.body.note as { id: number; title: string; visibility: string };
}

async function searchAs(
  token: string,
  q: string,
  scope: "all" | "mine" | "public" = "all"
) {
  return request(app)
    .get("/search")
    .set("Authorization", `Bearer ${token}`)
    .query({ q, scope, sort: "relevance", page: 1, pageSize: 20 });
}

function titlesFromSearch(res: request.Response) {
  return (res.body.data as Array<{ title: string }>).map((note) => note.title);
}

function titlesFromNotes(res: request.Response) {
  return (res.body as Array<{ title: string }>).map((note) => note.title);
}

function titlesFromFavorites(res: request.Response) {
  return (res.body as Array<{ note: { title: string } }>).map(
    (favorite) => favorite.note.title
  );
}

async function uploadPdfNote(
  token: string,
  title: string,
  pdfText: string,
  visibility: "PUBLIC" | "PRIVATE"
) {
  const res = await request(app)
    .post("/notes/upload-pdf")
    .set("Authorization", `Bearer ${token}`)
    .field("title", title)
    .field("course", "Integration Test")
    .field("category", "PDF Visibility")
    .field("tags", "pdf,visibility")
    .field("visibility", visibility)
    .attach("file", createTextPdfBuffer(pdfText), {
      filename: `${title}.pdf`,
      contentType: "application/pdf",
    });

  expect(res.status).toBe(201);
  return res.body.note as { id: number; title: string; visibility: string };
}

async function uploadPdfFileForTest(options: {
  token: string;
  title: string;
  filename: string;
  contentType: string;
  buffer: Buffer;
  visibility?: "PUBLIC" | "PRIVATE";
}) {
  return request(app)
    .post("/notes/upload-pdf")
    .set("Authorization", `Bearer ${options.token}`)
    .field("title", options.title)
    .field("course", "Integration Test")
    .field("category", "PDF Hardening")
    .field("tags", "pdf,hardening")
    .field("visibility", options.visibility ?? "PUBLIC")
    .attach("file", options.buffer, {
      filename: options.filename,
      contentType: options.contentType,
    });
}

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "file:./test.db";
  process.env.JWT_SECRET = "integration_test_secret";
  process.env.FRONTEND_URL = "http://localhost:5173";

  rmSync(path.resolve(process.cwd(), "prisma", "test.db"), {
    force: true,
  });

  prisma = (await import("../lib/prisma")).prisma;
  await createTestSchema(prisma);
  app = (await import("../app")).default;

  await prisma.favorite.deleteMany();
  await prisma.noteTag.deleteMany();
  await prisma.note.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  tokenA = await registerAndLogin("visibility-a@test.com", "Visibility A");
  tokenB = await registerAndLogin("visibility-b@test.com", "Visibility B");

  aPublicNoteId = (await createNote(tokenA, "scope-rule-a-public", "PUBLIC")).id;
  aPrivateNoteId = (await createNote(tokenA, "scope-rule-a-private", "PRIVATE")).id;
  bPublicNoteId = (await createNote(tokenB, "scope-rule-b-public", "PUBLIC")).id;
  bPrivateNoteId = (await createNote(tokenB, "scope-rule-b-private", "PRIVATE")).id;
  await createNote(tokenB, "cache-isolation-public", "PUBLIC");
  await createNote(tokenB, "scope-cache-shared-note", "PUBLIC");
});

afterAll(async () => {
  await prisma?.$disconnect();
});

describe("PUBLIC / PRIVATE note visibility integration", () => {
  it("GET /notes requires authentication", async () => {
    const res = await request(app).get("/notes");

    expect(res.status).toBe(401);
  });

  it("GET /search requires authentication", async () => {
    const res = await request(app).get("/search").query({ q: "scope-rule" });

    expect(res.status).toBe(401);
  });

  it("GET /notes/:id requires authentication", async () => {
    const res = await request(app).get(`/notes/${bPublicNoteId}`);

    expect(res.status).toBe(401);
  });

  it("POST /favorites requires authentication", async () => {
    const res = await request(app).post("/favorites").send({ noteId: bPublicNoteId });

    expect(res.status).toBe(401);
  });

  it("unknown routes return the shared 404 response", async () => {
    const res = await request(app).get("/unknown-security-route");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Route not found" });
  });

  it("test environment keeps auth rate limit relaxed for integration tests", async () => {
    const responses = [];

    for (let index = 0; index < 25; index += 1) {
      responses.push(
        await request(app).post("/auth/login").send({
          email: "missing-user@test.com",
          password: "wrong-password",
        })
      );
    }

    expect(responses.some((res) => res.status === 429)).toBe(false);
  });

  it("A can search B's PUBLIC note", async () => {
    const res = await searchAs(tokenA, "scope-rule-b-public");

    expect(res.status).toBe(200);
    expect(titlesFromSearch(res)).toContain("scope-rule-b-public");
  });

  it("A cannot search B's PRIVATE note", async () => {
    const res = await searchAs(tokenA, "scope-rule-b-private");

    expect(res.status).toBe(200);
    expect(titlesFromSearch(res)).not.toContain("scope-rule-b-private");
    expect(res.body.meta.total).toBe(0);
  });

  it("A can view B's PUBLIC note detail", async () => {
    const res = await request(app)
      .get(`/notes/${bPublicNoteId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("scope-rule-b-public");
  });

  it("A cannot view B's PRIVATE note detail", async () => {
    const res = await request(app)
      .get(`/notes/${bPrivateNoteId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });

  it("A cannot delete B's PUBLIC note", async () => {
    const res = await request(app)
      .delete(`/notes/${bPublicNoteId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(404);

    const note = await prisma.note.findUnique({
      where: { id: bPublicNoteId },
    });

    expect(note?.title).toBe("scope-rule-b-public");
  });

  it("A cannot favorite B's PRIVATE note", async () => {
    const res = await request(app)
      .post("/favorites")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ noteId: bPrivateNoteId });

    expect(res.status).toBe(404);
  });

  it("scope=all / mine / public returns correct visible notes", async () => {
    const allRes = await searchAs(tokenA, "scope-rule", "all");
    const mineRes = await searchAs(tokenA, "scope-rule", "mine");
    const publicRes = await searchAs(tokenA, "scope-rule", "public");

    expect(allRes.status).toBe(200);
    expect(mineRes.status).toBe(200);
    expect(publicRes.status).toBe(200);

    expect(titlesFromSearch(allRes).sort()).toEqual([
      "scope-rule-a-private",
      "scope-rule-a-public",
      "scope-rule-b-public",
    ]);
    expect(titlesFromSearch(mineRes).sort()).toEqual([
      "scope-rule-a-private",
      "scope-rule-a-public",
    ]);
    expect(titlesFromSearch(publicRes).sort()).toEqual([
      "scope-rule-a-public",
      "scope-rule-b-public",
    ]);
  });

  it("GET /notes?scope=all returns A notes and public notes only", async () => {
    const res = await request(app)
      .get("/notes")
      .set("Authorization", `Bearer ${tokenA}`)
      .query({ scope: "all", keyword: "scope-rule" });

    expect(res.status).toBe(200);
    expect(titlesFromNotes(res).sort()).toEqual([
      "scope-rule-a-private",
      "scope-rule-a-public",
      "scope-rule-b-public",
    ]);
  });

  it("GET /notes?scope=mine returns only A notes", async () => {
    const res = await request(app)
      .get("/notes")
      .set("Authorization", `Bearer ${tokenA}`)
      .query({ scope: "mine", keyword: "scope-rule" });

    expect(res.status).toBe(200);
    expect(titlesFromNotes(res).sort()).toEqual([
      "scope-rule-a-private",
      "scope-rule-a-public",
    ]);
  });

  it("GET /notes?scope=public returns only public notes", async () => {
    const res = await request(app)
      .get("/notes")
      .set("Authorization", `Bearer ${tokenA}`)
      .query({ scope: "public", keyword: "scope-rule" });

    expect(res.status).toBe(200);
    expect(titlesFromNotes(res).sort()).toEqual([
      "scope-rule-a-public",
      "scope-rule-b-public",
    ]);
  });

  it("A can favorite B's PUBLIC note", async () => {
    const res = await request(app)
      .post("/favorites")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ noteId: bPublicNoteId });

    expect(res.status).toBe(201);
    expect(res.body.favorite.noteId).toBe(bPublicNoteId);
  });

  it("A GET /favorites includes B's PUBLIC note", async () => {
    const res = await request(app)
      .get("/favorites")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(titlesFromFavorites(res)).toContain("scope-rule-b-public");
  });

  it("A GET /favorites does not include B's PRIVATE note", async () => {
    const res = await request(app)
      .get("/favorites")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(titlesFromFavorites(res)).not.toContain("scope-rule-b-private");
  });

  it("B's favorites do not appear in A's favorite list", async () => {
    await request(app)
      .post("/favorites")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ noteId: aPublicNoteId })
      .expect(201);

    const res = await request(app)
      .get("/favorites")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(titlesFromFavorites(res)).not.toContain("scope-rule-a-public");
  });

  it("A can delete A's own favorite", async () => {
    const deleteRes = await request(app)
      .delete(`/favorites/${bPublicNoteId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(deleteRes.status).toBe(200);

    const favoritesRes = await request(app)
      .get("/favorites")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(titlesFromFavorites(favoritesRes)).not.toContain("scope-rule-b-public");
  });

  it("A can still favorite B's PUBLIC note after deleting the favorite", async () => {
    const res = await request(app)
      .post("/favorites")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ noteId: bPublicNoteId });

    expect(res.status).toBe(201);
  });

  it("B PUBLIC PDF note is searchable by A", async () => {
    await uploadPdfNote(
      tokenB,
      "pdf-public-b-note",
      "pdf-public-keyword-readable",
      "PUBLIC"
    );

    const res = await searchAs(tokenA, "pdf-public-keyword-readable", "all");

    expect(res.status).toBe(200);
    expect(titlesFromSearch(res)).toContain("pdf-public-b-note");
  });

  it("B PRIVATE PDF note is not searchable by A", async () => {
    await uploadPdfNote(
      tokenB,
      "pdf-private-b-note",
      "pdf-private-keyword-readable",
      "PRIVATE"
    );

    const res = await searchAs(tokenA, "pdf-private-keyword-readable", "all");

    expect(res.status).toBe(200);
    expect(titlesFromSearch(res)).not.toContain("pdf-private-b-note");
    expect(res.body.meta.total).toBe(0);
  });

  it("B can search B's own PRIVATE PDF note", async () => {
    const res = await searchAs(tokenB, "pdf-private-keyword-readable", "all");

    expect(res.status).toBe(200);
    expect(titlesFromSearch(res)).toContain("pdf-private-b-note");
  });

  it("text PDF upload succeeds and records a sanitized fileUrl", async () => {
    const res = await uploadPdfFileForTest({
      token: tokenA,
      title: "pdf-hardening-success-note",
      filename: "Unsafe PDF Name (2026).PDF",
      contentType: "application/pdf",
      buffer: createTextPdfBuffer("pdf-hardening-success-keyword"),
    });

    expect(res.status).toBe(201);
    expect(res.body.note.fileUrl).toMatch(
      /^uploaded-pdf:\d+-Unsafe-PDF-Name-2026\.pdf$/
    );

    const searchRes = await searchAs(tokenA, "pdf-hardening-success-keyword", "all");
    expect(titlesFromSearch(searchRes)).toContain("pdf-hardening-success-note");
  });

  it(".txt upload is rejected and does not create a searchable note", async () => {
    const res = await uploadPdfFileForTest({
      token: tokenA,
      title: "pdf-hardening-txt-note",
      filename: "not-a-pdf.txt",
      contentType: "application/pdf",
      buffer: createTextPdfBuffer("pdf-hardening-txt-keyword"),
    });

    expect(res.status).toBe(400);

    const searchRes = await searchAs(tokenA, "pdf-hardening-txt-keyword", "all");
    expect(titlesFromSearch(searchRes)).not.toContain("pdf-hardening-txt-note");
  });

  it("fake .pdf content is rejected by magic number and does not create a note", async () => {
    const res = await uploadPdfFileForTest({
      token: tokenA,
      title: "pdf-hardening-fake-note",
      filename: "fake.pdf",
      contentType: "application/pdf",
      buffer: Buffer.from("not a real pdf pdf-hardening-fake-keyword"),
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("偽裝成 PDF");

    const searchRes = await searchAs(tokenA, "pdf-hardening-fake-keyword", "all");
    expect(titlesFromSearch(searchRes)).not.toContain("pdf-hardening-fake-note");
  });

  it("wrong PDF mimetype is rejected and does not create a note", async () => {
    const res = await uploadPdfFileForTest({
      token: tokenA,
      title: "pdf-hardening-mime-note",
      filename: "wrong-mime.pdf",
      contentType: "text/plain",
      buffer: createTextPdfBuffer("pdf-hardening-mime-keyword"),
    });

    expect(res.status).toBe(400);

    const searchRes = await searchAs(tokenA, "pdf-hardening-mime-keyword", "all");
    expect(titlesFromSearch(searchRes)).not.toContain("pdf-hardening-mime-note");
  });

  it("PDF without extractable text is rejected and does not create a note", async () => {
    const res = await uploadPdfFileForTest({
      token: tokenA,
      title: "pdf-hardening-empty-note",
      filename: "empty.pdf",
      contentType: "application/pdf",
      buffer: createTextPdfBuffer(""),
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("目前尚未支援掃描型 PDF");

    const note = await prisma.note.findFirst({
      where: { title: "pdf-hardening-empty-note" },
    });
    expect(note).toBeNull();
  });

  it("oversized PDF upload is rejected before creating a note", async () => {
    const oversizedPdf = Buffer.concat([
      Buffer.from("%PDF-1.4\n"),
      Buffer.alloc(11 * 1024 * 1024, "a"),
    ]);
    const res = await uploadPdfFileForTest({
      token: tokenA,
      title: "pdf-hardening-oversized-note",
      filename: "oversized.pdf",
      contentType: "application/pdf",
      buffer: oversizedPdf,
    });

    expect(res.status).toBe(413);

    const note = await prisma.note.findFirst({
      where: { title: "pdf-hardening-oversized-note" },
    });
    expect(note).toBeNull();
  });

  it("search cache does not leak across userId or scope", async () => {
    const firstAllA = await searchAs(tokenA, "cache-isolation-public", "all");
    const secondAllA = await searchAs(tokenA, "cache-isolation-public", "all");
    const mineA = await searchAs(tokenA, "cache-isolation-public", "mine");
    const firstAllB = await searchAs(tokenB, "cache-isolation-public", "all");

    expect(firstAllA.status).toBe(200);
    expect(secondAllA.status).toBe(200);
    expect(mineA.status).toBe(200);
    expect(firstAllB.status).toBe(200);

    expect(firstAllA.body.meta.cache).toBe("miss");
    expect(secondAllA.body.meta.cache).toBe("hit");

    expect(mineA.body.meta.cache).toBe("miss");
    expect(mineA.body.meta.total).toBe(0);

    expect(firstAllB.body.meta.cache).toBe("miss");
    expect(firstAllB.body.meta.total).toBe(1);
  });

  it("search cache isolates mine, public and user-specific public searches", async () => {
    const firstMineA = await searchAs(tokenA, "scope-cache-shared-note", "mine");
    const firstPublicA = await searchAs(tokenA, "scope-cache-shared-note", "public");
    const secondPublicA = await searchAs(tokenA, "scope-cache-shared-note", "public");
    const firstPublicB = await searchAs(tokenB, "scope-cache-shared-note", "public");
    const secondPublicB = await searchAs(tokenB, "scope-cache-shared-note", "public");

    expect(firstMineA.status).toBe(200);
    expect(firstPublicA.status).toBe(200);
    expect(secondPublicA.status).toBe(200);
    expect(firstPublicB.status).toBe(200);
    expect(secondPublicB.status).toBe(200);

    expect(firstMineA.body.meta.cache).toBe("miss");
    expect(firstMineA.body.meta.total).toBe(0);

    expect(firstPublicA.body.meta.cache).toBe("miss");
    expect(firstPublicA.body.meta.total).toBe(1);
    expect(secondPublicA.body.meta.cache).toBe("hit");

    expect(firstPublicB.body.meta.cache).toBe("miss");
    expect(firstPublicB.body.meta.total).toBe(1);
    expect(secondPublicB.body.meta.cache).toBe("hit");
  });
});
