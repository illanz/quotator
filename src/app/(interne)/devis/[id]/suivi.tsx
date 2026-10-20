import { formaterDateLongue } from "@/devis/titre";
import { dateEtape, ETAPES, type Decision } from "@/relance/sequence";

/**
 * Suivi d'un devis : ce que le client en a fait, et ce qui partira ensuite.
 *
 * C'est la moitie manquante de l'outil. Jusqu'ici, un devis envoye disparaissait
 * du champ de vision : ni lecture, ni relance, ni raison de son silence. Onze
 * devis sur cent aboutissent — ce qui se passe apres l'envoi est le gisement,
 * et il faut d'abord pouvoir le regarder.
 */

const LIBELLES_EVENEMENT: Record<string, string> = {
  CREATION: "Brouillon créé",
  ENVOI: "Devis émis",
  OUVERTURE: "Ouvert par le client",
  RELANCE: "Relance envoyée",
  DEMANDE_MODIFICATION: "Ajustement demandé",
  ACCEPTATION: "Accepté",
  REFUS: "Décliné",
  EXPIRATION: "Expiré",
  NOUVELLE_VERSION: "Nouvelle version",
  NOTE: "Note",
};

const LIBELLES_ETAPE: Record<string, string> = {
  VERIFICATION: "Vérification de bonne réception",
  QUESTIONS: "Proposition de répondre aux questions",
  VALEUR: "Apport de valeur",
  DISPONIBILITE: "Point de disponibilité",
  ECHEANCE: "Dernière relance avant expiration",
  CLOTURE: "Clôture",
};

/** Pourquoi rien ne part aujourd'hui, dit au commercial et non au journal. */
const LIBELLES_SILENCE: Record<string, string> = {
  PAS_ENVOYE: "Le devis n'est pas encore émis.",
  CLIENT_A_AGI: "Le client a répondu : la séquence est arrêtée.",
  SEQUENCE_TERMINEE: "La séquence est allée à son terme.",
  TROP_TOT: "La prochaine relance n'est pas encore due.",
  ATTEND_UNE_LECTURE:
    "La relance précédente n'a pas été suivie d'une ouverture : la suivante attend, pour ne pas empiler deux messages non lus.",
  VALIDITE_COURANTE: "La clôture attend la fin de validité.",
};

export type EvenementAffiche = {
  id: string;
  type: string;
  detail: string | null;
  creeLe: Date;
};

export default function Suivi({
  evenements,
  decision,
  envoyeLe,
  rangAtteint,
}: {
  evenements: EvenementAffiche[];
  decision: Decision;
  /** Date civile de l'envoi, pour projeter les relances a venir. */
  envoyeLe: string | null;
  rangAtteint: number;
}) {
  const restantes = ETAPES.filter((e) => e.rang > rangAtteint);

  return (
    <>
      <h2>Suivi</h2>

      <div className="encadre">
        {decision.envoyer ? (
          <p>
            <strong>Prochaine relance : {LIBELLES_ETAPE[decision.etape.cle]}</strong> — elle part
            au prochain passage du cycle.
          </p>
        ) : (
          <p>{LIBELLES_SILENCE[decision.motif] ?? decision.motif}</p>
        )}
      </div>

      {envoyeLe && restantes.length > 0 && (
        <div className="table-enveloppe">
          <table>
            <thead>
              <tr>
                <th>Relances à venir</th>
                <th className="num">Due le</th>
              </tr>
            </thead>
            <tbody>
              {restantes.map((etape) => (
                <tr key={etape.rang}>
                  <td>{LIBELLES_ETAPE[etape.cle]}</td>
                  <td className="num silence">
                    {formaterDateLongue(dateEtape(envoyeLe, etape))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="journal-titre">Journal</h3>
      <ul className="journal">
        {evenements.map((e) => (
          <li key={e.id}>
            <span className="journal-quand">
              {e.creeLe.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Paris",
              })}
            </span>
            <span className="journal-quoi">{LIBELLES_EVENEMENT[e.type] ?? e.type}</span>
            {e.detail && <span className="journal-detail">{e.detail}</span>}
          </li>
        ))}
      </ul>
    </>
  );
}
