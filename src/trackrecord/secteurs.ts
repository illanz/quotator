/**
 * Classement sectoriel des clients, a partir de leur raison sociale.
 *
 * L'export facturation.pro ne porte aucune information de secteur, et 90 % des
 * clients factures n'ont pas de SIRET exploitable : l'annuaire des entreprises
 * ne peut donc pas etre interroge pour la majorite d'entre eux. Le classement
 * se fait par mots-cles sur le nom, ce qui donne une premiere passe fiable sur
 * les cas evidents et laisse le reste a classer a la main.
 *
 * Un point de methode important pour l'usage commercial : une part notable du
 * chiffre d'affaires passe par des **agences**, qui commandent pour un client
 * final dont le secteur n'apparait nulle part. Elles sont donc classees comme
 * agences, et non rangees dans un secteur : dire a un prospect industriel
 * « nous avons deja travaille pour une agence » n'a aucune valeur d'argument.
 */

export type Secteur =
  | "Agence événementielle"
  | "Banque, assurance, finance"
  | "Santé, pharmacie"
  | "Industrie, énergie"
  | "Tech, numérique, télécom"
  | "Conseil, audit, juridique"
  | "Immobilier, construction"
  | "Distribution, grande conso"
  | "Transport, logistique"
  | "Média, publicité, communication"
  | "Luxe, mode, beauté"
  | "Secteur public, collectivité"
  | "Association, fondation"
  | "Éducation, formation"
  | "Hôtellerie, restauration, tourisme"
  | "Automobile"
  | "Non classé";

type Regle = { secteur: Secteur; motifs: RegExp };

/**
 * L'ordre compte : la premiere regle qui correspond l'emporte. Les agences sont
 * testees en premier, car beaucoup portent dans leur nom un mot appartenant a
 * un autre secteur (« BNP Paribas Events » est une agence interne, pas une
 * banque cliente).
 */
