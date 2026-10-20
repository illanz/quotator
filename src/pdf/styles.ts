/**
 * Gabarit du devis imprime.
 *
 * Le document reprend la structure du devis de reference — en-tete, colonnes
 * Designation / TVA / PU HT / Qte / Total HT, pied legal repete — mais pas sa
 * mise en page : celle-ci etait imposee par facturation.pro, qui n'offrait
 * aucun reglage. Les choix faits ici sont ceux d'un document commercial compose
 * plutot que d'un formulaire rempli.
 *
 * Trois partis pris :
 *
 * 1. Une seule famille de caracteres, trois graisses. La hierarchie se fait par
 *    la taille, la couleur et l'espace, pas par l'accumulation de styles.
 * 2. Pas de justification. Sur une colonne de 300 points, elle creuse des
 *    rivieres de blanc plus genantes qu'un bord droit irregulier.
 * 3. Pas de filets verticaux dans les tableaux. L'alignement des colonnes suffit
 *    a les separer ; les traits ajoutent du bruit et vieillissent le document.
 */

import { StyleSheet } from "@react-pdf/renderer";
import { FAMILLE } from "./fontes";

export const COULEURS = {
  encre: "#231F20",
  secondaire: "#5c5c63",
  discret: "#8a8a92",
  filet: "#e2e2e7",
  filetFort: "#c9c9d1",
  fond: "#f6f6f8",
  accent: "#C8699C",
} as const;

/** Largeur utile de la page : A4 moins les marges laterales. */
export const LARGEUR_UTILE = 595.28 - 2 * 44;

/** Colonnes du tableau de prestations, en points. */
export const COLONNES = {
  tva: 36,
  pu: 68,
  quantite: 30,
  total: 76,
} as const;

/**
 * Interligne courant du document.
 *
 * Il est applique style par style, et surtout pas sur la page : un interligne
 * herite de la page fait disparaitre les elements dont le contenu depend du
 * numero de page — le folio du pied, calcule apres la pagination — sans aucune
 * erreur ni avertissement. Le bloc entier qui les contient disparait avec eux.
 */
const INTERLIGNE = 1.45;

