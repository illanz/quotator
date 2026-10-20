/**
 * Le devis imprime.
 *
 * Le document reprend exactement ce que le client a sous les yeux sur sa page
 * publique : meme designation structuree, meme typographie, memes mentions
 * d'engagement et bareme d'annulation. Un PDF qui divergerait de la page — ne
 * serait-ce que d'une ligne de conditions — ouvrirait une discussion sur lequel
 * des deux fait foi.
 *
 * Il ajoute ce que le papier seul doit porter : l'identite legale de
 * l'emetteur, les mentions de reglement entre professionnels, les coordonnees
 * bancaires et un bloc « bon pour accord », rendu necessaire par l'article 3
 * des conditions generales de vente — la commande se fait par la remise du
 * devis date et signe.
 */

import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { Designation, SectionDesignation } from "@/devis/designation";
import { formaterDateLongue } from "@/devis/titre";
import { intituleSection, normaliserTypographie } from "@/devis/typographie";
import { formatEuros } from "@/domain/money";
import {
  ACOMPTE_PCT,
  BAREME_ANNULATION,
  DELAI_MODIFICATION_PAX_JOURS,
  MENTION_ENGAGEMENT,
  VALIDITE_JOURS,
} from "@/domain/regles";
import {
  CONDITIONS_EXPLOITATION,
  MENTIONS_REGLEMENT,
  PIED_LEGAL,
  SOCIETE,
} from "@/domain/societe";
import { enregistrerFontes, logoMarque } from "./fontes";
import type { DevisPdf, LignePdf, OptionPdf } from "./donnees";
import { COLONNES, styles } from "./styles";

export function DocumentDevis({ devis }: { devis: DevisPdf }) {
  enregistrerFontes();

  const reference = devis.numero
    ? `Devis n° ${devis.numero}${devis.version > 1 ? ` — version ${devis.version}` : ""}`
    : "Proposition — brouillon sans numéro";

  return (
    <Document
      title={reference}
      author={SOCIETE.raisonSociale}
      subject={devis.titre}
      creator={SOCIETE.marque}
      producer={SOCIETE.marque}
      language="fr-FR"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.bandeau} fixed>
          <Image src={logoMarque()} style={styles.logo} />
          <Text style={styles.bandeauReference}>
            {reference}
            {"\n"}
            {formaterDateLongue(devis.dateEmission)}
          </Text>
        </View>

        <View style={styles.pied} fixed>
          <Text style={styles.piedLegal}>
            {SOCIETE.adresse} — {SOCIETE.codePostal} {SOCIETE.ville}
            {"\n"}
            {PIED_LEGAL}
          </Text>
        </View>

        {/* Le folio est un element a part, et non un enfant du pied : son
            contenu depend de la pagination, et un tel element place dans un
            bloc fixe emporte le bloc entier dans sa disparition. */}
        <Text
          style={styles.piedPage}
          fixed
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
        />

        <Parties devis={devis} />
        <Objet devis={devis} />
        <References devis={devis} />
        <Prestations devis={devis} />
        <Totaux devis={devis} />
        <Echeancier devis={devis} />

        {devis.options.map((option, i) => (
          <VueOption key={i} option={option} rang={i + 1} total={devis.options.length} />
        ))}

        <Conditions devis={devis} />
      </Page>
    </Document>
  );
}

// ------------------------------------------------------------------- en-tete

