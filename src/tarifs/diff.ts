import { formatEuros } from "@/domain/money";
import { labelPalier } from "@/domain/paliers";
import type { Cellule, GrilleParsee, LigneGrille } from "./types";

/**
 * Comparaison de deux millesimes de la grille.
 *
 * L'Excel reste la source de verite, mais un import qui s'applique sans etre
 * relu propage une faute de frappe sur tous les devis a venir. Ce module
 * produit ce que le commercial doit valider avant que la nouvelle grille
 * remplace l'ancienne.
 */

export type EcartPrix = {
  palier: string;
  avant: string;
  apres: string;
  /** Variation en pourcentage, quand les deux valeurs sont des prix. */
  variationPct: number | null;
};

export type EcartLigne = {
  cle: string;
  libelle: string;
  prix: EcartPrix[];
  regimeAvant?: string;
  regimeApres?: string;
  regleAvant?: string;
  regleApres?: string;
};

export type DiffGrille = {
  ajouts: LigneGrille[];
  suppressions: LigneGrille[];
  modifications: EcartLigne[];
  reglesAjoutees: string[];
  reglesSupprimees: string[];
  resume: {
    animationsAvant: number;
    animationsApres: number;
    prixModifies: number;
    /** Variation moyenne des prix modifies, en pourcentage. */
    variationMoyennePct: number | null;
    /** Vrai si rien ne change : l'import peut etre applique sans relecture. */
    identique: boolean;
  };
};

function decrire(c: Cellule): string {
  switch (c.kind) {
    case "PRIX":
      return formatEuros(c.prixCents ?? 0);
    case "CONSULTER":
      return "Nous consulter";
    case "SUR_DEMANDE":
      return "Sur demande";
    case "INDISPONIBLE":
      return "Indisponible";
    case "TEXTE":
      return c.texte ?? "";
    case "VIDE":
      return "—";
  }
}

function comparerLignes(avant: LigneGrille, apres: LigneGrille): EcartLigne | null {
  const prix: EcartPrix[] = [];

  apres.cellules.forEach((cellApres, i) => {
    const cellAvant = avant.cellules[i];
    if (!cellAvant) return;
    if (
      cellAvant.kind === cellApres.kind &&
      cellAvant.prixCents === cellApres.prixCents &&
      (cellAvant.kind !== "TEXTE" || cellAvant.texte === cellApres.texte)
    ) {
      return;
    }
    const variationPct =
      cellAvant.kind === "PRIX" &&
      cellApres.kind === "PRIX" &&
      cellAvant.prixCents &&
      cellApres.prixCents
        ? Math.round(((cellApres.prixCents - cellAvant.prixCents) / cellAvant.prixCents) * 1000) /
          10
        : null;

    prix.push({
      palier: labelPalier(cellApres.palier),
      avant: decrire(cellAvant),
      apres: decrire(cellApres),
      variationPct,
    });
  });

  const regimeChange = avant.regime !== apres.regime;
  const regleChange = (avant.regleForfait ?? "") !== (apres.regleForfait ?? "");

  if (prix.length === 0 && !regimeChange && !regleChange) return null;

  return {
    cle: apres.cle,
    libelle: apres.libelle,
    prix,
    ...(regimeChange ? { regimeAvant: avant.regime, regimeApres: apres.regime } : {}),
    ...(regleChange
      ? { regleAvant: avant.regleForfait ?? "", regleApres: apres.regleForfait ?? "" }
      : {}),
  };
}

export function comparerGrilles(avant: GrilleParsee, apres: GrilleParsee): DiffGrille {
  const parCleAvant = new Map(avant.lignes.map((l) => [l.cle, l]));
  const parCleApres = new Map(apres.lignes.map((l) => [l.cle, l]));

  const ajouts = apres.lignes.filter((l) => !parCleAvant.has(l.cle));
  const suppressions = avant.lignes.filter((l) => !parCleApres.has(l.cle));

  const modifications: EcartLigne[] = [];
  for (const ligneApres of apres.lignes) {
    const ligneAvant = parCleAvant.get(ligneApres.cle);
    if (!ligneAvant) continue;
    const ecart = comparerLignes(ligneAvant, ligneApres);
    if (ecart) modifications.push(ecart);
  }

  const reglesAvant = new Set(avant.regles);
  const reglesApres = new Set(apres.regles);
  const reglesAjoutees = apres.regles.filter((r) => !reglesAvant.has(r));
  const reglesSupprimees = avant.regles.filter((r) => !reglesApres.has(r));

  const variations = modifications
    .flatMap((m) => m.prix.map((p) => p.variationPct))
    .filter((v): v is number => v !== null);

  return {
    ajouts,
    suppressions,
    modifications,
    reglesAjoutees,
    reglesSupprimees,
    resume: {
      animationsAvant: avant.lignes.length,
      animationsApres: apres.lignes.length,
      prixModifies: variations.length,
      variationMoyennePct:
        variations.length > 0
          ? Math.round((variations.reduce((s, v) => s + v, 0) / variations.length) * 10) / 10
          : null,
      identique:
        ajouts.length === 0 &&
        suppressions.length === 0 &&
        modifications.length === 0 &&
        reglesAjoutees.length === 0 &&
        reglesSupprimees.length === 0,
    },
  };
}
