import ExcelJS from "exceljs";
import { eurosToCents, formatEuros } from "@/domain/money";
import { PALIERS } from "@/domain/paliers";
import type {
  Cellule,
  CelluleKind,
  GrilleParsee,
  LigneGrille,
  Regime,
} from "./types";

/** Colonne A = libelle, colonnes B a K = les dix paliers. */
const COL_LIBELLE = 1;
const COL_PREMIER_PALIER = 2;

/**
 * Normalise un libelle pour servir de cle de rapprochement entre deux
 * millesimes : « GRAFFITI (indoor : + 15€/ pax) » et « GRAFFITI » doivent se
 * reconnaitre d'une annee sur l'autre, sinon chaque import signalerait des
 * suppressions et des creations en masse.
 */
export function cleAnimation(libelle: string): string {
  return libelle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\(([^)]*)\)/g, (_, contenu: string) =>
      parentheseAccessoire(contenu) ? " " : ` ${contenu} `,
    )
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/**
 * Une parenthese qui porte une condition tarifaire, une jauge ou une duree
 * n'identifie pas le produit : \u00ab GRAFFITI (indoor : + 15\u20ac/ pax) \u00bb et
 * \u00ab GRAFFITI \u00bb sont la meme animation d'une annee sur l'autre.
 *
 * Une parenthese qui qualifie le produit, elle, le distingue :
 * \u00ab COURTS METRAGES (Cameras pro) \u00bb et \u00ab COURTS METRAGES (Tablettes) \u00bb sont
 * deux animations a deux tarifs. Les confondre ferait disparaitre une ligne de
 * la grille a chaque import.
 */
function parentheseAccessoire(contenu: string): boolean {
  return (
    /\u20ac|\bpax\b|:|\//i.test(contenu) ||
    /^\s*\d+\s*h/i.test(contenu) ||
    /^\s*\d+\s*(min|mn)\b/i.test(contenu) ||
    /\bdispo/i.test(contenu) ||
    /\b(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)\b/i.test(
      contenu,
    )
  );
}

function texteCellule(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((r) => r.text).join("").trim();
  }
  if (typeof value === "object" && "result" in value) {
    return texteCellule(value.result as ExcelJS.CellValue);
  }
  return String(value).trim();
}

/**
 * Valeur d'une cellule, en neutralisant les fusions.
 *
 * ExcelJS recopie la valeur du maitre sur toutes les cellules d'une plage
 * fusionnee. Sans ce filtre, un titre de categorie fusionne de A a K se lit
 * comme dix prix identiques, et un forfait redige en prose se lit comme un
 * tarif present dans les dix paliers.
 */
function valeurUtile(row: ExcelJS.Row, col: number): ExcelJS.CellValue {
  const cell = row.getCell(col);
  if (cell.isMerged && cell.master && cell.master.address !== cell.address) {
    return null;
  }
  return cell.value;
}

function classerCellule(value: ExcelJS.CellValue): {
  kind: CelluleKind;
  prixCents?: number;
  texte?: string;
} {
  if (typeof value === "number") {
    return { kind: "PRIX", prixCents: Math.round(value * 100) };
  }
  const texte = texteCellule(value);
  if (texte === "") return { kind: "VIDE" };
  // Comparaison sur la cellule entiere : « A partir de 2900€, nous consulter
  // pour un devis sur mesure » est une regle de forfait, pas un renvoi.
  if (/^nous consulter[\s.!]*$/i.test(texte)) return { kind: "CONSULTER", texte };
  if (/^sur demande[\s.!]*$/i.test(texte)) return { kind: "SUR_DEMANDE", texte };
  if (/^[-–x]$/i.test(texte)) return { kind: "INDISPONIBLE", texte };

  // « 1 190€ HT » est un prix ; « 1090 € / equipe de 12 pax » ne l'est pas.
  const cents = eurosToCents(texte);
  if (cents !== null) return { kind: "PRIX", prixCents: cents, texte };

  return { kind: "TEXTE", texte };
}

function lireCellules(row: ExcelJS.Row): Cellule[] {
  return PALIERS.map((palier, i) => {
    const brut = valeurUtile(row, COL_PREMIER_PALIER + i);
    const { kind, prixCents, texte } = classerCellule(brut);
    return { palier, kind, prixCents, texte };
  });
}

/** Texte assez long, en premiere colonne de prix : c'est une regle de forfait. */
function regleForfaitDe(cellules: Cellule[]): string | null {
  const premiere = cellules[0];
  if (premiere?.kind === "TEXTE" && (premiere.texte ?? "").length > 25) {
    return premiere.texte ?? null;
  }
  return null;
}

/**
 * Une ligne porte un tarif si elle contient au moins une valeur tarifaire
 * reconnue, ou une regle de forfait. Ce predicat delimite la fin du tableau :
 * tout ce qui suit est une note de bas de grille, meme ecrit en capitales.
 */
function estLigneTarifaire(cellules: Cellule[]): boolean {
  const tarifaires: CelluleKind[] = ["PRIX", "CONSULTER", "SUR_DEMANDE", "INDISPONIBLE"];
  if (cellules.some((c) => tarifaires.includes(c.kind))) return true;
  return regleForfaitDe(cellules) !== null;
}

/**
 * Un tarif unique loge dans la seule premiere colonne n'est pas un tarif de
 * palier : c'est un forfait (« PHOTO ON THE GROUND — 2 790 € HT »). L'appliquer
 * comme prix de la tranche 1-9 le rendrait introuvable des 10 participants.
 */
