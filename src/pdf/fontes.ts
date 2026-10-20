/**
 * Fontes et images embarquees dans le PDF.
 *
 * Les quatorze fontes standard du format PDF sont encodees en WinAnsi, qui ne
 * contient pas l'espace fine insecable (U+202F). Composer un devis francais
 * avec elles ferait disparaitre — ou remplacerait par un carre — toutes les
 * espaces placees par `normaliserTypographie`. Une fonte TrueType est donc
 * embarquee : Carlito, sous licence SIL OFL, dont la couverture comprend les
 * espaces insecables, le tiret demi-cadratin et les guillemets francais.
 *
 * Les fichiers sont lus depuis le disque a l'execution. Le tracage de fichiers
 * de Next ne les voit pas, puisqu'aucun `import` ne les mentionne : ils sont
 * declares explicitement dans `next.config.mjs`.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Font } from "@react-pdf/renderer";

const dossier = join(process.cwd(), "assets");

export const FAMILLE = "Carlito";

let enregistre = false;

/** Enregistre les fontes une seule fois par processus. */
export function enregistrerFontes(): void {
  if (enregistre) return;

  Font.register({
    family: FAMILLE,
    fonts: [
      { src: join(dossier, "fontes/Carlito-Regular.ttf"), fontWeight: 400 },
      { src: join(dossier, "fontes/Carlito-Bold.ttf"), fontWeight: 700 },
      { src: join(dossier, "fontes/Carlito-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
    ],
  });

  // Le cesureur par defaut applique des regles anglaises a un texte francais.
  // Mieux vaut un bord droit irregulier qu'une coupure fautive.
  Font.registerHyphenationCallback((mot) => [mot]);

  enregistre = true;
}

let logo: Buffer | null = null;

/** Logo de marque, charge une seule fois. */
export function logoMarque(): Buffer {
  logo ??= readFileSync(join(dossier, "logo-madcityzen-transparent.png"));
  return logo;
}
