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
 * Ville affichee au client sur la ligne de frais de deplacement.
 *
 * Elle differe volontairement du point de depart facture : les devis
 * MadCityZen annoncent « Paris > Ville > Paris » depuis toujours, et le client
 * n'a pas a connaitre l'adresse du depot. Seul le calcul part de Courbevoie.
 */
export const DEPART_LIBELLE_CLIENT = "Paris";

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

/**
 * Rappel d'engagement, porte par le devis, la page publique et les relances.
 *
 * MadCityZen ne pose pas d'option et ne tient pas de date : seuls l'acceptation
 * du devis et le versement de l'acompte engagent les equipes. La mention est
 * centralisee ici pour qu'aucun texte commercial ne puisse la contredire — une
 * relance promettant de « bloquer la date » irait contre l'article 3 des
 * conditions generales de vente.
 */
export const MENTION_ENGAGEMENT =
  "Ce devis ne constitue pas une réservation. Nous ne posons pas d'option : " +
  "seuls l'acceptation du devis et le versement de l'acompte garantissent la " +
  "disponibilité de nos équipes à la date retenue.";

/**
 * Bareme d'annulation, article 9 des conditions generales de vente.
 *
 * Affiche sur le devis et sur la page publique, et non renvoye au seul PDF
 * annexe : l'acceptation engage immediatement, le client doit avoir ces
 * chiffres sous les yeux au moment ou il valide.
 */
export const BAREME_ANNULATION = [
  { delai: "De la signature jusqu'à 30 jours avant", partTTCPct: 50 },
  { delai: "Du 29e au 8e jour avant", partTTCPct: 75 },
  { delai: "À partir du 7e jour avant", partTTCPct: 100 },
] as const;

/**
 * Delai au-dela duquel une baisse du nombre de participants ne diminue plus le
 * prix (article 6 des conditions generales).
 */
export const DELAI_MODIFICATION_PAX_JOURS = 15;

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
