import { PrismaClient } from "@prisma/client";

// Singleton Prisma — evita múltiplas conexões no dev (hot reload)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
