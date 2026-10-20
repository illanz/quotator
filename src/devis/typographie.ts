/**
 * Normalisation typographique des textes herites.
 *
 * Quinze ans de saisie dans un champ sans mise en forme ont laisse des
 * conventions anglo-saxonnes dans des textes francais : guillemets droits,
 * apostrophes verticales, deux-points colles au mot precedent, montants sans
 * espace avant l'euro. Rien de tout cela ne se voit a la saisie ; tout se voit
 * une fois compose sur un devis.
 *
 * Ces regles sont celles de la typographie francaise courante, appliquees
 * mecaniquement et sans exception : elles ne changent pas le sens, seulement
 * la tenue.
 */

/** Espace fine insecable : avant ; : ! ? et dans les montants. */
const FINE = " ";
/** Espace insecable : entre un nombre et son unite. */
const INSECABLE = " ";

/**
 * Milliers d'un montant, reperes a l'euro qui les suit.
 *
 * Le separateur est pose quand il manque, et rendu insecable quand la saisie
 * l'a mis en espace ordinaire : « 1 590 € » coupe en fin de ligne laisse un
 * « 1 » orphelin et un « 590 € » qui se lit comme le montant entier.
 */
const MILLIERS = new RegExp(`\\b(\\d{1,3})[ ${INSECABLE}]?(\\d{3})(?=[ ${INSECABLE}]?€)`, "g");

/** Marque de pouce : « écran 50" sur pied ». Ce n'est pas un guillemet. */
const POUCE = /(\d\s*)"/g;
/** Sentinelle le temps du traitement ; aucun texte du catalogue ne la contient. */
const POUCE_GARDE = "\u0001";

/** Paire de guillemets droits, sur une meme ligne. */
const PAIRE = /"\s*([^"\n]*?)\s*"/g;

/**
 * Guillemet ouvrant sans fermante, ferme a la fin de son segment.
 *
 * Un segment s'arrete a un tiret entoure d'espaces, a une virgule ou a la fin
 * de la ligne : « Street Art "Graffiti - Duree : 2h30 » devient « Street Art
 * « Graffiti » - Duree : 2h30 », et non un guillemet avalant la duree.
 */
const ORPHELIN = /"\s*([^"\n]+?)\s*(?=\s[-–—]\s|,|$)/g;

/**
 * Remplace les guillemets droits par des guillemets francais.
 *
 * Trois cas, dans cet ordre, parce qu'ils se recouvrent :
 *
 * 1. Les marques de pouce sont mises de cote. Un chiffre suivi d'un guillemet
 *    droit est une mesure, pas une citation : « ecran 50" sur pied » n'ouvre
 *    rien. Elles sont rendues telles quelles — le vrai symbole typographique,
 *    la double prime, manque a la fonte embarquee.
 * 2. Les paires d'abord, pour que « "GraffWall - Animation Street Art" » soit
 *    reconnue comme un tout malgre le tiret qu'elle contient.
 * 3. Ce qui reste est un guillemet ouvrant que la saisie n'a jamais referme.
 *    Quinze ans de catalogue en comptent deux ; les fermer vaut mieux que les
 *    laisser s'afficher droits au milieu d'un texte compose.
 */
function guillemets(texte: string): string {
  return texte
    .replace(POUCE, `$1${POUCE_GARDE}`)
    .replace(PAIRE, `«${FINE}$1${FINE}»`)
    .replace(ORPHELIN, `«${FINE}$1${FINE}»`)
    .replace(new RegExp(POUCE_GARDE, "g"), '"');
}

export function normaliserTypographie(texte: string): string {
  return (
    guillemets(texte)
      // Apostrophe typographique, sauf dans un mot deja compose.
      .replace(/'/g, "’")
      // Espace fine insecable avant la ponctuation double, sauf dans une URL.
      .replace(/\s*:(?!\/\/)/g, `${FINE}:`)
      .replace(/\s*([;!?])/g, `${FINE}$1`)
      // Les montants et pourcentages ne se separent pas de leur signe.
      .replace(/(\d)\s*€/g, `$1${INSECABLE}€`)
      .replace(/(\d)\s*%/g, `$1${INSECABLE}%`)
      // « 1€HT/Km » : l'unite se detache, et le kilometre ne prend pas de
      // majuscule.
      // « 500 € HT » ne se coupe pas entre la monnaie et le regime de taxe,
      // que la saisie ait mis une espace ou non.
      .replace(/€\s*(HT|TTC)\b/gi, `€${INSECABLE}$1`)
      .replace(/\/\s*Km\b/g, "/km")
      // Separateur de milliers dans les montants a quatre chiffres et plus.
      .replace(MILLIERS, `$1${INSECABLE}$2`)
      // Un tiret entre deux mots est un tiret demi-cadratin, pas un signe moins.
      .replace(/ - /g, " – ")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}

/**
 * Met une majuscule initiale sans toucher au reste.
 *
 * Les intitules du catalogue arrivent parfois tout en capitales : les abaisser
 * entierement casserait les noms propres et les sigles.
 */
export function majusculeInitiale(texte: string): string {
  if (texte === "") return texte;
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/**
 * Intitule de section presentable.
 *
 * Le catalogue ecrit « FRAIS DE DEPLACEMENT » ; un devis compose n'a pas besoin
 * de crier. Les capitales sont rendues par le style, pas par le texte.
 */
export function intituleSection(texte: string): string {
  const sansAccent = texte.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const toutCapitales = sansAccent === sansAccent.toUpperCase();
  return majusculeInitiale(toutCapitales ? texte.toLowerCase() : texte);
}
