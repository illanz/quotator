import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { formatEuros } from "@/domain/money";
import { comparerGrilles } from "./diff";
import { parseGrille } from "./parse-grille";
import type { GrilleParsee, LigneGrille } from "./types";

/** Copie profonde, pour fabriquer un millesime suivant sans toucher l'original. */
function copier(g: GrilleParsee): GrilleParsee {
  return structuredClone(g);
}

function ligne(g: GrilleParsee, cle: string): LigneGrille {
  const l = g.lignes.find((x) => x.cle === cle);
  if (!l) throw new Error(`Ligne introuvable : ${cle}`);
  return l;
}

describe("comparerGrilles", () => {
  let grille2026: GrilleParsee;

  beforeAll(async () => {
    grille2026 = await parseGrille(
      await readFile("fixtures/2026_Tarif_Public_MadCityZen.xlsx"),
      "2026.xlsx",
    );
  });

  it("ne signale rien quand la grille n'a pas bouge", () => {
    const diff = comparerGrilles(grille2026, copier(grille2026));
    expect(diff.resume.identique).toBe(true);
    expect(diff.modifications).toEqual([]);
  });

  it("chiffre une hausse de prix palier par palier", () => {
    const suivante = copier(grille2026);
    const batucada = ligne(suivante, "BATUCADA");
    batucada.cellules[0]!.prixCents = 139000; // 1 290 € -> 1 390 €

    const diff = comparerGrilles(grille2026, suivante);
    expect(diff.modifications).toHaveLength(1);
    const ecart = diff.modifications[0]!;
    expect(ecart.libelle).toBe("BATUCADA");
    expect(ecart.prix).toHaveLength(1);
    expect(ecart.prix[0]).toMatchObject({
      palier: "1-9",
      avant: formatEuros(129000),
      apres: formatEuros(139000),
      variationPct: 7.8,
    });
    expect(diff.resume.variationMoyennePct).toBe(7.8);
  });

  it("distingue une animation ajoutee d'une animation retiree", () => {
    const suivante = copier(grille2026);
    suivante.lignes = suivante.lignes.filter((l) => l.cle !== "MOSAIQUE");
    suivante.lignes.push({
      ...ligne(grille2026, "BATUCADA"),
      cle: "NOUVELLE ANIMATION",
      libelle: "NOUVELLE ANIMATION",
    });

    const diff = comparerGrilles(grille2026, suivante);
    expect(diff.ajouts.map((l) => l.cle)).toEqual(["NOUVELLE ANIMATION"]);
    expect(diff.suppressions.map((l) => l.cle)).toEqual(["MOSAIQUE"]);
    expect(diff.resume.identique).toBe(false);
  });

  it("signale le passage d'un prix a « nous consulter »", () => {
    const suivante = copier(grille2026);
    const cellule = ligne(suivante, "BATUCADA").cellules[8]!;
    cellule.kind = "CONSULTER";
    delete cellule.prixCents;

    const diff = comparerGrilles(grille2026, suivante);
    expect(diff.modifications[0]?.prix[0]).toMatchObject({
      palier: "200-239",
      avant: formatEuros(648000),
      apres: "Nous consulter",
      variationPct: null,
    });
  });

  it("signale un changement de regime tarifaire", () => {
    const suivante = copier(grille2026);
    const l = ligne(suivante, "GRAFFWALL");
    l.regime = "PALIER";
    l.regleForfait = "";

    const diff = comparerGrilles(grille2026, suivante);
    const ecart = diff.modifications.find((m) => m.cle === "GRAFFWALL");
    expect(ecart?.regimeAvant).toBe("FORFAIT");
    expect(ecart?.regimeApres).toBe("PALIER");
  });

  it("suit les regles de bas de grille", () => {
    const suivante = copier(grille2026);
    suivante.regles = suivante.regles.map((r) =>
      r.includes("Week-End") ? r.replace("10%", "15%") : r,
    );

    const diff = comparerGrilles(grille2026, suivante);
    expect(diff.reglesAjoutees.join()).toContain("15%");
    expect(diff.reglesSupprimees.join()).toContain("10%");
  });
});