const REGLES: Regle[] = [
  {
    secteur: "Agence événementielle",
    motifs:
      /\bagence\b|\bevent|\bmice\b|incentive|seminaire|receptif|dmc\b|traiteur|voyages? d'affaires|business travel|\btravel\b|congres|convention|roadshow|team ?building|animation|production evenement|mci group|publicis event|cwt|hogg robinson|carlson wagonlit|ideal meetings|funbooker|lever de rideau|novabox|creative spirit|wmh project|capdel|one experience|7eme sud|awakit|agora voyages|mktg|digital day|gp explorer|egg\b/i,
  },
  {
    secteur: "Média, publicité, communication",
    motifs:
      /\bmedia|\bpresse\b|publicit|\bcom'?\b|communication|\bpub\b|editions?\b|television|\btv\b|radio|journal|magazine|havas|omnicom|dentsu|tbwa|ogilvy|\bbbdo\b/i,
  },
  {
    secteur: "Banque, assurance, finance",
    motifs:
      /banque|\bbank\b|\bbnp\b|societe generale|credit agricole|\bca\b consumer|caisse d'epargne|\bbpce\b|\blcl\b|\bhsbc\b|natixis|amundi|\bcic\b|banque populaire|assurance|assureur|\baxa\b|allianz|generali|\bmaif\b|\bmacif\b|matmut|\bmma\b|groupama|\bmutuelle|\bcnp\b|swiss ?life|\bapicil\b|malakoff|\bag2r\b|klesia|\bagirc|prevoyance|gestion d'actifs|asset management|\bfinance|\bfintech|courtage|\bbourse\b|\bcredit\b/i,
  },
  {
    secteur: "Santé, pharmacie",
    motifs:
      /pharma|\bsante\b|\bmedic|hopital|\bchu\b|clinique|laboratoire|\blabo\b|biotech|\bsanofi|novartis|pfizer|roche\b|\bmsd\b|astrazeneca|\bbayer\b|servier|ipsen|biogen|\bglaxo|\bgsk\b|\bmerck|\bboiron|\bdiagnostic|\bortho|dentaire|\bvet\b|veterinaire|\behpad\b|\bmutualite\b/i,
  },
  {
    secteur: "Tech, numérique, télécom",
    motifs:
      /\bsoftware|\bsaas\b|\bcloud\b|\bdigital\b|\bnumerique\b|informatique|\bit services|\btelecom|\borange\b|\bsfr\b|bouygues telecom|\bfree\b|\bnokia\b|ericsson|\bibm\b|microsoft|\bgoogle\b|\bamazon\b|\bapple\b|\boracle\b|\bsap\b|\bcisco\b|\bdell\b|\bintel\b|\batos\b|capgemini|\bsopra|\binetum|\bcgi\b|\bdevoteam|\bopen\b|\bsii\b|\balten\b|\bakka\b|\bexpleo\b|\btech\b|\bdata\b|\bcyber|\bstartup|\bplatform|\bsystem|\bsolutions?\b|\bnetwork|\bhosting|\bhebergeur|\badista\b|\bovh\b|\bscaleway|\bdocaposte|\byousign|\bdoctolib|\bblablacar|\bcriteo|\bdailymotion/i,
  },
  {
    secteur: "Conseil, audit, juridique",
    motifs:
      /\bconseil\b|consulting|\bconsultant|\baudit\b|\bavocat|\bcabinet\b|\bnotaire|expertise comptable|expert-?comptable|\bkpmg\b|\bdeloitte\b|\bey\b|ernst ?& ?young|\bpwc\b|\bmazars\b|\bgrant thornton|\bbcg\b|mckinsey|\bbain\b|accenture|\bwavestone|\beurogroup|\bsia partners|\bstrategy\b|\brh\b|ressources humaines|recrutement|\bstaffing/i,
  },
  {
    secteur: "Immobilier, construction",
    motifs:
      /immobilier|\bimmo\b|\bfoncier|\bpromotion\b|\bbtp\b|construction|batiment|\btravaux\b|\barchitect|\bbouygues\b|\bvinci\b|\beiffage\b|\bspie\b|\bcolas\b|\bnexity\b|\bkaufman|\bicade\b|\bgecina\b|\bunibail|\bklepierre|\bfoncia\b|\bnexta|\bsyndic|\bhlm\b|\bhabitat\b|\blogement/i,
  },
  {
    secteur: "Distribution, grande conso",
    motifs:
      /\bcarrefour|\bauchan\b|\bleclerc\b|\bintermarche|\bcasino\b|\bmonoprix|\bfranprix|\blidl\b|\baldi\b|\bmetro\b|\bpicard\b|\bdecathlon|\bfnac\b|\bdarty\b|\bboulanger|\bikea\b|\bleroy merlin|\bcastorama|\bbricorama|\bconforama|\bdistribution\b|\bretail\b|\bgrande surface|\bsupermarch|\bhypermarch|\bmagasins?\b|\bfranchise\b|\bdanone\b|\bnestle\b|\bunilever|\bmars\b|\bferrero|\bpepsi|\bcoca|\bheineken|\bpernod|\bbel\b|\blactalis|\bsodebo|\bbonduelle|\bpomona\b|\bagroaliment/i,
  },
  {
    secteur: "Luxe, mode, beauté",
    motifs:
      /\bluxe\b|\blvmh\b|\bkering\b|\bchanel\b|\bdior\b|\bhermes\b|\bcartier\b|\bvuitton|\bguerlain|\bsephora|\bloreal\b|\bl'oreal|\byves rocher|\bclarins|\bestee|\bmode\b|\bcouture\b|\bpret-a-porter|\bmaroquinerie|\bjoaillerie|\bhorlogerie|\bparfum|\bcosmetique|\bbeaute\b/i,
  },
  {
    secteur: "Automobile",
    motifs:
      /\bautomobile|\bauto\b|\brenault|\bpeugeot|\bcitroen|\bstellantis|\bvolkswagen|\btoyota\b|\bnissan\b|\bbmw\b|\bmercedes|\baudi\b|\bford\b|\bvaleo\b|\bfaurecia|\bmichelin|\bplastic omnium|\bconcession|\bgarage\b/i,
  },
  {
    secteur: "Transport, logistique",
    motifs:
      /\btransport|\blogistique|\bsupply chain|\bfret\b|\bmessagerie|\bsncf\b|\bratp\b|\bair france|\btransavia|\bgeodis\b|\bdhl\b|\bups\b|\bfedex\b|\bchronopost|\bla poste\b|\bstef\b|\bxpo\b|\bkuehne|\bbollore|\bcma cgm|\bport\b|\baeroport|\bcompagnie aerienne/i,
  },
  {
    secteur: "Industrie, énergie",
    motifs:
      /\bindustrie|\bindustriel|\busine\b|\bmanufactur|\bedf\b|\bengie\b|\btotal|\bveolia|\bsuez\b|\bsaint-gobain|\bschneider|\bthales\b|\bsafran\b|\bairbus\b|\bdassault|\bnaval group|\barcelor|\balstom\b|\bsiemens|\bgeneral electric|\babb\b|\blegrand\b|\bsomfy\b|\bsolvay|\barkema|\bair liquide|\benergie\b|\bnucleaire|\bpetrole|\bchimie\b|\bmetallurgie|\bplasturgie|\bemballage/i,
  },
  {
    secteur: "Hôtellerie, restauration, tourisme",
    motifs:
      /\bhotel|\bhospitality|\baccor\b|\bmarriott|\bhilton\b|\bibis\b|\bnovotel|\brestaurant|\brestauration|\bbrasserie|\bcafe\b|\btourisme|\bcamping|\bclub med|\bpierre & vacances|\bcasino de\b|\bloisirs\b|\bparc\b/i,
  },
  {
    secteur: "Secteur public, collectivité",
    motifs:
      /\bmairie\b|\bville de\b|\bcommune\b|\bdepartement\b|\bregion\b|\bprefecture|\bministere|\bconseil general|\bconseil departemental|\bconseil regional|\bcommunaute d'agglo|\bmetropole\b|\bccas\b|\bcaf\b|\bcpam\b|\burssaf|\bpole emploi|\bfrance travail|\bonisep|\bcnrs\b|\binserm|\bcea\b|\binra|\bifremer|\bademe|\bbpifrance|\bcaisse des depots|\bagence nationale|\betablissement public|\bprefet|\barmee\b|\bgendarmerie|\bpolice\b|\bpompiers/i,
  },
  {
    secteur: "Association, fondation",
    motifs:
      /\bassociation\b|\basso\b|\bfondation\b|\bong\b|\bcomite d'entreprise|\bcse\b|\bcomite social|\bamicale\b|\bfederation\b|\bsyndicat\b|\bunion\b|\bcroix-rouge|\bsecours populaire|\bunicef|\bwwf\b|\bemmaus|\bapf\b/i,
  },
  {
    secteur: "Éducation, formation",
    motifs:
      /\becole\b|\buniversite|\bcampus\b|\bformation\b|\bacademie\b|\binstitut\b|\bcollege\b|\blycee\b|\bmba\b|\bbusiness school|\bpolytechnique|\bcentrale\b|\bhec\b|\bessec\b|\bescp\b|\bedhec\b|\bsciences po|\bcfa\b|\bapprentissage/i,
  },
];

/** Normalise une raison sociale pour la comparaison. */
function normaliser(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9&']+/g, " ")
    .trim();
}

export type ClassementSecteur = {
  secteur: Secteur;
  /** Vrai quand le classement vient d'une regle, faux quand il reste a faire. */
  automatique: boolean;
};

export function classerSecteur(raisonSociale: string | null | undefined): ClassementSecteur {
  if (!raisonSociale) return { secteur: "Non classé", automatique: false };
  const nom = normaliser(raisonSociale);
  for (const regle of REGLES) {
    if (regle.motifs.test(nom)) return { secteur: regle.secteur, automatique: true };
  }
  return { secteur: "Non classé", automatique: false };
}

/** Un secteur qui ne dit rien du metier du client final. */
export function estIntermediaire(secteur: Secteur): boolean {
  return secteur === "Agence événementielle";
}
