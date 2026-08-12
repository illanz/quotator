import type { Cents } from "@/domain/money";
import type { Palier } from "@/domain/paliers";

/**
 * Nature d'une cellule de la grille.
 *
 * La grille ne contient pas que des nombres : « Nous consulter », « sur
 * demande », des tirets, des croix, et des phrases entieres decrivant un
 * forfait. Chaque cas doit rester distinct — confondre une cellule vide avec un
 * prix a zero produirait un devis a 0 €.
 */
export type CelluleKind =
  | "PRIX"
  | "CONSULTER"
  | "SUR_DEMANDE"
  | "INDISPONIBLE"
  | "TEXTE"
  | "VIDE";

export type Cellule = {
  palier: Palier;
  kind: CelluleKind;
  /** Renseigne uniquement quand `kind === "PRIX"`. */
  prixCents?: Cents;
  /** Texte source, conserve tel quel pour affichage au commercial. */
  texte?: string;
};

/**
 * Regime tarifaire d'une animation.
 *
 * PALIER  : un prix par tranche de participants, lisible mecaniquement.
 * FORFAIT : une regle en texte libre (« 1 590 € + prix des goodies. Capacite 12
 *           participants en simultane. Artiste supp = + 800 € »). Non parsable
 *           sans risque : le prix est saisi a la main, la regle est affichee.
 */
export type Regime = "PALIER" | "FORFAIT";

export type LigneGrille = {
  /** Numero de ligne dans l'Excel, pour pointer l'erreur a l'utilisateur. */
  ligneSource: number;
  /** Libelle brut de la colonne A (« GRAFFITI (indoor : + 15€/ pax) »). */
  libelle: string;
  /** Libelle normalise, sert de cle de rapprochement entre deux millesimes. */
  cle: string;
  /** En-tete de premier niveau : « ARTISTIQUE ET CREATIVITE », « HIGH TECH »… */
  famille: string | null;
  /**
   * En-tete de second niveau, recurrent d'une famille a l'autre :
   * « ACTIVITES TEAM BUILDING COLLECTIVES » ou « ANIMATIONS EVENEMENTIELLES -
   * LIBRE ACCES - SOIREE ».
   */
  categorie: string | null;
  /**
   * Animation vendue en libre acces, deduite du sous-groupe.
   *
   * Ces animations n'ont pas de jauge de participants : le devis porte une
   * plage horaire a la place du nombre de pax, et le moteur ne doit pas
   * chercher de palier.
   */
  libreAcces: boolean;
  regime: Regime;
  cellules: Cellule[];
  /** Regle en texte libre, pour le regime FORFAIT. */
  regleForfait?: string;
};

export type GrilleParsee = {
  /** Nom du fichier importe. */
  fichier: string;
  /** Version relevee en pied de grille (ex. « V. 251215 »), si presente. */
  version: string | null;
  /** Millesime deduit du texte de validite (ex. 2026). */
  millesime: number | null;
  lignes: LigneGrille[];
  /** Notes de bas de grille : majorations, province, options transverses. */
  regles: string[];
  /** Anomalies rencontrees a l'import, a montrer avant validation. */
  avertissements: string[];
};
