import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

// Prisma 7 ne lit plus `.env` tout seul. En developpement le fichier existe, en
// production la variable vient de l'hebergeur.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
