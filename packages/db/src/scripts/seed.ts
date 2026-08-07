import { resolve } from "node:path";
import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({
  path: resolve(import.meta.dir, "../../../../.env"),
});

const {
  closeDatabase,
  db,
  knowledgeBases,
  users,
  workspaceMembers,
  workspaces,
} = await import("../index");

async function seed(): Promise<void> {
  const email = "demo@knowledgeforge.dev";

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    console.log("Seed data already exists");
    return;
  }

  const passwordHash = await Bun.password.hash("testpass00", {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 2,
  });

  await db.transaction(async tx => {
    const [user] = await tx
      .insert(users)
      .values({
        email,
        name: "Demo User",
        passwordHash,
        emailVerifiedAt: new Date(),
      })
      .returning();

    const [workspace] = await tx
      .insert(workspaces)
      .values({
        name: "Demo Workspace",
        slug: "demo-workspace",
        createdBy: user.id,
      })
      .returning();

    await tx.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id,
      role: "owner",
    });

    await tx.insert(knowledgeBases).values({
      workspaceId: workspace.id,
      name: "Product Documentation",
      description: "Demo knowledge base for local development.",
    });
  });

  console.log("Seed completed");
  console.log(`Email: ${email}`);
  console.log("Password: testpass00");
}

seed()
  .catch(error => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
