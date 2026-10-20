import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    // L'import de grille televerse un classeur Excel entier.
    serverActions: { bodySizeLimit: "10mb" },
  },
  // Le moteur de rendu PDF embarque fontkit et ses binaires : il doit rester
  // hors du paquet compile, sinon le chargement des fontes echoue.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Les fontes et le logo du PDF sont lus sur le disque a l'execution. Aucun
  // `import` ne les mentionne : sans cette declaration, le tracage de fichiers
  // ne les emporte pas et le devis se compose sans caracteres.
  outputFileTracingIncludes: {
    "/devis/[id]/pdf": ["./assets/**"],
    "/p/[jeton]/pdf": ["./assets/**"],
  },
  // L'alias est declare ici en plus de tsconfig.json : selon la version de
  // TypeScript installee, Next ne reprend pas toujours les `paths` du tsconfig.
  webpack(configuration) {
    configuration.resolve.alias["@"] = path.join(racine, "src");
    return configuration;
  },
};

export default config;
