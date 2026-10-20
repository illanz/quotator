/**
 * Normalisation des designations d'animations.
 *
 * Le catalogue facturation.pro porte quinze ans de mise en forme accumulee :
 * balises `<font size="12">`, gras et souligne imbriques dans des ordres
 * variables, retours chariot Windows, et des marqueurs laisses a completer
 * (« Base XX participants », « Quiz XXX »).
 *
 * Ce module ramene tout cela a une structure : un intitule, puis des sections
 * nommees — MATERIEL, STAFF, FRAIS DE DEPLACEMENT, ASSURANCE — telles qu'elles
 * apparaissent sur les devis recents. La mise en forme du PDF est ensuite
 * decidee par le gabarit, pas heritee du texte source.
 */

import { normaliserMentions } from "./mentions";

export type SectionDesignation = {
  /** Intitule de section en capitales, ou `null` pour le corps introductif. */
  intitule: string | null;
  lignes: string[];
};

export type Designation = {
  /** Premiere ligne : le nom commercial de la prestation et sa duree. */
  intitule: string;
  sections: SectionDesignation[];
};

/** Une ligne entierement en capitales suivie de deux points ouvre une section. */
const EN_TETE_SECTION = /^([A-ZÀ-Ý0-9][A-ZÀ-Ý0-9 '’/&.-]{2,})\s*:\s*$/;

function enTexte(html: string): string[] {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l !== "");
}

/** Analyse une designation du catalogue et en degage la structure. */
export function analyserDesignation(html: string): Designation {
  const lignes = enTexte(html);
  const intitule = lignes.shift() ?? "";

  const sections: SectionDesignation[] = [];
  let courante: SectionDesignation = { intitule: null, lignes: [] };

  for (const ligne of lignes) {
    const entete = EN_TETE_SECTION.exec(ligne);
    if (entete) {
      if (courante.lignes.length > 0) sections.push(courante);
      courante = { intitule: entete[1]!.trim(), lignes: [] };
      continue;
    }
    // Les listes du catalogue melangent tirets, puces et rien du tout.
    courante.lignes.push(ligne.replace(/^[-–•*]\s*/, ""));
  }
  if (courante.lignes.length > 0) sections.push(courante);

  return { intitule, sections };
}

export type ContexteRendu = {
  /** Libelle du palier retenu, par exemple « 50-79 ». */
  palier?: string | null;
  pax?: number | null;
  /** Effectif a annoncer, assistants retires. */
  animateurs?: string | null;
  ville?: string | null;
  duree?: string | null;
};

/**
 * Marqueurs laisses a completer dans le catalogue, et ce qui les remplace.
 *
 * Un marqueur qu'aucun element du contexte ne peut remplir n'est pas devine :
 * il est signale, et le commercial le complete avant envoi.
 */
const MARQUEURS: Array<{
  motif: RegExp;
  valeur: (c: ContexteRendu) => string | null;
  libelle: string;
}> = [
  {
    motif: /\bbase\s*:?\s*(?:XX+|xx+)\s*(participants?|pax)\b/gi,
    valeur: (c) => (c.palier ? `Base ${c.palier} participants` : null),
    libelle: "le palier de participants",
  },
  {
    motif: /\b(?:XX+|xx+)\s*(participants?|pax)\b/gi,
    valeur: (c) => (c.palier ? `${c.palier} participants` : null),
    libelle: "le palier de participants",
  },
  {
    motif: /\bdurée\s*:?\s*(?:XX+|xx+)\b/gi,
    valeur: (c) => (c.duree ? `Durée : ${c.duree}` : null),
    libelle: "la durée de vacation",
  },
];

export type ResultatRendu = {
  designation: Designation;
  /** Marqueurs qui n'ont pas pu etre remplis, a completer avant envoi. */
  aCompleter: string[];
};

function remplir(texte: string, contexte: ContexteRendu, aCompleter: Set<string>): string {
  // Les mentions qui contredisent une regle arbitree sont redressees avant tout
  // le reste : c'est ce texte-la qui sera fige sur la ligne de devis.
  let resultat = normaliserMentions(texte);

  for (const { motif, valeur, libelle } of MARQUEURS) {
    const remplacement = valeur(contexte);
    motif.lastIndex = 0;
    if (!motif.test(resultat)) continue;
    motif.lastIndex = 0;
    if (remplacement === null) {
      aCompleter.add(libelle);
      continue;
    }
    resultat = resultat.replace(motif, remplacement);
  }

  // Marqueurs restants, toutes formes confondues : « Quiz XXX », « X staff ».
  if (/\b(?:XX+|xx+)\b/.test(resultat)) {
    aCompleter.add("un élément libre de la désignation (XXX)");
  }

  return resultat;
}

/**
 * Applique le contexte du devis a une designation analysee.
 *
 * L'effectif d'animateurs remplace la section STAFF lorsqu'il est connu : le
 * texte du catalogue est parfois obsolete, et c'est la table de reference qui
 * fait foi.
 */
export function rendreDesignation(
  designation: Designation,
  contexte: ContexteRendu,
): ResultatRendu {
  const aCompleter = new Set<string>();

  const sections = designation.sections.map((section) => {
    if (section.intitule === "STAFF" && contexte.animateurs) {
      return { intitule: section.intitule, lignes: [contexte.animateurs] };
    }
    return {
      intitule: section.intitule,
      lignes: section.lignes.map((l) => remplir(l, contexte, aCompleter)),
    };
  });

  return {
    designation: {
      intitule: remplir(designation.intitule, contexte, aCompleter),
      sections,
    },
    aCompleter: [...aCompleter],
  };
}

/** Rendu texte d'une designation, pour le PDF et l'apercu. */
export function designationEnTexte(designation: Designation): string {
  const blocs = [designation.intitule];
  for (const section of designation.sections) {
    if (section.intitule) blocs.push(`${section.intitule} :`);
    blocs.push(...section.lignes.map((l) => `- ${l}`));
  }
  return blocs.join("\n");
}
