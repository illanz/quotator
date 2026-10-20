/**
 * Mise en forme des donnees d'un devis pour le document PDF.
 *
 * La fonction est pure et ne connait ni Prisma ni React : elle prend les lignes
 * telles qu'elles sont stockees et en degage ce qu'un document a besoin de
 * savoir — ce qui est ferme, ce qui est propose en option, et ce que chaque
 * option coute si le client la retient. Ce decoupage se teste seul, et c'est
 * lui qui garantit que le PDF ne reconstruit aucun montant : il recopie ceux
 * qui ont ete calcules et enregistres.
 */

import type { Designation } from "@/devis/designation";
import type { TypeLigne } from "@/pricing/engine";

export type LignePdf = {
  type: TypeLigne;
  designation: string;
  /** Designation en sections, quand la ligne en porte une. */
  structure: Designation | null;
  prixUnitaireCents: number;
  quantite: number;
  tvaPct: number;
  totalHTCents: number;
};

/**
 * Une animation proposee en option, avec ce qui s'y rattache.
 *
 * Sa majoration et sa remise la suivent : presentees separement, elles
 * laisseraient croire a un supplement sans objet.
 */
export type OptionPdf = {
  principale: LignePdf;
  annexes: LignePdf[];
  totalHTCents: number;
};

export type LigneSource = {
  type: string;
  designation: string;
  designationStructuree: unknown;
  prixUnitaireCents: number;
  quantite: number;
  tvaPct: number;
  totalHTCents: number;
  optionnelle: boolean;
};

export type DevisSource = {
  numero: number | null;
  version: number;
  titre: string;
  dateEvent: string | null;
  ville: string | null;
  codePostal: string | null;
  pax: number | null;
  paxMax: number | null;
  majoration: boolean;
  valableAu: string | null;
  totalHTCents: number;
  totalTVACents: number;
  totalTTCCents: number;
  acompteCents: number;
  creeLe: Date;
  envoyeLe: Date | null;
  lignes: LigneSource[];
  organisation: { nom: string };
  etablissement: {
    adresse: string | null;
    codePostal: string | null;
    ville: string | null;
  } | null;
  contact: {
    civilite: string | null;
    prenom: string | null;
    nom: string | null;
    fonction: string | null;
  } | null;
  commercial: { nom: string; email: string; telephone: string | null };
};

export type DevisPdf = {
  numero: number | null;
  version: number;
  /** Date civile d'emission : celle de l'envoi, ou du jour pour un brouillon. */
  dateEmission: string;
  valableAu: string | null;
  titre: string;
  dateEvent: string | null;
  ville: string | null;
  pax: string | null;
  client: { nom: string; adresse: string[]; contact: string | null };
  commercial: { nom: string; email: string; telephone: string | null };
  fermes: LignePdf[];
  options: OptionPdf[];
  totalHTCents: number;
  ventilationTVA: Array<{ tauxPct: number; baseCents: number; montantCents: number }>;
  totalTVACents: number;
  totalTTCCents: number;
  totalOptionsHTCents: number;
  acompteCents: number;
  soldeCents: number;
  coordonneesBancaires: string | null;
};

/** Structure stockee sur la ligne, relue sans confiance aveugle. */
function structureDe(valeur: unknown): Designation | null {
  if (!valeur || typeof valeur !== "object") return null;
  const candidat = valeur as Partial<Designation>;
  if (typeof candidat.intitule !== "string" || !Array.isArray(candidat.sections)) return null;
  return { intitule: candidat.intitule, sections: candidat.sections };
}

function versLigne(l: LigneSource): LignePdf {
  return {
    type: l.type as TypeLigne,
    designation: l.designation,
    structure: structureDe(l.designationStructuree),
    prixUnitaireCents: l.prixUnitaireCents,
    quantite: l.quantite,
    tvaPct: l.tvaPct,
    totalHTCents: l.totalHTCents,
  };
}

/** Date civile `YYYY-MM-DD` d'un instant, dans le fuseau de la societe. */
function dateCivile(instant: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function libellePax(pax: number | null, paxMax: number | null): string | null {
  if (!pax) return null;
  return paxMax ? `${pax}-${paxMax} participants` : `${pax} participants`;
}

function libelleContact(contact: DevisSource["contact"]): string | null {
  if (!contact) return null;
  const nom = [contact.civilite, contact.prenom, contact.nom].filter(Boolean).join(" ").trim();
  if (nom === "") return null;
  return contact.fonction ? `${nom} — ${contact.fonction}` : nom;
}

/**
 * Compose la charge utile du document.
 *
 * Les montants sont repris tels qu'ils ont ete enregistres : un devis emis doit
 * se reimprimer a l'identique des mois plus tard, meme si la grille, les regles
 * de majoration ou le moteur de calcul ont change entre-temps. Seule la
 * ventilation de TVA est recomposee, parce qu'elle n'est pas stockee — et elle
 * l'est a partir des lignes du devis, pas de la grille.
 */
export function composerDevisPdf(
  devis: DevisSource,
  parametres: { coordonneesBancaires: string | null } | null,
): DevisPdf {
  const visibles = devis.lignes.filter((l) => l.type !== "SAUT_PAGE" && l.type !== "TITRE");

  const fermes = visibles.filter((l) => !l.optionnelle).map(versLigne);

  // Chaque animation optionnelle ouvre un groupe ; sa majoration et sa remise
  // s'y rattachent. Une ligne optionnelle qui n'est precedee d'aucune animation
  // ouvre son propre groupe plutot que d'etre perdue.
  const options: OptionPdf[] = [];
  for (const brute of visibles.filter((l) => l.optionnelle)) {
    const ligne = versLigne(brute);
    const dernier = options[options.length - 1];
    if (ligne.type === "ANIMATION" || !dernier) {
      options.push({ principale: ligne, annexes: [], totalHTCents: ligne.totalHTCents });
    } else {
      dernier.annexes.push(ligne);
      dernier.totalHTCents += ligne.totalHTCents;
    }
  }

  const parTaux = new Map<number, number>();
  for (const l of fermes) {
    if (l.totalHTCents === 0) continue;
    parTaux.set(l.tvaPct, (parTaux.get(l.tvaPct) ?? 0) + l.totalHTCents);
  }
  const ventilationTVA = [...parTaux.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([tauxPct, baseCents]) => ({
      tauxPct,
      baseCents,
      montantCents: Math.round((baseCents * tauxPct) / 100),
    }));

  return {
    numero: devis.numero,
    version: devis.version,
    dateEmission: dateCivile(devis.envoyeLe ?? devis.creeLe),
    valableAu: devis.valableAu,
    titre: devis.titre,
    dateEvent: devis.dateEvent,
    ville: devis.ville,
    pax: libellePax(devis.pax, devis.paxMax),
    client: {
      nom: devis.organisation.nom,
      adresse: [
        devis.etablissement?.adresse ?? null,
        [devis.etablissement?.codePostal, devis.etablissement?.ville]
          .filter(Boolean)
          .join(" ")
          .trim() || null,
      ].filter((l): l is string => Boolean(l)),
      contact: libelleContact(devis.contact),
    },
    commercial: devis.commercial,
    fermes,
    options,
    totalHTCents: devis.totalHTCents,
    ventilationTVA,
    totalTVACents: devis.totalTVACents,
    totalTTCCents: devis.totalTTCCents,
    totalOptionsHTCents: options.reduce((s, o) => s + o.totalHTCents, 0),
    acompteCents: devis.acompteCents,
    soldeCents: devis.totalTTCCents - devis.acompteCents,
    coordonneesBancaires: parametres?.coordonneesBancaires ?? null,
  };
}
