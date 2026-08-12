import { describe, expect, it } from "vitest";
import { identifierAnimation } from "./animations";
import { MARQUEUR_TARIF_AGENCE, classerSecteur, estIntermediaire } from "./secteurs";

describe("identifierAnimation", () => {
  it("reconnait une animation sous ses differentes ecritures", () => {
    const ecritures = [
      "Animation Boite à Questions - Animation en accès libre",
      "<b>Boîte à Questions</b> - Vacation 4h",
      "Question Box - Base 100 pax",
    ];
    for (const e of ecritures) {
      const r = identifierAnimation(e);
      expect(r.type).toBe("ANIMATION");
      if (r.type === "ANIMATION") expect(r.animation.cle).toBe("BOITE A QUESTIONS");
    }
  });

  it("prefere l'alias le plus long", () => {
    // « escape game visio » ne doit pas etre absorbe par « escape game ».
    const visio = identifierAnimation("Escape Game Visio - Live Team Building");
    expect(visio.type === "ANIMATION" && visio.animation.cle).toBe("ESCAPE GAME VISIO");

    const surSite = identifierAnimation("Team Building Escape Game \"Space K\" - Base 30 pax");
    expect(surSite.type === "ANIMATION" && surSite.animation.cle).toBe("ESCAPE GAME SPACE K");

    // « mad burger quiz » ne doit pas etre range dans les quiz generiques.
    const burger = identifierAnimation("Mad Burger Quiz - Base 80 participants");
    expect(burger.type === "ANIMATION" && burger.animation.cle).toBe("MAD BURGER");
  });

  it("distingue les lignes accessoires des animations", () => {
    const accessoires = [
      "Forfait déplacement - Paris > Lyon > Paris - 3 staff",
      "Stationnement sur Paris intra-muros d'un véhicule utilitaire",
      "Impression des figurines format 3D : 120 figurines",
      "Acompte sur le devis n°19036",
      "Personnalisation du fond intérieur type photocall",
    ];
    for (const a of accessoires) {
      expect(identifierAnimation(a).type).toBe("ACCESSOIRE");
    }
  });

  it("laisse inconnu ce qu'il ne reconnait pas, plutot que de deviner", () => {
    const r = identifierAnimation("Atelier Peinture Chaises Musicales - Création sur mesure");
    expect(r.type).toBe("INCONNU");
  });

  it("ne lit que le debut du libelle", () => {
    // La suite de la designation cite souvent d'autres animations en exemple.
    const r = identifierAnimation(
      "Animation Batucada - Durée 1h30. " + "texte de remplissage ".repeat(12) + " Graffiti",
    );
    expect(r.type === "ANIMATION" && r.animation.cle).toBe("BATUCADA");
  });
});

describe("classerSecteur", () => {
  it("classe les cas evidents", () => {
    expect(classerSecteur("SOCIETE GENERALE").secteur).toBe("Banque, assurance, finance");
    expect(classerSecteur("Novartis Pharma S.A.S").secteur).toBe("Santé, pharmacie");
    expect(classerSecteur("MAIRIE DE COURBEVOIE").secteur).toBe("Secteur public, collectivité");
    expect(classerSecteur("EY SERVICES FRANCE").secteur).toBe("Conseil, audit, juridique");
  });

  it("reconnait les agences avant tout autre secteur", () => {
    // « Publicis Events » est une agence, pas un annonceur.
    expect(classerSecteur("PUBLICIS EVENTS c/o Re:Sources France").secteur).toBe(
      "Agence événementielle",
    );
    expect(classerSecteur("AGENCE NOVABOX").secteur).toBe("Agence événementielle");
    expect(estIntermediaire(classerSecteur("MCI GROUP FRANCE").secteur)).toBe(true);
  });

  it("classe les enseignes connues, que leur nom ne trahit pas", () => {
    expect(classerSecteur("UBISOFT").secteur).toBe("Tech, numérique, télécom");
    expect(classerSecteur("LAFARGE SA").secteur).toBe("Industrie, énergie");
    expect(classerSecteur("CHATEAUFORM' FRANCE").secteur).toBe("Lieu partenaire");
  });

  it("avoue son ignorance plutot que de ranger au hasard", () => {
    // « Sagarmatha » est une agence, mais rien dans son nom ne le dit : c'est
    // la mention de tarif agence sur ses factures qui le revele, pas le nom.
    const r = classerSecteur("SAGARMATHA");
    expect(r.secteur).toBe("Non classé");
    expect(r.automatique).toBe(false);
  });

  it("reconnait la mention de tarif agence sous ses formes reelles", () => {
    const formes = [
      "Animation Team Building / 6 Novembre 2013 / 300 pax / Tarification Agences",
      "Animation Libre Acces / 2 Decembre 2022 / Remise 10% incluse, reservee aux agences",
      "Remise agence appliquee",
    ];
    for (const f of formes) expect(MARQUEUR_TARIF_AGENCE.test(f)).toBe(true);
    expect(MARQUEUR_TARIF_AGENCE.test("Animation Team Building / 30 Pax / Paris")).toBe(false);
  });
});
