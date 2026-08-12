import { readFile } from "node:fs/promises";
import { describe, expect, it, beforeAll } from "vitest";
import { parseGrille, cleAnimation } from "./parse-grille";
import type { GrilleParsee, LigneGrille } from "./types";

/**
 * Ces tests s'executent sur la vraie grille 2026, pas sur un fichier fabrique :
 * c'est le seul moyen de garantir que le parseur encaisse ses irregularites —
 * cellules fusionnees, croix, tirets, forfaits en prose, notes de bas de page.
 */
describe("parseGrille — grille officielle 2026", () => {
  let grille: GrilleParsee;
  const ligne = (cle: string): LigneGrille => {
    const l = grille.lignes.find((x) => x.cle === cle);
    if (!l) throw new Error(`Ligne introuvable : ${cle}`);
    return l;
  };

  beforeAll(async () => {
    const buf = await readFile("fixtures/2026_Tarif_Public_MadCityZen.xlsx");
    grille = await parseGrille(buf, "2026_Tarif_Public_MadCityZen.xlsx");
  });

  it("identifie la version et le millesime", () => {
    expect(grille.version).toBe("251215");
    expect(grille.millesime).toBe(2026);
  });

  it("ne signale aucune anomalie sur la grille de reference", () => {
    expect(grille.avertissements).toEqual([]);
  });

  it("lit les 51 animations et separe les deux regimes", () => {
    expect(grille.lignes).toHaveLength(51);
    expect(grille.lignes.filter((l) => l.regime === "PALIER")).toHaveLength(28);
    expect(grille.lignes.filter((l) => l.regime === "FORFAIT")).toHaveLength(23);
  });

  it("lit les prix par palier sans decalage de colonne", () => {
    // BATUCADA, ligne 12 de l'Excel.
    expect(ligne("BATUCADA").cellules.map((c) => c.prixCents ?? null)).toEqual([
      129000, 153000, 186000, 239000, 307000, 373000, 428000, 538000, 648000, null,
    ]);
    expect(ligne("BATUCADA").cellules[9]?.kind).toBe("CONSULTER");
  });

  it("distingue les cellules non tarifaires", () => {
    const robots = ligne("ROBOTS MAKERS");
    expect(robots.cellules[0]?.prixCents).toBe(142000);
    expect(robots.cellules[5]?.kind).toBe("INDISPONIBLE");

    expect(ligne("CREATION PARFUMS").cellules[7]?.kind).toBe("SUR_DEMANDE");

    const surMesure = ligne("FRESQUE SUR MESURE");
    expect(surMesure.cellules[0]?.kind).toBe("INDISPONIBLE");
    expect(surMesure.cellules[2]?.prixCents).toBe(319000);
  });

  it("conserve les forfaits en texte libre sans tenter de les chiffrer", () => {
    const graffwall = ligne("GRAFFWALL");
    expect(graffwall.regime).toBe("FORFAIT");
    expect(graffwall.regleForfait).toContain("2 790");
    expect(graffwall.regleForfait).toContain("Plaque Supp");
  });

  it("traite un prix unique en premiere colonne comme un forfait", () => {
    // « PHOTO ON THE GROUND — 2 790 € HT » n'est pas le tarif de la tranche 1-9.
    expect(ligne("PHOTO ON THE GROUND").regime).toBe("FORFAIT");
  });

  it("ne prend pas un « nous consulter » noye dans une phrase pour un renvoi", () => {
    // « A partir de 2900€, nous consulter pour un devis sur mesure… »
    const truck = ligne("TRUCK TRUCK STUDIO");
    expect(truck.regime).toBe("FORFAIT");
    expect(truck.regleForfait).toContain("2900");
  });

  it("rattache chaque animation a sa famille et a son sous-groupe", () => {
    const batucada = ligne("BATUCADA");
    expect(batucada.famille).toBe("ARTISTIQUE ET CREATIVITE");
    expect(batucada.categorie).toBe("ACTIVITES TEAM BUILDING COLLECTIVES");

    const homeCooking = ligne("HOME COOKING");
    expect(homeCooking.famille).toBe("ONLINE ET VISIO");
    expect(homeCooking.categorie).toBeNull();
  });

  it("repere les animations en libre acces", () => {
    expect(ligne("GRAFFWALL").libreAcces).toBe(true);
    expect(ligne("BOITE A QUESTION CHANSON").libreAcces).toBe(true);
    // Le libelle porte la mention meme quand le sous-groupe est absent.
    expect(ligne("GREEN TAG LIBRE ACCES").libreAcces).toBe(true);
    expect(ligne("BATUCADA").libreAcces).toBe(false);
  });

  it("collecte les regles de bas de grille", () => {
    const texte = grille.regles.join(" ");
    expect(texte).toContain("majorés de 10%");
    expect(texte).toContain("1€ HT/km");
    expect(texte).toContain("250€ HT/staff");
    expect(texte).toContain("150€ HT / nuitée");
    expect(grille.regles.length).toBeGreaterThanOrEqual(10);
  });

  it("ne prend pas les notes de bas de grille pour des animations", () => {
    const cles = grille.lignes.map((l) => l.cle);
    expect(cles.some((c) => c.includes("TARIF WEEK"))).toBe(false);
    expect(cles.some((c) => c.includes("HEBERGEMENT"))).toBe(false);
    expect(cles.some((c) => c.includes("ANIMATIONS EN PROVINCE"))).toBe(false);
  });
});

describe("cleAnimation", () => {
  it("rapproche deux libelles d'un meme produit d'une annee sur l'autre", () => {
    expect(cleAnimation("GRAFFITI (indoor : + 15€/ pax) ")).toBe("GRAFFITI");
    expect(cleAnimation("Graffiti")).toBe("GRAFFITI");
    expect(cleAnimation("MOSAIQUE  (1 tableau/ 25-30 pax)")).toBe("MOSAIQUE");
    expect(cleAnimation("CUSTOM PARTY (4h)")).toBe("CUSTOM PARTY");
    expect(cleAnimation("MINI U CRISTAL (Dispo juin 2025)")).toBe("MINI U CRISTAL");
  });

  it("ne confond pas deux animations que la parenthese distingue", () => {
    expect(cleAnimation("COURTS METRAGES (Caméras pro)")).toBe("COURTS METRAGES CAMERAS PRO");
    expect(cleAnimation("COURTS METRAGES (Tablettes)")).toBe("COURTS METRAGES TABLETTES");
    expect(cleAnimation("FRESQUE CLASSIQUE")).not.toBe(cleAnimation("FRESQUE SUR MESURE"));
  });
});
