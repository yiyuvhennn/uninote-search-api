import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resetTestDatabase, setupTestEnv } from "./testDb";

type TestApp = Awaited<typeof import("../app")>["default"];
type TestPrisma = Awaited<typeof import("../lib/prisma")>["prisma"];

let app: TestApp;
let prisma: TestPrisma;

const password = "123456";

async function resetData() {
  await prisma.favorite.deleteMany();
  await prisma.noteTag.deleteMany();
  await prisma.note.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
}

async function registerAndLogin(email: string, name: string, userPassword = password) {
  await request(app).post("/auth/register").send({
    name,
    email,
    password: userPassword,
  });

  const loginRes = await request(app).post("/auth/login").send({
    email,
    password: userPassword,
  });

  expect(loginRes.status).toBe(200);

  return {
    token: loginRes.body.token as string,
    user: loginRes.body.user as { id: number; name: string; email: string },
  };
}

async function createNote(
  token: string,
  title: string,
  visibility: "PUBLIC" | "PRIVATE",
  content = `${title} searchable content`
) {
  const res = await request(app)
    .post("/notes")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title,
      description: `${title} description`,
      content,
      fileUrl: `https://example.com/${encodeURIComponent(title)}.pdf`,
      course: "Account Test",
      category: "Account",
      visibility,
    });

  expect(res.status).toBe(201);
  return res.body.note as { id: number; title: string; visibility: string };
}

async function searchAs(token: string, q: string) {
  return request(app)
    .get("/search")
    .set("Authorization", `Bearer ${token}`)
    .query({ q, scope: "all", sort: "relevance", page: 1, pageSize: 20 });
}

function titlesFromSearch(res: request.Response) {
  return (res.body.data as Array<{ title: string }>).map((note) => note.title);
}

beforeAll(async () => {
  setupTestEnv();
  resetTestDatabase();
  prisma = (await import("../lib/prisma")).prisma;
  app = (await import("../app")).default;
});

afterAll(async () => {
  await prisma?.$disconnect();
});