function detecterRegime(cellules: Cellule[]): Regime {
  if (regleForfaitDe(cellules) !== null) return "FORFAIT";
  const remplies = cellules.filter((c) => c.kind !== "VIDE");
  if (remplies.length === 1 && remplies[0]?.palier === PALIERS[0]) return "FORFAIT";
  return "PALIER";
}

/**
 * Une categorie ne porte aucun prix et s'ecrit en capitales : « ARTISTIQUE ET
 * CREATIVITE », « ONLINE ET VISIO », ou les intitules de sous-groupe recurrents
 * (« ACTIVITES TEAM BUILDING COLLECTIVES »).
 */
function estEnTete(libelle: string): boolean {
  const sansAccent = libelle.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return sansAccent === sansAccent.toUpperCase() && /[A-Z]/.test(sansAccent);
}

function normaliserEnTete(libelle: string): string {
  return libelle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

export async function parseGrille(
  buffer: ArrayBuffer | Buffer,
  fichier: string,
): Promise<GrilleParsee> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Le fichier ne contient aucune feuille.");

  const avertissements: string[] = [];
  const lignes: LigneGrille[] = [];
  const regles: string[] = [];
  let version: string | null = null;
  let millesime: number | null = null;

  // Premiere passe : ou s'arrete le tableau des tarifs.
  let derniereLigneTarifaire = 1;
  ws.eachRow((row, numero) => {
    if (numero === 1) return;
    if (estLigneTarifaire(lireCellules(row))) derniereLigneTarifaire = numero;
  });

  // Seconde passe : distinguer les deux niveaux d'en-tete.
  //
  // La grille empile une famille (« ARTISTIQUE ET CREATIVITE ») puis un
  // sous-groupe (« ACTIVITES TEAM BUILDING COLLECTIVES », « ANIMATIONS
  // EVENEMENTIELLES - LIBRE ACCES - SOIREE »). Le second se repete d'une
  // famille a l'autre, le premier non : compter les occurrences suffit a les
  // separer, sans coder en dur la liste des familles.
  const occurrences = new Map<string, number>();
  ws.eachRow((row, numero) => {
    if (numero === 1 || numero > derniereLigneTarifaire) return;
    if (estLigneTarifaire(lireCellules(row))) return;
    const libelle = texteCellule(valeurUtile(row, COL_LIBELLE));
    if (libelle === "" || !estEnTete(libelle)) return;
    const cle = normaliserEnTete(libelle);
    occurrences.set(cle, (occurrences.get(cle) ?? 0) + 1);
  });

  let familleCourante: string | null = null;
  let categorieCourante: string | null = null;

  ws.eachRow((row, numero) => {
    if (numero === 1) return; // ligne d'en-tete des paliers

    const libelle = texteCellule(valeurUtile(row, COL_LIBELLE));
    const cellules = lireCellules(row);

    // Note de bas de grille : majorations, province, options transverses.
    if (numero > derniereLigneTarifaire) {
      if (libelle !== "") {
        regles.push(libelle);
        const m = /compter du .*?(\d{4})/i.exec(libelle);
        if (m) millesime = Number(m[1]);
      }
      return;
    }

    if (!estLigneTarifaire(cellules)) {
      if (libelle === "") return;
      if (estEnTete(libelle)) {
        const recurrent = (occurrences.get(normaliserEnTete(libelle)) ?? 0) > 1;
        if (recurrent) {
          categorieCourante = libelle;
        } else {
          familleCourante = libelle;
          categorieCourante = null;
        }
        return;
      }
      avertissements.push(
        `Ligne ${numero} : « ${libelle} » n'a aucun tarif et n'a pas la forme d'une categorie.`,
      );
      return;
    }

    if (libelle === "") {
      avertissements.push(`Ligne ${numero} : des tarifs sans libelle d'animation.`);
      return;
    }

    const regime = detecterRegime(cellules);
    const ligne: LigneGrille = {
      ligneSource: numero,
      libelle,
      cle: cleAnimation(libelle),
      famille: familleCourante,
      categorie: categorieCourante,
      libreAcces:
        /LIBRE ACCES/i.test(normaliserEnTete(categorieCourante ?? "")) ||
        /LIBRE ACCES/i.test(normaliserEnTete(libelle)),
      regime,
      cellules,
    };
    if (regime === "FORFAIT") {
      const premiere = cellules.find((c) => c.kind !== "VIDE");
      ligne.regleForfait =
        regleForfaitDe(cellules) ??
        premiere?.texte ??
        (premiere?.prixCents !== undefined ? formatEuros(premiere.prixCents) : "");
    }
    lignes.push(ligne);
  });

  // La version est tamponnee dans une cellule isolee, en marge du tableau.
  ws.eachRow((row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (version) return;
      const m = /^V\.\s*([0-9]{4,8})$/.exec(texteCellule(cell.value));
      if (m) version = m[1] ?? null;
    });
  });

  const clesVues = new Set<string>();
  for (const l of lignes) {
    if (clesVues.has(l.cle)) {
      avertissements.push(
        `Ligne ${l.ligneSource} : « ${l.libelle} » apparait deux fois dans la grille.`,
      );
    }
    clesVues.add(l.cle);
  }

  return { fichier, version, millesime, lignes, regles, avertissements };
}
