import { describe, expect, it } from "vitest";
import { estJourMajore, estWeekEnd, joursFeries } from "@/domain/calendrier";
import { palierPourPax, paliersPourFourchette } from "@/domain/paliers";
import { calculerDevis } from "./engine";
import { calculerFraisDeplacement, departementDe } from "./frais";

describe("paliers", () => {
  it("associe un nombre de participants a sa tranche", () => {
    expect(palierPourPax(1)).toBe("P1_9");
    expect(palierPourPax(9)).toBe("P1_9");
    expect(palierPourPax(10)).toBe("P10_19");
    expect(palierPourPax(50)).toBe("P50_79");
    expect(palierPourPax(79)).toBe("P50_79");
    expect(palierPourPax(80)).toBe("P80_119");
    expect(palierPourPax(200)).toBe("P200_239");
    expect(palierPourPax(240)).toBe("P240_PLUS");
    expect(palierPourPax(1000)).toBe("P240_PLUS");
  });

  it("refuse un nombre de participants absurde", () => {
    expect(palierPourPax(0)).toBeNull();
    expect(palierPourPax(-5)).toBeNull();
  });

  it("signale une fourchette a cheval sur deux tranches", () => {
    // « 50-60 pax » tient dans une seule tranche.
    expect(paliersPourFourchette(50, 60)).toEqual(["P50_79"]);
    // « 25-40 pax » n'a pas de prix evident : il en faut deux.
    expect(paliersPourFourchette(25, 40)).toEqual(["P20_29", "P30_49"]);
  });
});

describe("calendrier", () => {
  it("reconnait les week-ends", () => {
    expect(estWeekEnd("2026-08-15")).toBe(true); // samedi
    expect(estWeekEnd("2026-08-16")).toBe(true); // dimanche
    expect(estWeekEnd("2026-08-17")).toBe(false); // lundi
  });

  it("calcule les feries mobiles", () => {
    const feries = joursFeries(2026);
    expect(feries.has("2026-04-06")).toBe(true); // lundi de Paques
    expect(feries.has("2026-05-14")).toBe(true); // Ascension
    expect(feries.has("2026-05-25")).toBe(true); // lundi de Pentecote
    expect(feries.size).toBe(11);
  });

  it("majore les feries meme en semaine", () => {
    expect(estJourMajore("2026-05-14")).toBe(true); // Ascension, un jeudi
    expect(estJourMajore("2026-05-28")).toBe(false); // jeudi ordinaire
  });

  it("ne se decale pas d'un jour selon le fuseau", () => {
    // Une date d'evenement est une date civile, pas un instant.
    expect(estWeekEnd("2026-01-01")).toBe(false); // jeudi
    expect(estJourMajore("2026-01-01")).toBe(true); // mais ferie
  });
});

describe("frais de deplacement", () => {
  it("lit le departement, Corse et outre-mer compris", () => {
    expect(departementDe("75001")).toBe("75");
    expect(departementDe("92400")).toBe("92");
    expect(departementDe("97400")).toBe("974");
    expect(departementDe("pas un cp")).toBeNull();
  });

  it("n'applique aucun frais sur Paris et la petite couronne", () => {
    for (const cp of ["75001", "92400", "93100", "94120"]) {
      expect(calculerFraisDeplacement(cp, 40)?.du).toBe("INCLUS");
    }
  });

  it("facture 1 € HT du kilometre aller-retour au-dela", () => {
    const frais = calculerFraisDeplacement("69001", 940);
    expect(frais).toEqual({
      du: "A_FACTURER",
      departement: "69",
      kmAllerRetour: 940,
      montantCents: 94000,
    });
  });

  it("reclame le kilometrage plutot que de produire une ligne a zero", () => {
    expect(calculerFraisDeplacement("44000", null)?.du).toBe("KM_MANQUANTS");
  });
});

