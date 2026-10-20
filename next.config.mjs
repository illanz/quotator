import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  // Sortie autonome : Next rassemble le serveur et les seules dependances
  // qu'il utilise reellement. Le deploiement ne transporte plus
  // `node_modules` entier, et le serveur de production n'a rien a installer.
  output: "standalone",
  experimental: {
    // L'import de grille televerse un classeur Excel entier.
    serverActions: { bodySizeLimit: "10mb" },
  },
  // Le moteur de rendu PDF embarque fontkit et ses binaires : il doit rester
  // hors du paquet compile, sinon le chargement des fontes echoue.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Fichiers que le tracage ne peut pas deduire des `import`.
  //
  // - `assets` : les fontes et le logo du PDF, lus sur le disque a l'execution.
  // - `pdfkit` : les metriques des quatorze fontes standard du format PDF,
  //   chargees paresseusement au moment ou le document s'ouvre. Le devis
  //   n'en compose aucune — tout est en Carlito — mais pdfkit les reclame
  //   malgre tout a l'initialisation, et leur absence ne se voit qu'une fois
  //   deploye.
  outputFileTracingIncludes: {
    "/devis/[id]/pdf": ["./assets/**", "./node_modules/pdfkit/js/standard-fonts/**"],
    "/p/[jeton]/pdf": ["./assets/**", "./node_modules/pdfkit/js/standard-fonts/**"],
  },
  // L'alias est declare ici en plus de tsconfig.json : selon la version de
  // TypeScript installee, Next ne reprend pas toujours les `paths` du tsconfig.
  webpack(configuration) {
    configuration.resolve.alias["@"] = path.join(racine, "src");
    return configuration;
  },
};

export default config;
