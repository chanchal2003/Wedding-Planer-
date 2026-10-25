import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { env } from "@/lib/env";

// One PrismaClient per server process. In `next dev`, hot reload runs this
// file again and again, so the client is kept on globalThis to avoid opening
// a new connection pool each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
