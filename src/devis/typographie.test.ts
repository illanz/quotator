import { describe, expect, it } from "vitest";
import { intituleSection, majusculeInitiale, normaliserTypographie } from "./typographie";

/** Espace fine insecable et espace insecable, invisibles mais signifiantes. */
const FINE = " ";
const NBSP = " ";

describe("normaliserTypographie", () => {
  it("compose les guillemets à la française", () => {
    expect(normaliserTypographie('Animation "Samba do Brazil"')).toBe(
      `Animation «${FINE}Samba do Brazil${FINE}»`,
    );
  });

  it("ferme un guillemet orphelin à la fin de son segment", () => {
    // Le catalogue écrit « Street Art "Graffiti - Durée : 2h30 », sans fermante.
    // La fermer au tiret, et non en fin de ligne, évite d'avaler la durée.
    expect(normaliserTypographie('Activité Street Art "Graffiti - Durée : 2h30')).toBe(
      `Activité Street Art «${FINE}Graffiti${FINE}» – Durée${FINE}: 2h30`,
    );
    expect(normaliserTypographie('Atelier "Light Painting')).toBe(
      `Atelier «${FINE}Light Painting${FINE}»`,
    );
  });

  it("reconnaît une paire avant d'y chercher un orphelin", () => {
    // La paire contient un tiret : traitée comme orphelin, elle se fermerait
    // après « GraffWall ».
    expect(normaliserTypographie('"GraffWall - Animation Street Art Corporate"')).toBe(
      `«${FINE}GraffWall – Animation Street Art Corporate${FINE}»`,
    );
  });

  it("resserre les espaces glissées à l'intérieur des guillemets", () => {
    expect(normaliserTypographie('notre cabine "Black Box " Dimensions')).toBe(
      `notre cabine «${FINE}Black Box${FINE}» Dimensions`,
    );
  });

  it("ne prend pas une mesure en pouces pour un guillemet", () => {
    // « Diffusion sur grand écran 50" sur pied » : la marque suit un chiffre,
    // c'est une mesure. La convertir ouvrirait une citation qui ne ferme jamais.
    expect(normaliserTypographie('Diffusion sur grand écran 50" sur pied')).toBe(
      'Diffusion sur grand écran 50" sur pied',
    );
    expect(normaliserTypographie('écran 48" sur pied & installé : 500€ HT')).toBe(
      `écran 48" sur pied & installé${FINE}: 500${NBSP}€${NBSP}HT`,
    );
  });

  it("colle la ponctuation double à une espace fine", () => {
    expect(normaliserTypographie("Durée : 2h30")).toBe(`Durée${FINE}: 2h30`);
    expect(normaliserTypographie("Combien ?")).toBe(`Combien${FINE}?`);
  });

  it("ne coupe pas une URL en deux", () => {
    expect(normaliserTypographie("https://madcityzen.fr")).toBe("https://madcityzen.fr");
  });

  it("ne sépare jamais un montant de son signe", () => {
    // Ni le montant de sa monnaie, ni la monnaie de son régime de taxe : la
    // ligne peut se couper avant « 15 », jamais à l'intérieur.
    expect(normaliserTypographie("Supplément de 15€ HT")).toBe(
      `Supplément de 15${NBSP}€${NBSP}HT`,
    );
    expect(normaliserTypographie("800€ HT")).toBe(`800${NBSP}€${NBSP}HT`);
    expect(normaliserTypographie("1 590 € TTC")).toBe(`1${NBSP}590${NBSP}€${NBSP}TTC`);
    expect(normaliserTypographie("majoré de 15%")).toBe(`majoré de 15${NBSP}%`);
  });

  it("aère les montants à quatre chiffres", () => {
    expect(normaliserTypographie("2790€")).toBe(`2${NBSP}790${NBSP}€`);
  });

  it("détache l'unité collée à l'euro et redresse le kilomètre", () => {
    expect(normaliserTypographie("Forfait de 1€HT/Km A/R")).toBe(
      `Forfait de 1${NBSP}€${NBSP}HT/km A/R`,
    );
  });

  it("remplace l'apostrophe droite et le tiret d'incise", () => {
    expect(normaliserTypographie("l'activité - incluse")).toBe("l’activité – incluse");
  });
});

describe("intituleSection", () => {
  it("cesse de crier, le style s'en charge", () => {
    expect(intituleSection("FRAIS DE DEPLACEMENT")).toBe("Frais de deplacement");
    expect(intituleSection("STAFF")).toBe("Staff");
  });

  it("respecte un intitulé déjà composé", () => {
    expect(intituleSection("Matériel fourni")).toBe("Matériel fourni");
  });
});

describe("majusculeInitiale", () => {
  it("ne touche qu'au premier caractère", () => {
    expect(majusculeInitiale("encadrés par un artiste")).toBe("Encadrés par un artiste");
    expect(majusculeInitiale("MadCityZen fournit")).toBe("MadCityZen fournit");
  });
});
