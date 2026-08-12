import type { DateISO } from "@/domain/calendrier";
import { estJourMajore } from "@/domain/calendrier";
import { applyPercent, discountAmount, roundCents, type Cents } from "@/domain/money";
import {
  ACOMPTE_PCT,
  MAJORATION_WEEKEND_PCT,
  TVA_DEFAUT_PCT,
} from "@/domain/regles";
import { calculerFraisDeplacement, libelleFraisDeplacement } from "./frais";

export type TypeLigne =
  | "TITRE"
  | "SAUT_PAGE"
  | "ANIMATION"
  | "REMISE"
  | "FRAIS_DEPLACEMENT"
  | "LIBRE";

export type Prestation = {
  /** Cle de l'animation dans la grille, si la ligne en vient. */
  cle?: string;
  designation: string;
  prixUnitaireCents: Cents;
  quantite?: number;
  tvaPct?: number;
  /** Presentee en option : visible sur le devis, exclue du total. */
  optionnelle?: boolean;
  /** Genere une ligne de remise negative rattachee a cette prestation. */
  remisePct?: number;
  /** Faux pour une ligne qui echappe a la majoration week-end. */
  majorable?: boolean;
};

export type LigneLibre = {
  designation: string;
  prixUnitaireCents: Cents;
  quantite?: number;
  tvaPct?: number;
  optionnelle?: boolean;
};

export type DevisInput = {
  titre: string;
  dateEvent?: DateISO | null;
  /** Force la majoration au lieu de la deduire de la date. */
  majoration?: boolean | null;
  ville?: string | null;
  codePostal?: string | null;
  kmAllerRetour?: number | null;
  prestations: Prestation[];
  lignesLibres?: LigneLibre[];
  /**
   * Convention maison : la premiere animation est ferme, les suivantes sont
   * presentees en option et precedees d'un saut de page. Le total reste bas,
   * et le client arbitre entre des propositions plutot qu'entre oui et non.
   */
  conventionMultiAnimations?: boolean;
};

export type LigneCalculee = {
  position: number;
  type: TypeLigne;
  designation: string;
  prixUnitaireCents: Cents;
  quantite: number;
  tvaPct: number;
  totalHTCents: Cents;
  optionnelle: boolean;
  /** Renseigne quand la majoration week-end a modifie le prix unitaire. */
  prixAvantMajorationCents?: Cents;
};

export type VentilationTVA = {
  tauxPct: number;
  baseCents: Cents;
  montantCents: Cents;
};

export type DevisCalcule = {
  lignes: LigneCalculee[];
  majorationAppliquee: boolean;
  totalHTCents: Cents;
  ventilationTVA: VentilationTVA[];
  totalTVACents: Cents;
  totalTTCCents: Cents;
  /** Somme des lignes optionnelles, hors total : ce que le devis presente en plus. */
  totalOptionsHTCents: Cents;
  acompteCents: Cents;
  avertissements: string[];
};

function tvaDe(pct: number | undefined): number {
  return pct ?? TVA_DEFAUT_PCT;
}

/**
 * Calcule un devis complet a partir de son contexte et de ses prestations.
 *
 * La fonction est pure : memes entrees, memes sorties. C'est ce qui permet de
 * recalculer un devis a l'identique des mois plus tard, et de tester chaque
 * regle isolement.
 */
