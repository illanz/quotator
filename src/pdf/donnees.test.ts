import { describe, expect, it } from "vitest";
import { composerDevisPdf, type DevisSource, type LigneSource } from "./donnees";

function ligne(partiel: Partial<LigneSource>): LigneSource {
  return {
    type: "ANIMATION",
    designation: "Animation",
    designationStructuree: null,
    prixUnitaireCents: 0,
    quantite: 1,
    tvaPct: 20,
    totalHTCents: 0,
    optionnelle: false,
    ...partiel,
  };
}

function devis(lignes: LigneSource[], partiel: Partial<DevisSource> = {}): DevisSource {
  return {
    numero: 19803,
    version: 1,
    titre: "Animation Graffiti / 15 août 2026",
    dateEvent: "2026-08-15",
    ville: "Lognes",
    codePostal: "77185",
    pax: 50,
    paxMax: 60,
    majoration: true,
    valableAu: "2026-07-16",
    totalHTCents: 319000,
    totalTVACents: 63800,
    totalTTCCents: 382800,
    acompteCents: 267960,
    creeLe: new Date("2026-06-16T09:00:00Z"),
    envoyeLe: null,
    lignes,
    organisation: { nom: "YOUSIGN SAS" },
    etablissement: null,
    contact: null,
    commercial: { nom: "Illan", email: "illanz@madcityzen.fr", telephone: null },
    ...partiel,
  };
}

