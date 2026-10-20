import { describe, expect, it } from "vitest";
import { animateursPour, libelleEffectif, sansAssistants } from "./animateurs";
import { analyserDesignation, designationEnTexte, rendreDesignation } from "./designation";
import { composerTitre } from "./titre";

describe("animateursPour", () => {
  it("donne l'effectif du palier demandé", () => {
    const r = animateursPour("HOME COOKING", "P50_79");
    expect(r).toEqual({ connu: true, effectif: "3 chefs", effectifComplet: "3 chefs" });
  });

  it("retire la mention d'assistant, jamais annoncée au client", () => {
    const r = animateursPour("GRAFFITI", "P30_49");
    expect(r.connu && r.effectif).toBe("2 artistes");
    expect(r.connu && r.effectifComplet).toBe("2 artistes et 1 assistant MCZ");
  });

  it("conserve les intervenants qui ne sont pas des assistants", () => {
    // « 2 anim. MCZ, 2 anim. Mosaïque et 1 anim. Yoga » : aucun assistant.
    const r = animateursPour("DESTRUCTION CONSTRUCTIVE", "P80_119");
    expect(r.connu && r.effectif).toBe("2 anim. MCZ, 2 anim. Mosaïque et 1 anim. Yoga");
  });

  it("avoue l'ignorance plutôt que d'inventer un effectif", () => {
    // Les Olympiades ne figurent pas encore dans la table de référence.
    expect(animateursPour("OLYMPIADES", "P50_79")).toEqual({
      connu: false,
      raison: "ANIMATION_INCONNUE",
    });
    // Le palier 240+ n'est documenté pour aucune animation.
    expect(animateursPour("BATUCADA", "P240_PLUS")).toEqual({
      connu: false,
      raison: "PALIER_NON_RENSEIGNE",
    });
  });

  it("nettoie les variantes d'écriture de l'assistant", () => {
    expect(sansAssistants("1 coach et 2 assistants MCZ")).toBe("1 coach");
    expect(sansAssistants("6 et 1 assistant MCZ")).toBe("6");
    expect(sansAssistants("1 artiste")).toBe("1 artiste");
  });

  it("qualifie un effectif réduit à un nombre", () => {
    // La table d'exploitation n'écrit qu'un chiffre : sur un devis, « 2 » seul
    // ne dit pas deux quoi.
    expect(libelleEffectif("2")).toBe("2 animateurs");
    expect(libelleEffectif("1")).toBe("1 animateur");
    expect(libelleEffectif("1 (1 coach supp tous les 50 pax)")).toBe(
      "1 animateur (1 coach supp tous les 50 pax)",
    );
    // Quand la source nomme le rôle, elle en dit plus : on n'y touche pas.
    expect(libelleEffectif("3 chefs")).toBe("3 chefs");
    expect(libelleEffectif("2 anim. MCZ et 1 anim. Yoga")).toBe("2 anim. MCZ et 1 anim. Yoga");
  });

  it("annonce un effectif qualifié, assistants retirés", () => {
    expect(animateursPour("LEGO MANIA", "P30_49")).toEqual({
      connu: true,
      effectif: "2 animateurs",
      effectifComplet: "2",
    });
    expect(animateursPour("CLIP DUB", "P120_159")).toEqual({
      connu: true,
      effectif: "6 animateurs",
      effectifComplet: "6 et 1 assistant MCZ",
    });
  });
});