function Parties({ devis }: { devis: DevisPdf }) {
  return (
    <View style={styles.parties}>
      <View style={styles.partie}>
        <Text style={styles.partieEtiquette}>ÉMETTEUR</Text>
        <Text style={styles.partieNom}>
          {SOCIETE.marque} — {SOCIETE.raisonSociale}
        </Text>
        <Text style={styles.partieLigne}>{SOCIETE.adresse}</Text>
        <Text style={styles.partieLigne}>
          {SOCIETE.codePostal} {SOCIETE.ville}
        </Text>
        <Text style={styles.partieLigne}>{devis.commercial.nom}</Text>
        <Text style={styles.partieLigne}>
          {[devis.commercial.telephone, devis.commercial.email].filter(Boolean).join(" · ")}
        </Text>
      </View>

      <View style={styles.partie}>
        <Text style={styles.partieEtiquette}>CLIENT</Text>
        <Text style={styles.partieNom}>{devis.client.nom}</Text>
        {devis.client.contact && (
          <Text style={styles.partieLigne}>{devis.client.contact}</Text>
        )}
        {devis.client.adresse.map((ligne, i) => (
          <Text key={i} style={styles.partieLigne}>
            {ligne}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Objet({ devis }: { devis: DevisPdf }) {
  const contexte = [
    devis.dateEvent ? formaterDateLongue(devis.dateEvent) : "Date à définir",
    devis.ville,
    devis.pax,
  ].filter(Boolean);

  return (
    <View style={styles.objet}>
      <Text style={styles.objetEtiquette}>OBJET DE LA PROPOSITION</Text>
      <Text style={styles.titre}>{normaliserTypographie(devis.titre)}</Text>
      {contexte.length > 0 && (
        <Text style={styles.contexte}>{contexte.join("  ·  ")}</Text>
      )}
    </View>
  );
}

function References({ devis }: { devis: DevisPdf }) {
  const entrees: Array<[string, string]> = [
    ["DEVIS N°", devis.numero ? String(devis.numero) : "attribué à l'envoi"],
    ["ÉTABLI LE", formaterDateLongue(devis.dateEmission)],
    [
      "VALABLE JUSQU'AU",
      devis.valableAu ? formaterDateLongue(devis.valableAu) : `${VALIDITE_JOURS} jours`,
    ],
  ];

  return (
    <View style={styles.references}>
      {entrees.map(([etiquette, valeur]) => (
        <View key={etiquette} style={styles.reference}>
          <Text style={styles.referenceEtiquette}>{etiquette}</Text>
          <Text style={styles.referenceValeur}>{valeur}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- prestations

/**
 * Composition d'une designation.
 *
 * Le rendu suit le meme decoupage que la page client : un intitule, des
 * sections nommees, des listes a puces — et une section d'une seule ligne
 * presentee en paragraphe plutot qu'en liste d'un seul element.
 */
function Composition({ designation }: { designation: Designation }) {
  return (
    <View>
      <Text style={styles.intitule}>{normaliserTypographie(designation.intitule)}</Text>
      {designation.sections.map((section, i) => (
        <Section key={i} section={section} />
      ))}
    </View>
  );
}

function Section({ section }: { section: SectionDesignation }) {
  const enListe = section.lignes.length > 1;

  return (
    <View style={styles.blocSection}>
      {section.intitule && (
        <Text style={styles.blocSectionTitre}>{intituleSection(section.intitule)}</Text>
      )}
      {section.lignes.map((ligne, i) =>
        enListe ? (
          <View key={i} style={styles.puceLigne}>
            <Text style={styles.puce}>•</Text>
            <Text style={styles.puceTexte}>{normaliserTypographie(ligne)}</Text>
          </View>
        ) : (
          <Text key={i} style={styles.texteSimple}>
            {normaliserTypographie(ligne)}
          </Text>
        ),
      )}
    </View>
  );
}

/** Les lignes qui prolongent la precedente : majoration, remise. */
const ANNEXES = new Set(["MAJORATION", "REMISE"]);

function Prestations({ devis }: { devis: DevisPdf }) {
  return (
    <View style={styles.section}>
      <View style={styles.enTete}>
        <Text style={[styles.enTeteCellule, styles.cellule]}>DÉSIGNATION</Text>
        <Text style={[styles.enTeteCellule, styles.celluleNombre, { width: COLONNES.tva }]}>
          TVA
        </Text>
        <Text style={[styles.enTeteCellule, styles.celluleNombre, { width: COLONNES.pu }]}>
          PU HT
        </Text>
        <Text style={[styles.enTeteCellule, styles.celluleNombre, { width: COLONNES.quantite }]}>
          QTÉ
        </Text>
        <Text style={[styles.enTeteCellule, styles.celluleNombre, { width: COLONNES.total }]}>
          TOTAL HT
        </Text>
      </View>

      {devis.fermes.map((ligne, i) => (
        <Ligne key={i} ligne={ligne} />
      ))}
    </View>
  );
}

function Ligne({ ligne }: { ligne: LignePdf }) {
  // Une majoration ou une remise se rattache visuellement a la prestation
  // qu'elle modifie : retrait, corps reduit, et pas de filet qui l'en separe.
  if (ANNEXES.has(ligne.type)) {
    return (
      <View style={styles.ligneAnnexe} wrap={false}>
        <Text style={[styles.annexeLibelle, styles.cellule]}>
          {normaliserTypographie(ligne.designation)}
        </Text>
        <Text style={[styles.annexeLibelle, styles.celluleNombre, { width: COLONNES.tva }]}>
          {ligne.tvaPct} %
        </Text>
        <Text style={[styles.annexeLibelle, styles.celluleNombre, { width: COLONNES.pu }]} />
        <Text style={[styles.annexeLibelle, styles.celluleNombre, { width: COLONNES.quantite }]} />
        <Text style={[styles.annexeLibelle, styles.celluleNombre, { width: COLONNES.total }]}>
          {formatEuros(ligne.totalHTCents)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.ligne}>
      <View style={styles.cellule}>
        {ligne.structure ? (
          <Composition designation={ligne.structure} />
        ) : (
          <Text style={styles.intitule}>{normaliserTypographie(ligne.designation)}</Text>
        )}
      </View>
      <Text style={[styles.celluleNombre, { width: COLONNES.tva }]}>{ligne.tvaPct} %</Text>
      <Text style={[styles.celluleNombre, { width: COLONNES.pu }]}>
        {formatEuros(ligne.prixUnitaireCents)}
      </Text>
      <Text style={[styles.celluleNombre, { width: COLONNES.quantite }]}>{ligne.quantite}</Text>
      <Text style={[styles.celluleNombre, styles.montant, { width: COLONNES.total }]}>
        {formatEuros(ligne.totalHTCents)}
      </Text>
    </View>
  );
}

function Totaux({ devis }: { devis: DevisPdf }) {
  return (
    <View style={styles.totaux} wrap={false}>
      <View style={styles.totalLigne}>
        <Text style={styles.totalLibelle}>Total HT</Text>
        <Text style={styles.totalValeur}>{formatEuros(devis.totalHTCents)}</Text>
      </View>
      {devis.ventilationTVA.map((v) => (
        <View key={v.tauxPct} style={styles.totalLigne}>
          <Text style={styles.totalLibelle}>
            TVA {v.tauxPct} % sur {formatEuros(v.baseCents)}
          </Text>
          <Text style={styles.totalValeur}>{formatEuros(v.montantCents)}</Text>
        </View>
      ))}
      <View style={styles.totalFort}>
        <Text style={styles.totalFortLibelle}>TOTAL TTC</Text>
        <Text style={styles.totalFortValeur}>{formatEuros(devis.totalTTCCents)}</Text>
      </View>
    </View>
  );
}

function Echeancier({ devis }: { devis: DevisPdf }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitre}>ÉCHÉANCIER DE RÈGLEMENT</Text>
      <View style={styles.ligne}>
        <Text style={styles.cellule}>Acompte, à l&apos;acceptation du devis</Text>
        <Text style={[styles.celluleNombre, { width: COLONNES.quantite }]}>{ACOMPTE_PCT} %</Text>
        <Text style={[styles.celluleNombre, styles.montant, { width: COLONNES.total }]}>
          {formatEuros(devis.acompteCents)}
        </Text>
      </View>
      <View style={styles.ligne}>
        <Text style={styles.cellule}>Solde, à réception de facture après la prestation</Text>
        <Text style={[styles.celluleNombre, { width: COLONNES.quantite }]}>
          {100 - ACOMPTE_PCT} %
        </Text>
        <Text style={[styles.celluleNombre, styles.montant, { width: COLONNES.total }]}>
          {formatEuros(devis.soldeCents)}
        </Text>
      </View>
      <Text style={[styles.mention, { marginTop: 6 }]}>
        La prestation est confirmée à réception de l&apos;acompte.
      </Text>
    </View>
  );
}

// -------------------------------------------------------------------- options

/**
 * Une animation proposee en option, sur sa propre page.
 *
 * C'est la convention maison : au-dela de la premiere animation, chaque
 * proposition est presentee seule, avec son prix, et n'entre pas dans le total.
 * Le client arbitre entre des propositions plutot qu'entre oui et non.
 */
function VueOption({
  option,
  rang,
  total,
}: {
  option: OptionPdf;
  rang: number;
  total: number;
}) {
  return (
    <View break>
      <View style={styles.optionEnTete}>
        <Text style={styles.optionEtiquette}>
          ANIMATION PROPOSÉE EN OPTION {rang} / {total}
        </Text>
        <Text style={[styles.contexte, styles.optionCorps]}>
          Cette animation n&apos;est pas comprise dans le total ci-avant. Elle s&apos;y ajoute si
          vous la retenez.
        </Text>
      </View>

      <View style={styles.optionCorps}>
        {option.principale.structure ? (
          <Composition designation={option.principale.structure} />
        ) : (
          <Text style={styles.intitule}>
            {normaliserTypographie(option.principale.designation)}
          </Text>
        )}
      </View>

      {option.annexes.map((annexe, i) => (
        <View key={i} style={[styles.ligneAnnexe, { paddingLeft: 0, marginTop: 4 }]}>
          <Text style={[styles.annexeLibelle, styles.cellule]}>
            {normaliserTypographie(annexe.designation)}
          </Text>
          <Text style={[styles.annexeLibelle, styles.celluleNombre, { width: COLONNES.total }]}>
            {formatEuros(annexe.totalHTCents)}
          </Text>
        </View>
      ))}

      <View style={styles.optionPrix}>
        <Text style={styles.optionPrixLibelle}>
          Supplément si cette animation est retenue
        </Text>
        <Text style={styles.optionPrixValeur}>{formatEuros(option.totalHTCents)} HT</Text>
      </View>
    </View>
  );
}

// ----------------------------------------------------------------- conditions

function Conditions({ devis }: { devis: DevisPdf }) {
  return (
    <View break>
      <Text style={styles.sectionTitre}>CE À QUOI VOUS VOUS ENGAGEZ</Text>

      <View style={styles.encadre}>
        <Text style={styles.encadreTexte}>{MENTION_ENGAGEMENT}</Text>
      </View>

      <Text style={styles.paragraphe}>
        Le nombre de participants peut être revu à la hausse comme à la baisse jusqu&apos;à{" "}
        {DELAI_MODIFICATION_PAX_JOURS} jours de la date de l&apos;événement. Passé ce délai, une
        baisse ne diminue plus le montant dû.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>EN CAS D&apos;ANNULATION</Text>
        {BAREME_ANNULATION.map((palier) => (
          <View key={palier.delai} style={styles.ligne} wrap={false}>
            <Text style={styles.cellule}>{palier.delai}</Text>
            <Text style={[styles.celluleNombre, styles.montant, { width: 120 }]}>
              {palier.partTTCPct} % du total TTC
            </Text>
          </View>
        ))}
        <Text style={[styles.mention, { marginTop: 6 }]}>
          Extrait des conditions générales de vente, remises avec la présente proposition et
          réputées acceptées par la signature du devis.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>CONDITIONS D&apos;EXPLOITATION</Text>
        {CONDITIONS_EXPLOITATION.map((condition) => (
          <Text key={condition} style={styles.mention}>
            {condition}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>RÈGLEMENT</Text>
        {MENTIONS_REGLEMENT.map((mention) => (
          <Text key={mention} style={styles.mention}>
            {mention}
          </Text>
        ))}
      </View>

      {devis.coordonneesBancaires && (
        <View style={styles.banque}>
          <Text style={styles.blocSectionTitre}>Coordonnées bancaires</Text>
          <Text style={styles.banqueTexte}>{devis.coordonneesBancaires}</Text>
        </View>
      )}

      <BonPourAccord devis={devis} />
    </View>
  );
}

/**
 * Bloc de signature.
 *
 * L'article 3 des conditions generales de vente fait de la remise du devis date
 * et signe le mode de commande : le PDF doit donc etre signable tel quel, meme
 * quand le client valide en ligne. Les deux voies sont annoncees cote a cote
 * pour qu'il n'ait pas a choisir a l'aveugle.
 */
function BonPourAccord({ devis }: { devis: DevisPdf }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitre}>BON POUR ACCORD</Text>
      <View style={styles.accord}>
        <View style={styles.accordColonne}>
          <Text style={styles.accordConsigne}>
            {normaliserTypographie(
              'Pour commander, retournez ce devis daté et signé, précédé de la mention "bon pour accord". La signature vaut acceptation des conditions générales de vente.',
            )}
          </Text>
          <View style={styles.accordCadre}>
            <Text style={styles.accordChamp}>Nom et fonction du signataire</Text>
            <Text style={styles.accordChamp}>Date</Text>
            <Text style={styles.accordChamp}>Cachet et signature</Text>
          </View>
        </View>
        <View style={styles.accordColonne}>
          <Text style={styles.accordConsigne}>
            Vous pouvez aussi valider en ligne depuis le lien reçu par courriel : votre accord y est
            horodaté et nous parvient immédiatement, sans impression ni retour postal.
          </Text>
          <View style={[styles.accordCadre, { borderStyle: "dashed" }]}>
            <Text style={styles.accordChamp}>
              Montant total TTC {formatEuros(devis.totalTTCCents)}
            </Text>
            <Text style={styles.accordChamp}>
              Acompte à verser {formatEuros(devis.acompteCents)}
            </Text>
            <Text style={styles.accordChamp}>
              Interlocuteur {devis.commercial.nom} — {devis.commercial.email}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
