import { describe, expect, it } from "vitest";
import { prochaineRelance, type EtatDevis } from "./sequence";

const ENVOI = new Date("2026-10-01T09:00:00Z");

/** `jour` compte les jours depuis l'envoi. */
const a = (jour: number, heure = 10) =>
  new Date(ENVOI.getTime() + jour * 86_400_000 + (heure - 9) * 3_600_000);

function devis(partiel: Partial<EtatDevis> = {}): EtatDevis {
  return {
    statut: "ENVOYE",
    envoyeLe: ENVOI,
    valableAu: "2026-10-31",
    derniereOuverture: null,
    ouvert: false,
    derniereRelance: null,
    ...partiel,
  };
}

describe("prochaineRelance", () => {
  it("ne relance pas un brouillon", () => {
    expect(prochaineRelance(devis({ envoyeLe: null }), a(10))).toEqual({
      envoyer: false,
      motif: "PAS_ENVOYE",
    });
  });

  it("s'arrête dès que le client a agi", () => {
    for (const statut of ["ACCEPTE", "REFUSE", "EN_DISCUSSION", "ANNULE"]) {
      expect(prochaineRelance(devis({ statut }), a(10))).toEqual({
        envoyer: false,
        motif: "CLIENT_A_AGI",
      });
    }
  });

  it("attend le deuxième jour avant la première relance", () => {
    expect(prochaineRelance(devis(), a(1))).toEqual({ envoyer: false, motif: "TROP_TOT" });
    const d = prochaineRelance(devis(), a(2));
    expect(d.envoyer && d.etape.cle).toBe("VERIFICATION");
  });

  it("vérifie la bonne réception seulement si le devis n'a pas été ouvert", () => {
    // Ouvert : vérifier que le message est arrivé n'aurait aucun sens.
    const ouvert = devis({ ouvert: true, derniereOuverture: a(1) });
    expect(prochaineRelance(ouvert, a(2))).toEqual({ envoyer: false, motif: "TROP_TOT" });
    const d = prochaineRelance(ouvert, a(4));
    expect(d.envoyer && d.etape.cle).toBe("QUESTIONS");
  });

  it("saute les questions si le devis n'a jamais été ouvert", () => {
    const jamais = devis({ derniereRelance: { rang: 1, le: a(2) } });
    // J+4 : l'étape « questions » exige une ouverture, elle est passée.
    expect(prochaineRelance(jamais, a(4))).toEqual({ envoyer: false, motif: "TROP_TOT" });
    const d = prochaineRelance(jamais, a(8));
    expect(d.envoyer && d.etape.cle).toBe("VALEUR");
  });

  it("n'empile jamais deux messages non lus", () => {
    // Relance au 6e jour, jamais rouverte : la suivante attend quatre jours de
    // plus, même si sa date est atteinte.
    const sansLecture = devis({ ouvert: true, derniereOuverture: a(1), derniereRelance: { rang: 2, le: a(6) } });
    expect(prochaineRelance(sansLecture, a(8))).toEqual({
      envoyer: false,
      motif: "ATTEND_UNE_LECTURE",
    });
    const d = prochaineRelance(sansLecture, a(10));
    expect(d.envoyer && d.etape.cle).toBe("VALEUR");
  });

  it("repart à sa date si le client a rouvert entre-temps", () => {
    const relu = devis({
      ouvert: true,
      derniereRelance: { rang: 2, le: a(6) },
      derniereOuverture: a(7),
    });
    const d = prochaineRelance(relu, a(8));
    expect(d.envoyer && d.etape.cle).toBe("VALEUR");
  });

  it("déroule la séquence dans l'ordre", () => {
    const vu = { ouvert: true, derniereOuverture: a(1) };
    const attendus: Array<[number, number, string]> = [
      [2, 4, "QUESTIONS"],
      [3, 8, "VALEUR"],
      [4, 15, "DISPONIBILITE"],
      [5, 25, "ECHEANCE"],
    ];
    for (const [rangPrecedent, jour, cle] of attendus) {
      const etat = devis({
        ...vu,
        derniereRelance:
          rangPrecedent > 1 ? { rang: rangPrecedent - 1, le: a(jour - 6) } : null,
        derniereOuverture: a(jour - 1),
      });
      const d = prochaineRelance(etat, a(jour));
      expect(d.envoyer && d.etape.cle).toBe(cle);
    }
  });

  it("rejoint le calendrier plutôt que de dérouler son retard", () => {
    // Le client ouvre son devis au quinzième jour. Lui envoyer « des questions
    // sur votre animation ? », prévu pour le quatrième, puis deux jours plus
    // tard le message du huitième, lui ferait lire un rattrapage décalé dont
    // chaque message parle d'un moment déjà passé.
    const ouvertTard = devis({
      ouvert: true,
      derniereOuverture: a(15),
      derniereRelance: { rang: 1, le: a(2) },
    });
    const d = prochaineRelance(ouvertTard, a(15));
    expect(d.envoyer && d.etape.cle).toBe("DISPONIBILITE");

    // Et la suite reprend normalement, sans rejouer ce qui a été sauté.
    const apres = devis({
      ouvert: true,
      derniereOuverture: a(16),
      derniereRelance: { rang: 4, le: a(15) },
    });
    const e = prochaineRelance(apres, a(25));
    expect(e.envoyer && e.etape.cle).toBe("ECHEANCE");
  });

  it("ne relance plus un devis expiré, sauf pour le clore", () => {
    const expire = devis({
      ouvert: true,
      derniereOuverture: a(20),
      derniereRelance: { rang: 4, le: a(15) },
      statut: "EXPIRE",
    });
    // Au 25e jour l'échéance serait due, mais le devis est déjà périmé :
    // relancer reviendrait à vendre un prix qui n'est plus garanti. L'étape est
    // passée, et la seule qui reste — la clôture — n'est pas encore due.
    expect(prochaineRelance(expire, a(25))).toEqual({
      envoyer: false,
      motif: "TROP_TOT",
    });
    const d = prochaineRelance(expire, a(31));
    expect(d.envoyer && d.etape.cle).toBe("CLOTURE");
  });

  it("n'envoie pas la clôture tant que la validité court", () => {
    const tardif = devis({
      ouvert: true,
      derniereOuverture: a(26),
      derniereRelance: { rang: 5, le: a(25) },
      valableAu: "2026-12-31",
    });
    expect(prochaineRelance(tardif, a(31))).toEqual({
      envoyer: false,
      motif: "VALIDITE_COURANTE",
    });
  });

  it("se tait une fois la séquence épuisée", () => {
    const fini = devis({
      statut: "EXPIRE",
      ouvert: true,
      derniereOuverture: a(30),
      derniereRelance: { rang: 6, le: a(31) },
    });
    expect(prochaineRelance(fini, a(60))).toEqual({
      envoyer: false,
      motif: "SEQUENCE_TERMINEE",
    });
  });
});