describe("composerDevisPdf", () => {
  it("écarte le titre et les sauts de page, qui n'ont pas de place dans un tableau", () => {
    const resultat = composerDevisPdf(
      devis([
        ligne({ type: "TITRE", designation: "Animation Graffiti" }),
        ligne({ type: "SAUT_PAGE", designation: "" }),
        ligne({ designation: "Graffiti", totalHTCents: 300000 }),
      ]),
      null,
    );

    expect(resultat.fermes).toHaveLength(1);
    expect(resultat.fermes[0]!.designation).toBe("Graffiti");
  });

  it("rattache majoration et remise à l'animation optionnelle qu'elles modifient", () => {
    const resultat = composerDevisPdf(
      devis([
        ligne({ designation: "Graffiti", totalHTCents: 300000 }),
        ligne({
          designation: "Lego Mania",
          totalHTCents: 240000,
          optionnelle: true,
        }),
        ligne({
          type: "MAJORATION",
          designation: "Majoration week-end",
          totalHTCents: 36000,
          optionnelle: true,
        }),
        ligne({
          type: "REMISE",
          designation: "Remise commerciale de 10%",
          totalHTCents: -27600,
          optionnelle: true,
        }),
      ]),
      null,
    );

    expect(resultat.options).toHaveLength(1);
    const option = resultat.options[0]!;
    expect(option.principale.designation).toBe("Lego Mania");
    expect(option.annexes.map((a) => a.type)).toEqual(["MAJORATION", "REMISE"]);
    // Le supplement annonce au client est celui du groupe entier, remise comprise.
    expect(option.totalHTCents).toBe(240000 + 36000 - 27600);
    expect(resultat.totalOptionsHTCents).toBe(248400);
  });

  it("ouvre un groupe par animation optionnelle", () => {
    const resultat = composerDevisPdf(
      devis([
        ligne({ designation: "Graffiti", totalHTCents: 300000 }),
        ligne({ designation: "Lego Mania", totalHTCents: 240000, optionnelle: true }),
        ligne({ designation: "Mad Burger", totalHTCents: 180000, optionnelle: true }),
      ]),
      null,
    );

    expect(resultat.options.map((o) => o.principale.designation)).toEqual([
      "Lego Mania",
      "Mad Burger",
    ]);
  });

  it("ventile la TVA par taux, sur les seules lignes fermes", () => {
    const resultat = composerDevisPdf(
      devis([
        ligne({ designation: "Graffiti", totalHTCents: 300000, tvaPct: 20 }),
        ligne({ type: "LIBRE", designation: "Refacturation", totalHTCents: 10000, tvaPct: 0 }),
        ligne({ designation: "Option", totalHTCents: 500000, optionnelle: true }),
      ]),
      null,
    );

    expect(resultat.ventilationTVA).toEqual([
      { tauxPct: 0, baseCents: 10000, montantCents: 0 },
      { tauxPct: 20, baseCents: 300000, montantCents: 60000 },
    ]);
  });

  it("reprend les totaux enregistrés sans les recalculer", () => {
    // Un devis emis doit se reimprimer a l'identique, meme si la grille ou les
    // regles de majoration ont change depuis.
    const resultat = composerDevisPdf(
      devis([ligne({ designation: "Graffiti", totalHTCents: 1 })], {
        totalHTCents: 319000,
        totalTTCCents: 382800,
        acompteCents: 267960,
      }),
      null,
    );

    expect(resultat.totalHTCents).toBe(319000);
    expect(resultat.soldeCents).toBe(382800 - 267960);
  });

  it("date l'émission de l'envoi, et du jour de création pour un brouillon", () => {
    const envoye = composerDevisPdf(
      devis([], { envoyeLe: new Date("2026-06-20T22:30:00Z") }),
      null,
    );
    // 22 h 30 UTC un 20 juin, c'est le 21 a Paris : la date civile du devis est
    // celle du fuseau de la societe, pas celle du serveur.
    expect(envoye.dateEmission).toBe("2026-06-21");

    const brouillon = composerDevisPdf(devis([]), null);
    expect(brouillon.dateEmission).toBe("2026-06-16");
  });

  it("ne garde de la structure stockée que ce qui en a la forme", () => {
    const resultat = composerDevisPdf(
      devis([
        ligne({ designation: "Correcte", designationStructuree: { intitule: "A", sections: [] } }),
        ligne({ designation: "Tronquée", designationStructuree: { intitule: "B" } }),
        ligne({ designation: "Absente", designationStructuree: null }),
      ]),
      null,
    );

    expect(resultat.fermes.map((l) => l.structure?.intitule ?? null)).toEqual(["A", null, null]);
  });

  it("n'imprime des coordonnées bancaires que si l'IBAN tombe juste", () => {
    const bonnes = {
      banque: "Crédit Agricole d'Île-de-France",
      domiciliation: "La Garenne-Colombes",
      iban: "FR7618206002666025200001733",
      bic: "agrifrpp882",
    };
    const resultat = composerDevisPdf(devis([]), bonnes);
    expect(resultat.banque).toEqual({
      banque: "Crédit Agricole d'Île-de-France",
      domiciliation: "La Garenne-Colombes",
      // Mis en forme comme sur un relevé : c'est ainsi qu'il sera recopié.
      iban: "FR76 1820 6002 6660 2520 0001 733",
      bic: "AGRIFRPP882",
    });

    // Mieux vaut un devis sans RIB qu'un devis portant un IBAN faux : le
    // premier se rattrape d'un courriel, le second coûte un virement perdu.
    expect(composerDevisPdf(devis([]), { ...bonnes, iban: "FR7618206002666025200001737" }).banque)
      .toBeNull();
    expect(composerDevisPdf(devis([]), { ...bonnes, iban: null }).banque).toBeNull();
    expect(composerDevisPdf(devis([]), null).banque).toBeNull();
  });

  it("compose l'adresse du client à partir de son établissement", () => {
    const resultat = composerDevisPdf(
      devis([], {
        etablissement: { adresse: "14 rue de la Paix", codePostal: "75002", ville: "Paris" },
        contact: { civilite: "Mme", prenom: "Anne", nom: "Martin", fonction: "Office Manager" },
      }),
      null,
    );

    expect(resultat.client.adresse).toEqual(["14 rue de la Paix", "75002 Paris"]);
    expect(resultat.client.contact).toBe("Mme Anne Martin — Office Manager");
  });
});