export function calculerDevis(input: DevisInput): DevisCalcule {
  const avertissements: string[] = [];
  const lignes: LigneCalculee[] = [];
  let position = 0;

  const majoration =
    input.majoration ?? (input.dateEvent ? estJourMajore(input.dateEvent) : false);

  const pousser = (
    ligne: Omit<LigneCalculee, "position" | "totalHTCents"> & { totalHTCents?: Cents },
  ) => {
    const totalHTCents =
      ligne.totalHTCents ?? roundCents(ligne.prixUnitaireCents * ligne.quantite);
    lignes.push({ ...ligne, position: ++position, totalHTCents });
  };

  pousser({
    type: "TITRE",
    designation: input.titre,
    prixUnitaireCents: 0,
    quantite: 0,
    tvaPct: 0,
    optionnelle: false,
  });

  input.prestations.forEach((p, index) => {
    const quantite = p.quantite ?? 1;
    const tvaPct = tvaDe(p.tvaPct);
    const majorable = p.majorable ?? true;

    // Convention maison : tout ce qui suit la premiere animation est optionnel.
    const optionnelle =
      p.optionnelle ?? (input.conventionMultiAnimations === true && index > 0);

    if (input.conventionMultiAnimations === true && index > 0) {
      pousser({
        type: "SAUT_PAGE",
        designation: "",
        prixUnitaireCents: 0,
        quantite: 0,
        tvaPct: 0,
        optionnelle,
      });
    }

    const applique = majoration && majorable;
    const prixUnitaireCents = applique
      ? applyPercent(p.prixUnitaireCents, MAJORATION_WEEKEND_PCT)
      : p.prixUnitaireCents;

    if (p.prixUnitaireCents <= 0) {
      avertissements.push(
        `« ${p.designation} » n'a pas de prix : la grille ne donne pas de tarif pour ce palier, ou il reste a saisir.`,
      );
    }

    pousser({
      type: "ANIMATION",
      designation: p.designation,
      prixUnitaireCents,
      quantite,
      tvaPct,
      optionnelle,
      ...(applique ? { prixAvantMajorationCents: p.prixUnitaireCents } : {}),
    });

    // La remise suit immediatement la ligne qu'elle remise, et epouse son
    // caractere optionnel : une remise sur une option ne doit pas entrer dans
    // le total ferme.
    if (p.remisePct && p.remisePct > 0) {
      const baseCents = roundCents(prixUnitaireCents * quantite);
      pousser({
        type: "REMISE",
        designation: `Remise commerciale de ${p.remisePct}%`,
        prixUnitaireCents: discountAmount(baseCents, p.remisePct),
        quantite: 1,
        tvaPct,
        optionnelle,
      });
    }
  });

  const frais = calculerFraisDeplacement(input.codePostal, input.kmAllerRetour);
  if (frais?.du === "A_FACTURER") {
    pousser({
      type: "FRAIS_DEPLACEMENT",
      designation: libelleFraisDeplacement(input.ville ?? `dept. ${frais.departement}`),
      prixUnitaireCents: frais.montantCents,
      quantite: 1,
      tvaPct: TVA_DEFAUT_PCT,
      optionnelle: false,
    });
  } else if (frais?.du === "KM_MANQUANTS") {
    avertissements.push(
      `Prestation dans le ${frais.departement}, hors petite couronne : le kilometrage aller-retour depuis Courbevoie reste a renseigner.`,
    );
  }

  for (const l of input.lignesLibres ?? []) {
    pousser({
      type: "LIBRE",
      designation: l.designation,
      prixUnitaireCents: l.prixUnitaireCents,
      quantite: l.quantite ?? 1,
      tvaPct: tvaDe(l.tvaPct),
      optionnelle: l.optionnelle ?? false,
    });
  }

  const fermes = lignes.filter((l) => !l.optionnelle);
  const totalHTCents = fermes.reduce((s, l) => s + l.totalHTCents, 0);
  const totalOptionsHTCents = lignes
    .filter((l) => l.optionnelle)
    .reduce((s, l) => s + l.totalHTCents, 0);

  const parTaux = new Map<number, Cents>();
  for (const l of fermes) {
    if (l.totalHTCents === 0) continue;
    parTaux.set(l.tvaPct, (parTaux.get(l.tvaPct) ?? 0) + l.totalHTCents);
  }
  const ventilationTVA: VentilationTVA[] = [...parTaux.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([tauxPct, baseCents]) => ({
      tauxPct,
      baseCents,
      montantCents: roundCents((baseCents * tauxPct) / 100),
    }));

  const totalTVACents = ventilationTVA.reduce((s, v) => s + v.montantCents, 0);
  const totalTTCCents = totalHTCents + totalTVACents;

  return {
    lignes,
    majorationAppliquee: majoration,
    totalHTCents,
    ventilationTVA,
    totalTVACents,
    totalTTCCents,
    totalOptionsHTCents,
    acompteCents: roundCents((totalTTCCents * ACOMPTE_PCT) / 100),
    avertissements,
  };
}
