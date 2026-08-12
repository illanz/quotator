import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    // L'import de grille televerse un classeur Excel entier.
    serverActions: { bodySizeLimit: "10mb" },
  },
  // L'alias est declare ici en plus de tsconfig.json : selon la version de
  // TypeScript installee, Next ne reprend pas toujours les `paths` du tsconfig.
  webpack(configuration) {
    configuration.resolve.alias["@"] = path.join(racine, "src");
    return configuration;
  },
};

export default config;