describe("composerTitre", () => {
  it("compose le format maison", () => {
    expect(
      composerTitre({
        animations: ["Graffiti"],
        dateEvent: "2026-09-15",
        precisionDate: "MOIS",
        pax: 50,
        paxMax: 60,
        ville: "Lognes",
        duree: "1h30",
      }),
    ).toBe("Animation Graffiti / Sept 2026 / 50-60 Pax / Lognes / Vacation 1h30");
  });

  it("met le pluriel et l'esperluette sur plusieurs animations", () => {
    expect(
      composerTitre({
        animations: ["Space K", "Doublage", "Lego Mania"],
        dateEvent: "2026-09-12",
        precisionDate: "MOIS",
        pax: 30,
        ville: "Nanterre",
        duree: "3h",
      }),
    ).toBe("Animations Space K, Doublage & Lego Mania / Sept 2026 / 30 Pax / Nanterre / Vacation 3h");
  });

  it("remplace la jauge par la plage horaire en libre accès", () => {
    expect(
      composerTitre({
        animations: ["Boîte à Questions"],
        dateEvent: "2026-10-13",
        pax: 200,
        ville: "Paris",
        libreAcces: true,
        plageHoraire: "de 12h45 à 14h15",
      }),
    ).toBe("Animation Boîte à Questions / 13 octobre 2026 / Paris / Vacation de 12h45 à 14h15");
  });

  it("annonce une date non arrêtée plutôt que d'en inventer une", () => {
    const titre = composerTitre({
      animations: ["Fresque"],
      precisionDate: "INDEFINIE",
      pax: 30,
      ville: "Paris",
      duree: "2h30",
    });
    expect(titre).toBe("Animation Fresque / Date à définir / 30 Pax / Paris / Vacation 2h30");
  });

  it("omet les segments absents au lieu de les marquer", () => {
    const titre = composerTitre({ animations: ["Batucada"], dateEvent: "2026-05-28" });
    expect(titre).toBe("Animation Batucada / 28 mai 2026");
  });
});

describe("analyserDesignation", () => {
  const catalogue = [
    '<b><u><font size="12">Activité Team Building Batucada "Samba do Brazil" - Durée : 1h30</font></u></b>',
    "MATERIEL :",
    "- Distribution des instruments de batucada pour chaque participant",
    "- Des bouchons d'oreille peuvent être distribués sur demande",
    "STAFF :",
    "- Animation orchestrée par notre Mestre accompagné d'assistants",
    "ASSURANCE :",
    "- Assurance R.C Organisateur incluse",
  ].join("\r\n");

  it("dégage l'intitulé et les sections", () => {
    const d = analyserDesignation(catalogue);
    expect(d.intitule).toBe('Activité Team Building Batucada "Samba do Brazil" - Durée : 1h30');
    expect(d.sections.map((s) => s.intitule)).toEqual(["MATERIEL", "STAFF", "ASSURANCE"]);
    expect(d.sections[0]?.lignes).toHaveLength(2);
    expect(d.sections[0]?.lignes[0]).toBe(
      "Distribution des instruments de batucada pour chaque participant",
    );
  });

  it("remplace la section STAFF par l'effectif de référence", () => {
    const { designation } = rendreDesignation(analyserDesignation(catalogue), {
      animateurs: "1 coach",
    });
    const staff = designation.sections.find((s) => s.intitule === "STAFF");
    expect(staff?.lignes).toEqual(["1 coach"]);
  });

  it("remplit les marqueurs du catalogue", () => {
    const d = analyserDesignation(
      "<b>Escape Game Visio - Base XX participants</b>\r\nDurée : XX\r\nEncadrement inclus",
    );
    const { designation, aCompleter } = rendreDesignation(d, { palier: "50-79", duree: "1h30" });
    expect(designation.intitule).toBe("Escape Game Visio - Base 50-79 participants");
    expect(designationEnTexte(designation)).toContain("Durée : 1h30");
    expect(aCompleter).toEqual([]);
  });

  it("signale un marqueur qu'il ne peut pas remplir", () => {
    const d = analyserDesignation("<b>Quiz XXX - Base XX participants</b>");
    const { aCompleter } = rendreDesignation(d, { palier: "30-49" });
    expect(aCompleter).toContain("un élément libre de la désignation (XXX)");
  });

  it("réclame le palier plutôt que de laisser « XX » partir chez le client", () => {
    const d = analyserDesignation("<b>Home Cooking - Base XX participants</b>");
    const { aCompleter } = rendreDesignation(d, {});
    expect(aCompleter).toContain("le palier de participants");
  });
});