export const styles = StyleSheet.create({
  page: {
    fontFamily: FAMILLE,
    fontSize: 9,
    color: COULEURS.encre,
    paddingTop: 112,
    paddingBottom: 58,
    paddingHorizontal: 44,
  },

  // ----------------------------------------------------------- bandeau repete

  // Le bandeau et le pied sont en position absolue : le texte de la page
  // defilerait dessous. Ce sont les marges hautes et basses de la page qui les
  // tiennent a distance, et non un fond opaque — un fond pose sur un element
  // fixe masque ses propres enfants.
  bandeau: {
    position: "absolute",
    top: 30,
    left: 44,
    right: 44,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 0.75,
    borderBottomColor: COULEURS.filet,
  },
  logo: { width: 86 },
  bandeauReference: {
    fontSize: 8,
    lineHeight: 1.4,
    color: COULEURS.secondaire,
    textAlign: "right",
  },

  pied: {
    position: "absolute",
    bottom: 22,
    left: 44,
    right: 44,
    paddingTop: 6,
    borderTopWidth: 0.75,
    borderTopColor: COULEURS.filet,
  },
  piedLegal: { fontSize: 6, lineHeight: 1.35, color: COULEURS.discret, textAlign: "center" },
  piedPage: {
    position: "absolute",
    bottom: 11,
    left: 44,
    right: 44,
    fontSize: 6,
    color: COULEURS.discret,
    textAlign: "center",
  },

  // --------------------------------------------------------------- en-tete p.1

  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  partie: { width: 232 },
  partieEtiquette: {
    fontSize: 6.5,
    lineHeight: 1.3,
    letterSpacing: 1.1,
    color: COULEURS.discret,
    marginBottom: 4,
  },
  partieNom: { fontSize: 10.5, lineHeight: 1.35, fontWeight: 700 },
  partieLigne: { fontSize: 9, lineHeight: INTERLIGNE, color: COULEURS.secondaire },

  objet: { marginBottom: 18 },
  objetEtiquette: {
    fontSize: 6.5,
    lineHeight: 1.3,
    letterSpacing: 1.1,
    color: COULEURS.accent,
    marginBottom: 5,
  },
  titre: { fontSize: 15, lineHeight: 1.25, fontWeight: 700, marginBottom: 4 },
  contexte: { fontSize: 9, lineHeight: INTERLIGNE, color: COULEURS.secondaire },

  references: { flexDirection: "row", marginBottom: 20, gap: 28 },
  reference: {},
  referenceEtiquette: {
    fontSize: 6.5,
    lineHeight: 1.3,
    letterSpacing: 1.1,
    color: COULEURS.discret,
  },
  referenceValeur: { fontSize: 9.5, lineHeight: 1.35, fontWeight: 700 },

  // ------------------------------------------------------------------ sections

  section: { marginBottom: 15 },
  sectionTitre: {
    fontSize: 7,
    lineHeight: 1.3,
    letterSpacing: 1.3,
    color: COULEURS.accent,
    marginBottom: 7,
  },
  paragraphe: { fontSize: 9, lineHeight: 1.5, marginBottom: 6 },

  // ------------------------------------------------------------------ tableaux

  enTete: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COULEURS.filetFort,
    paddingBottom: 4,
  },
  enTeteCellule: {
    fontSize: 6.5,
    lineHeight: 1.3,
    letterSpacing: 0.9,
    color: COULEURS.secondaire,
  },

  ligne: {
    flexDirection: "row",
    paddingTop: 9,
    paddingBottom: 9,
    borderBottomWidth: 0.75,
    borderBottomColor: COULEURS.filet,
  },
  ligneAnnexe: {
    flexDirection: "row",
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 12,
  },
  cellule: { flex: 1, paddingRight: 10, fontSize: 9, lineHeight: INTERLIGNE },
  celluleNombre: { textAlign: "right", fontSize: 9, lineHeight: INTERLIGNE },
  montant: { fontWeight: 700 },
  annexeLibelle: { fontSize: 8.5, lineHeight: 1.4, color: COULEURS.secondaire },

  // ------------------------------------------------- composition des prestations

  intitule: { fontSize: 10, fontWeight: 700, lineHeight: 1.3, marginBottom: 5 },
  blocSection: { marginTop: 5 },
  blocSectionTitre: {
    fontSize: 6.5,
    lineHeight: 1.3,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: COULEURS.discret,
    marginBottom: 2,
  },
  puceLigne: { flexDirection: "row", marginBottom: 1 },
  puce: { width: 9, fontSize: 8.5, lineHeight: 1.4, color: COULEURS.filetFort },
  puceTexte: { flex: 1, fontSize: 8.5, lineHeight: 1.4, color: COULEURS.secondaire },
  texteSimple: { fontSize: 8.5, lineHeight: 1.4, color: COULEURS.secondaire },

  // -------------------------------------------------------------------- totaux

  totaux: { alignSelf: "flex-end", width: 250, marginTop: 14 },
  totalLigne: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
  totalLibelle: { fontSize: 9, lineHeight: 1.4, color: COULEURS.secondaire },
  totalValeur: { fontSize: 9, lineHeight: 1.4, textAlign: "right" },
  totalFort: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COULEURS.encre,
  },
  totalFortLibelle: { fontSize: 9, lineHeight: 1.35, letterSpacing: 0.6, color: "#ffffff" },
  totalFortValeur: { fontSize: 11, lineHeight: 1.35, fontWeight: 700, color: "#ffffff" },

  // ------------------------------------------------------------------- options

  /**
   * Appel sous le total.
   *
   * Les animations complementaires suivent dans le fil du document, mais c'est
   * sur le total que l'oeil s'arrete : sans un mot a cet endroit, elles
   * resteraient invisibles de qui ne fait que verifier le montant.
   */
  appelOptions: {
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 0.75,
    borderTopColor: COULEURS.filet,
    fontSize: 8,
    lineHeight: 1.45,
    color: COULEURS.accent,
  },

  // La scission avec la proposition ferme doit se voir : un filet plein, un
  // bandeau teinte, et de l'air au-dessus.
  optionsSection: { marginTop: 10, marginBottom: 18 },
  optionsBandeau: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: COULEURS.fond,
    borderLeftWidth: 2.5,
    borderLeftColor: COULEURS.accent,
  },
  optionsBandeauTitre: {
    fontSize: 8,
    lineHeight: 1.3,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  optionsBandeauTexte: {
    fontSize: 8,
    lineHeight: 1.45,
    color: COULEURS.secondaire,
    marginTop: 2,
  },
  optionsSommaire: { marginTop: 8, marginBottom: 4 },
  optionsSommaireLigne: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.75,
    borderBottomColor: COULEURS.filet,
  },
  optionsSommaireNom: { flex: 1, fontSize: 9, lineHeight: 1.4, paddingRight: 10 },
  optionsSommairePrix: { fontSize: 9, lineHeight: 1.4, fontWeight: 700, textAlign: "right" },

  option: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 0.75,
    borderTopColor: COULEURS.filetFort,
  },
  optionEnTete: { marginBottom: 10 },
  // Sans colonne de prix a sa droite, la designation d'une option occuperait
  // toute la largeur de la page : une ligne de cent caracteres se lit mal. La
  // mesure reste celle des prestations fermes.
  optionCorps: { maxWidth: 360 },
  optionEtiquette: {
    fontSize: 6.5,
    lineHeight: 1.3,
    letterSpacing: 1.1,
    color: COULEURS.accent,
  },
  optionPrix: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 10,
    paddingTop: 7,
    borderTopWidth: 0.75,
    borderTopColor: COULEURS.filet,
  },
  optionPrixLibelle: { fontSize: 9, lineHeight: 1.4, color: COULEURS.secondaire },
  optionPrixValeur: { fontSize: 12, lineHeight: 1.3, fontWeight: 700 },

  // Ferme la partie commerciale et ouvre les conditions : sans cette coupure,
  // le prix d'une option et le premier engagement se suivent sans transition.
  conditions: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COULEURS.filetFort,
  },

  // ------------------------------------------------------- encadres et mentions

  encadre: {
    padding: 11,
    backgroundColor: COULEURS.fond,
    borderLeftWidth: 2.5,
    borderLeftColor: COULEURS.accent,
    marginBottom: 14,
  },
  encadreTexte: { fontSize: 9, lineHeight: INTERLIGNE },

  mention: { fontSize: 7.5, lineHeight: 1.5, color: COULEURS.secondaire, marginBottom: 3 },
  banque: {
    padding: 10,
    borderWidth: 0.75,
    borderColor: COULEURS.filet,
    marginBottom: 12,
  },
  banqueTexte: { fontSize: 8.5, lineHeight: 1.5, color: COULEURS.secondaire },
  banqueLigne: { flexDirection: "row", alignItems: "baseline", marginTop: 3 },
  banqueEtiquette: {
    width: 34,
    fontSize: 6.5,
    lineHeight: 1.6,
    letterSpacing: 1,
    color: COULEURS.discret,
  },
  // L'IBAN se lit chiffre a chiffre : un peu d'approche le rend recopiable.
  banqueValeur: { fontSize: 10, lineHeight: 1.4, fontWeight: 700, letterSpacing: 0.4 },

  // ------------------------------------------------------------ bon pour accord

  accord: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  accordColonne: { flex: 1 },
  accordConsigne: { fontSize: 8, lineHeight: 1.45, color: COULEURS.secondaire },
  accordCadre: {
    marginTop: 8,
    height: 78,
    borderWidth: 0.75,
    borderColor: COULEURS.filetFort,
    padding: 8,
  },
  accordChamp: { fontSize: 7.5, lineHeight: 1.35, color: COULEURS.discret, marginBottom: 11 },
});
