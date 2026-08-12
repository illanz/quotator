import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Client Prisma partage.
 *
 * En developpement, Next recharge les modules a chaque modification : sans ce
 * cache sur `globalThis`, chaque rechargement ouvrirait un nouveau pool de
 * connexions jusqu'a saturer Postgres.
 */
const global = globalThis as unknown as { prisma?: PrismaClient };

function creer(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL n'est pas defini. Copier .env.example vers .env et renseigner la connexion.",
    );
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = global.prisma ?? creer();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