describe("Account Settings integration", () => {
  it("GET /auth/me requires authentication", async () => {
    await resetData();

    const res = await request(app).get("/auth/me");

    expect(res.status).toBe(401);
  });

  it("GET /auth/me returns the current safe user only", async () => {
    await resetData();
    const { token, user } = await registerAndLogin("account-me@test.com", "Account Me");

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: user.id,
      name: "Account Me",
      email: "account-me@test.com",
    });
    expect(res.body.user).toHaveProperty("createdAt");
    expect(res.body.user).toHaveProperty("updatedAt");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("PATCH /auth/me requires authentication", async () => {
    await resetData();

    const res = await request(app).patch("/auth/me").send({ name: "No Token" });

    expect(res.status).toBe(401);
  });

  it("PATCH /auth/me updates only the current user's name", async () => {
    await resetData();
    const userA = await registerAndLogin("account-profile-a@test.com", "Profile A");
    const userB = await registerAndLogin("account-profile-b@test.com", "Profile B");

    const updateRes = await request(app)
      .patch("/auth/me")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        userId: userB.user.id,
        name: "Profile A Updated",
        email: "attacker-change@test.com",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.user).toMatchObject({
      id: userA.user.id,
      name: "Profile A Updated",
      email: "account-profile-a@test.com",
    });
    expect(updateRes.body.user).not.toHaveProperty("password");

    const meRes = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${userA.token}`);
    expect(meRes.body.user.name).toBe("Profile A Updated");
    expect(meRes.body.user.email).toBe("account-profile-a@test.com");

    const userBInDb = await prisma.user.findUnique({
      where: { id: userB.user.id },
    });
    expect(userBInDb?.name).toBe("Profile B");
    expect(userBInDb?.email).toBe("account-profile-b@test.com");
  });

  it("PATCH /auth/me rejects empty or too-short names", async () => {
    await resetData();
    const { token } = await registerAndLogin("account-short-name@test.com", "Short Name");

    const emptyRes = await request(app)
      .patch("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "" });
    const shortRes = await request(app)
      .patch("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "A" });

    expect(emptyRes.status).toBe(400);
    expect(shortRes.status).toBe(400);
  });

  it("PATCH /auth/me/password requires authentication", async () => {
    await resetData();

    const res = await request(app).patch("/auth/me/password").send({
      currentPassword: password,
      newPassword: "newpass1",
      confirmPassword: "newpass1",
    });

    expect(res.status).toBe(401);
  });

  it("PATCH /auth/me/password validates current password and new password fields", async () => {
    await resetData();
    const { token } = await registerAndLogin("account-password-rules@test.com", "Password Rules");

    const wrongCurrentRes = await request(app)
      .patch("/auth/me/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "wrong-password",
        newPassword: "newpass1",
        confirmPassword: "newpass1",
      });
    const mismatchRes = await request(app)
      .patch("/auth/me/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: password,
        newPassword: "newpass1",
        confirmPassword: "different",
      });
    const shortRes = await request(app)
      .patch("/auth/me/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: password,
        newPassword: "12345",
        confirmPassword: "12345",
      });

    expect(wrongCurrentRes.status).toBe(400);
    expect(mismatchRes.status).toBe(400);
    expect(shortRes.status).toBe(400);
  });

  it("PATCH /auth/me/password changes login credentials without returning password", async () => {
    await resetData();
    const email = "account-password-change@test.com";
    const { token } = await registerAndLogin(email, "Password Change");

    const updateRes = await request(app)
      .patch("/auth/me/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: password,
        newPassword: "newpass1",
        confirmPassword: "newpass1",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body).not.toHaveProperty("password");

    const oldLoginRes = await request(app).post("/auth/login").send({
      email,
      password,
    });
    const newLoginRes = await request(app).post("/auth/login").send({
      email,
      password: "newpass1",
    });

    expect(oldLoginRes.status).toBe(400);
    expect(newLoginRes.status).toBe(200);
  });

  it("DELETE /auth/me requires authentication", async () => {
    await resetData();

    const res = await request(app).delete("/auth/me").send({
      currentPassword: password,
      confirmText: "DELETE",
    });

    expect(res.status).toBe(401);
  });

  it("DELETE /auth/me validates current password and confirm text", async () => {
    await resetData();
    const { token } = await registerAndLogin("account-delete-rules@test.com", "Delete Rules");

    const wrongPasswordRes = await request(app)
      .delete("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "wrong-password",
        confirmText: "DELETE",
      });
    const wrongConfirmRes = await request(app)
      .delete("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: password,
        confirmText: "delete",
      });

    expect(wrongPasswordRes.status).toBe(400);
    expect(wrongConfirmRes.status).toBe(400);
  });

  it("DELETE /auth/me removes the user, owned notes, note tags and favorites without affecting other users", async () => {
    await resetData();
    const deletingUser = await registerAndLogin("account-delete-owner@test.com", "Delete Owner");
    const otherUser = await registerAndLogin("account-delete-other@test.com", "Delete Other");

    const deletePublicNote = await createNote(
      deletingUser.token,
      "delete-owner-public-note",
      "PUBLIC",
      "delete-owner-cache-keyword public content"
    );
    const deletePrivateNote = await createNote(
      deletingUser.token,
      "delete-owner-private-note",
      "PRIVATE",
      "delete-owner-private-keyword private content"
    );
    const otherNote = await createNote(
      otherUser.token,
      "delete-other-public-note",
      "PUBLIC",
      "delete-other-keyword public content"
    );

    const tag = await prisma.tag.create({
      data: { name: "account-delete-tag" },
    });
    await prisma.noteTag.create({
      data: {
        noteId: deletePublicNote.id,
        tagId: tag.id,
      },
    });

    await request(app)
      .post("/favorites")
      .set("Authorization", `Bearer ${otherUser.token}`)
      .send({ noteId: deletePublicNote.id })
      .expect(201);
    await request(app)
      .post("/favorites")
      .set("Authorization", `Bearer ${deletingUser.token}`)
      .send({ noteId: otherNote.id })
      .expect(201);

    const cachedSearchRes = await searchAs(otherUser.token, "delete-owner-cache-keyword");
    expect(cachedSearchRes.status).toBe(200);
    expect(cachedSearchRes.body.meta.cache).toBe("miss");
    expect(titlesFromSearch(cachedSearchRes)).toContain("delete-owner-public-note");

    const deleteRes = await request(app)
      .delete("/auth/me")
      .set("Authorization", `Bearer ${deletingUser.token}`)
      .send({
        currentPassword: password,
        confirmText: "DELETE",
      });

    expect(deleteRes.status).toBe(200);

    const deletedUser = await prisma.user.findUnique({
      where: { id: deletingUser.user.id },
    });
    expect(deletedUser).toBeNull();

    const oldTokenRes = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${deletingUser.token}`);
    expect(oldTokenRes.status).not.toBe(200);

    await expect(prisma.note.findUnique({ where: { id: deletePublicNote.id } })).resolves.toBeNull();
    await expect(prisma.note.findUnique({ where: { id: deletePrivateNote.id } })).resolves.toBeNull();
    await expect(prisma.noteTag.findMany({ where: { noteId: deletePublicNote.id } })).resolves.toEqual([]);
    await expect(
      prisma.favorite.findMany({
        where: {
          OR: [
            { userId: deletingUser.user.id },
            { noteId: { in: [deletePublicNote.id, deletePrivateNote.id] } },
          ],
        },
      })
    ).resolves.toEqual([]);

    const otherUserAfterDelete = await prisma.user.findUnique({
      where: { id: otherUser.user.id },
    });
    const otherNoteAfterDelete = await prisma.note.findUnique({
      where: { id: otherNote.id },
    });
    expect(otherUserAfterDelete?.email).toBe("account-delete-other@test.com");
    expect(otherNoteAfterDelete?.title).toBe("delete-other-public-note");

    const searchAfterDeleteRes = await searchAs(otherUser.token, "delete-owner-cache-keyword");
    expect(searchAfterDeleteRes.status).toBe(200);
    expect(searchAfterDeleteRes.body.meta.cache).toBe("miss");
    expect(titlesFromSearch(searchAfterDeleteRes)).not.toContain("delete-owner-public-note");
    expect(searchAfterDeleteRes.body.meta.total).toBe(0);
  });
});
