/**
 * Regles commerciales arbitrees, rassemblees en un seul endroit.
 *
 * Plusieurs de ces valeurs divergent de ce qu'affiche la grille Excel ou le
 * modele de devis actuel. Les ecarts sont documentes ici plutot que d'etre
 * disperses dans le code : ce sont ces mentions qu'il faudra corriger dans
 * l'Excel et dans les textes produits pour que les deux sources concordent.
 */

/**
 * Week-end et jours feries.
 *
 * La grille 2026 (ligne 71) annonce +10 %. La valeur commerciale retenue est
 * +15 %.
 */
export const MAJORATION_WEEKEND_PCT = 15;

/** Frais kilometriques : 1 € HT du kilometre aller-retour. */
export const PRIX_KM_CENTS = 100;

/**
 * Point de depart facture pour les kilometres.
 *
 * La grille dit « depart et retour Courbevoie (92) », le modele de devis dit
 * « au depart de Paris 1er ». C'est Courbevoie qui fait foi.
 */
export const DEPART_CODE_POSTAL = "92400";
export const DEPART_VILLE = "Courbevoie";

/**
 * Departements sans frais de deplacement.
 *
 * La grille annonce « toute l'Ile-de-France » ; le perimetre reellement
 * applique est Paris et la petite couronne.
 */
export const DEPARTEMENTS_INCLUS = ["75", "92", "93", "94"] as const;

/** Taux de TVA par defaut. Le 0 % existe, mais reste exceptionnel. */
export const TVA_DEFAUT_PCT = 20;

/** Duree de validite d'un devis, en jours. */
export const VALIDITE_JOURS = 30;

/** Acompte demande a l'acceptation, en pourcentage du TTC. */
export const ACOMPTE_PCT = 70;

/** Premier numero emis par l'outil, dans la continuite de facturation.pro. */
export const PREMIER_NUMERO_DEVIS = 19803;

/** Forfait de stationnement dans Paris intra-muros. */
export const STATIONNEMENT_PARIS_CENTS = 8000;

/** Suppléments province, saisis manuellement mais rappeles au commercial. */
export const PROVINCE = {
  /** Par staff et par tranche de 8 h ouvrees, au-dela de la premiere journee. */
  immobilisationCents: 25000,
  /** Par repas et par staff. */
  repasCents: 2500,
  /** Par nuitee et par staff. */
  hebergementCents: 15000,
} as const;