describe("calculerDevis", () => {
  it("reproduit le devis 19800 (YOUSIGN, Batucada 200 pax)", () => {
    const devis = calculerDevis({
      titre: "Animations Team building / 15 Janvier 2027 / 200 Pax / Paris",
      dateEvent: "2027-01-15", // un vendredi : pas de majoration
      codePostal: "75002",
      prestations: [
        {
          cle: "BATUCADA",
          designation: 'Activité Team Building Batucada "Samba do Brazil" - Durée : 1h30',
          prixUnitaireCents: 648000,
        },
      ],
      lignesLibres: [
        {
          designation: "Stationnement sur Paris intra-muros",
          prixUnitaireCents: 8000,
        },
      ],
    });

    expect(devis.majorationAppliquee).toBe(false);
    expect(devis.totalHTCents).toBe(656000);
    expect(devis.totalTVACents).toBe(131200);
    expect(devis.totalTTCCents).toBe(787200);
    expect(devis.acompteCents).toBe(551040);
    expect(devis.avertissements).toEqual([]);
  });

  it("reproduit le devis 19584 : options exclues du total", () => {
    const remise = 10;
    const devis = calculerDevis({
      titre: "Animations Libre accès / 28 Mai 2026 / Levallois Perret / Vacation 4H00",
      dateEvent: "2026-05-28",
      codePostal: "92300",
      conventionMultiAnimations: true,
      prestations: [
        { designation: "Robots Foot", prixUnitaireCents: 329000, remisePct: remise },
        { designation: "Robots Boxe", prixUnitaireCents: 269000, remisePct: remise },
        { designation: "Réalité Virtuelle", prixUnitaireCents: 159000, remisePct: remise },
        { designation: "Graffiti Digital", prixUnitaireCents: 209000, remisePct: remise },
      ],
    });

    // Seule la premiere animation, remise deduite, entre dans le total.
    expect(devis.totalHTCents).toBe(296100);
    // Les trois autres sont presentees sans peser sur le prix affiche.
    expect(devis.totalOptionsHTCents).toBe(573300);

    const sauts = devis.lignes.filter((l) => l.type === "SAUT_PAGE");
    expect(sauts).toHaveLength(3);
    expect(sauts.every((l) => l.optionnelle)).toBe(true);

    // Une remise sur une option reste optionnelle.
    const remises = devis.lignes.filter((l) => l.type === "REMISE");
    expect(remises).toHaveLength(4);
    expect(remises.map((l) => l.optionnelle)).toEqual([false, true, true, true]);
    expect(remises[0]?.prixUnitaireCents).toBe(-32900);
  });

  it("majore de 15 % un samedi, et conserve le prix d'origine", () => {
    const devis = calculerDevis({
      titre: "Animation Graffiti / 15 août 2026",
      dateEvent: "2026-08-15", // samedi, et Assomption
      codePostal: "75011",
      prestations: [{ designation: "Graffiti", prixUnitaireCents: 159000 }],
    });

    expect(devis.majorationAppliquee).toBe(true);
    const animation = devis.lignes.find((l) => l.type === "ANIMATION");
    expect(animation?.prixUnitaireCents).toBe(182850); // 1 590 € + 15 %
    expect(animation?.prixAvantMajorationCents).toBe(159000);
    expect(devis.totalHTCents).toBe(182850);
  });

  it("calcule la remise sur le prix majore, pas sur le prix de grille", () => {
    const devis = calculerDevis({
      titre: "Test",
      majoration: true,
      prestations: [{ designation: "Graffiti", prixUnitaireCents: 100000, remisePct: 10 }],
    });
    const [, animation, remise] = devis.lignes;
    expect(animation?.prixUnitaireCents).toBe(115000);
    expect(remise?.prixUnitaireCents).toBe(-11500);
    expect(devis.totalHTCents).toBe(103500);
  });

  it("exempte de majoration une ligne qui n'en releve pas", () => {
    const devis = calculerDevis({
      titre: "Test",
      majoration: true,
      prestations: [
        { designation: "Animation", prixUnitaireCents: 100000 },
        { designation: "Stationnement", prixUnitaireCents: 8000, majorable: false },
      ],
    });
    expect(devis.totalHTCents).toBe(123000); // 115 000 + 8 000
  });

  it("ventile la TVA par taux", () => {
    const devis = calculerDevis({
      titre: "Test",
      prestations: [
        { designation: "Animation", prixUnitaireCents: 100000 },
        { designation: "Prestation exoneree", prixUnitaireCents: 50000, tvaPct: 0 },
      ],
    });
    expect(devis.ventilationTVA).toEqual([
      { tauxPct: 0, baseCents: 50000, montantCents: 0 },
      { tauxPct: 20, baseCents: 100000, montantCents: 20000 },
    ]);
    expect(devis.totalTTCCents).toBe(170000);
  });

  it("ajoute les frais de deplacement hors petite couronne", () => {
    const devis = calculerDevis({
      titre: "Animation à Lyon",
      ville: "Lyon",
      codePostal: "69001",
      kmAllerRetour: 940,
      prestations: [{ designation: "Théâtre", prixUnitaireCents: 190000 }],
    });
    const frais = devis.lignes.find((l) => l.type === "FRAIS_DEPLACEMENT");
    expect(frais?.designation).toBe("Frais de déplacement Courbevoie > Lyon > Courbevoie");
    expect(frais?.totalHTCents).toBe(94000);
    expect(devis.totalHTCents).toBe(284000);
  });

  it("alerte plutot que de chiffrer a zero", () => {
    const devis = calculerDevis({
      titre: "Animation sans tarif",
      codePostal: "44000",
      prestations: [{ designation: "Olympiades 240+ pax", prixUnitaireCents: 0 }],
    });
    expect(devis.avertissements).toHaveLength(2);
    expect(devis.avertissements[0]).toContain("n'a pas de prix");
    expect(devis.avertissements[1]).toContain("kilometrage");
  });
});
