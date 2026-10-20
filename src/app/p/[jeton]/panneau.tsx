"use client";

import { useState, useTransition } from "react";
import { formatEuros } from "@/domain/money";
import { accepterDevis, declinerDevis, demanderModification } from "./actions";

type Option = { id: string; designation: string; totalHTCents: number };

type Props = {
  jeton: string;
  statut: string;
  options: Option[];
  totalHTCents: number;
  commercial: { nom: string; telephone: string | null; email: string };
  accepteParNom: string | null;
};

/**
 * Motifs proposes au client lorsqu'il demande un ajustement ou decline.
 *
 * Des cases a cocher plutot qu'un champ libre : c'est ce qui transforme un
 * refus en donnee exploitable. Aujourd'hui, la raison pour laquelle neuf devis
 * sur dix ne se concretisent pas n'est consignee nulle part.
 */
const MOTIFS_MODIFICATION = [
  "Le budget ne correspond pas",
  "Le nombre de participants a changé",
  "La date a changé",
  "Une autre animation nous intéresserait",
  "Le format ou la durée ne conviennent pas",
];

const MOTIFS_REFUS = [
  "Budget trop élevé",
  "Projet reporté",
  "Projet annulé",
  "Nous avons retenu une autre proposition",
  "Pas de disponibilité à cette date",
];

export default function PanneauClient({
  jeton,
  statut,
  options,
  totalHTCents,
  commercial,
  accepteParNom,
}: Props) {
  const [retenues, setRetenues] = useState<string[]>([]);
  const [ouvert, setOuvert] = useState<"aucun" | "accepter" | "modifier" | "decliner">("aucun");
  const [nom, setNom] = useState("");
  const [fonction, setFonction] = useState("");
  const [email, setEmail] = useState("");
  const [motifs, setMotifs] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  // Un brouillon n'a pas de numero : il ne circule pas en document.
  const pdfDisponible = statut !== "BROUILLON";

  const supplement = options
    .filter((o) => retenues.includes(o.id))
    .reduce((s, o) => s + o.totalHTCents, 0);
  const total = totalHTCents + supplement;

  const basculer = (liste: string[], valeur: string) =>
    liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur];

  const agir = (action: () => Promise<{ ok: boolean; erreur?: string }>, confirmation: string) => {
    setErreur(null);
    demarrer(async () => {
      const r = await action();
      if (r.ok) setFait(confirmation);
      else setErreur(r.erreur ?? "L'opération n'a pas abouti.");
    });
  };

  if (fait) {
    return (
      <aside className="public-panneau">
        <h2>Merci</h2>
        <p>{fait}</p>
        <Contact commercial={commercial} jeton={jeton} pdfDisponible={pdfDisponible} />
      </aside>
    );
  }

  if (statut === "ACCEPTE") {
    return (
      <aside className="public-panneau">
        <h2>Votre accord est enregistré</h2>
        <p>
          {accepteParNom ? `Validé par ${accepteParNom}. ` : ""}
          Vous recevez la facture d&apos;acompte dans les minutes qui viennent. La prestation est
          confirmée à sa réception, et votre chef de projet vous contacte sous 48 heures.
        </p>
        <Contact commercial={commercial} jeton={jeton} pdfDisponible={pdfDisponible} />
      </aside>
    );
  }

  if (statut === "REFUSE") {
    return (
      <aside className="public-panneau">
        <h2>Proposition déclinée</h2>
        <p>
          C&apos;est noté, sans aucun souci. Si votre projet revient, un message suffit et nous
          repartons de cette base.
        </p>
        <Contact commercial={commercial} jeton={jeton} pdfDisponible={pdfDisponible} />
      </aside>
    );
  }

  if (statut === "EN_DISCUSSION") {
    return (
      <aside className="public-panneau">
        <h2>Votre demande est entre nos mains</h2>
        <p>
          Nous revenons vers vous avec une proposition ajustée. Vous pouvez nous joindre
          directement si vous souhaitez en parler de vive voix.
        </p>
        <Contact commercial={commercial} jeton={jeton} pdfDisponible={pdfDisponible} />
      </aside>
    );
  }

  if (statut === "EXPIRE") {
    return (
      <aside className="public-panneau">
        <h2>Cette proposition a expiré</h2>
        <p>
          Les tarifs et les disponibilités doivent être revus. Un message suffit pour obtenir une
          proposition à jour.
        </p>
        <Contact commercial={commercial} jeton={jeton} pdfDisponible={pdfDisponible} />
      </aside>
    );
  }

  return (
    <aside className="public-panneau">
      <h2>Que souhaitez-vous faire&nbsp;?</h2>

      {options.length > 0 && (
        <div className="bloc-options">
          <p className="intitule-bloc">Animations proposées en option</p>
          {options.map((o) => (
            <label className="case" key={o.id}>
              <input
                type="checkbox"
                checked={retenues.includes(o.id)}
                onChange={() => setRetenues((l) => basculer(l, o.id))}
              />
              <span>
                {o.designation.split("\n")[0]}
                <span className="silence"> {formatEuros(o.totalHTCents)}</span>
              </span>
            </label>
          ))}
          <p className="total-courant">
            Total HT retenu <strong>{formatEuros(total)}</strong>
          </p>
        </div>
      )}

      {erreur && (
        <div className="encadre encadre-danger">
          <p>{erreur}</p>
        </div>
      )}

      {ouvert === "aucun" && (
        <div className="actions-client">
          <p className="intitule-bloc">La proposition vous convient</p>
          <button className="bouton bouton-accent" onClick={() => setOuvert("accepter")}>
            Valider cette proposition
          </button>

          <p className="intitule-bloc">Elle pourrait convenir</p>
          <button className="bouton" onClick={() => setOuvert("modifier")}>
            Demander un ajustement
          </button>

          <p className="intitule-bloc">Elle ne convient pas</p>
          <button className="bouton" onClick={() => setOuvert("decliner")}>
            Décliner la proposition
          </button>
        </div>
      )}

      {ouvert === "accepter" && (
        <div className="formulaire-client">
          <p className="intitule-bloc">
            Votre accord vaut signature du devis et engage le versement de l&apos;acompte.
          </p>
          <label>
            <span>Nom et prénom</span>
            <input value={nom} onChange={(e) => setNom(e.target.value)} />
          </label>
          <label>
            <span>Fonction</span>
            <input value={fonction} onChange={(e) => setFonction(e.target.value)} />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button
            className="bouton bouton-accent"
            disabled={enCours}
            onClick={() =>
              agir(
                () => accepterDevis(jeton, { nom, fonction, email }, retenues),
                "Votre accord est enregistré. Vous recevez la facture d'acompte dans les minutes qui viennent.",
              )
            }
          >
            {enCours ? "Enregistrement…" : `Valider — ${formatEuros(total)} HT`}
          </button>
          <button className="lien-discret" onClick={() => setOuvert("aucun")}>
            revenir
          </button>
        </div>
      )}

      {(ouvert === "modifier" || ouvert === "decliner") && (
        <div className="formulaire-client">
          <p className="intitule-bloc">
            {ouvert === "modifier" ? "Qu'aimeriez-vous ajuster ?" : "Qu'est-ce qui n'a pas convenu ?"}
          </p>
          {(ouvert === "modifier" ? MOTIFS_MODIFICATION : MOTIFS_REFUS).map((m) => (
            <label className="case" key={m}>
              <input
                type="checkbox"
                checked={motifs.includes(m)}
                onChange={() => setMotifs((l) => basculer(l, m))}
              />
              <span>{m}</span>
            </label>
          ))}
          <label>
            <span>Précisions (facultatif)</span>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <button
            className="bouton bouton-accent"
            disabled={enCours}
            onClick={() =>
              ouvert === "modifier"
                ? agir(
                    () => demanderModification(jeton, motifs, message),
                    "Votre demande est transmise. Nous revenons vers vous avec une proposition ajustée.",
                  )
                : agir(
                    () => declinerDevis(jeton, motifs, message),
                    "C'est noté. Merci de nous avoir fait ce retour, il nous aide à progresser.",
                  )
            }
          >
            {enCours ? "Envoi…" : "Envoyer"}
          </button>
          <button className="lien-discret" onClick={() => setOuvert("aucun")}>
            revenir
          </button>
        </div>
      )}

      <Contact commercial={commercial} jeton={jeton} pdfDisponible={pdfDisponible} />
    </aside>
  );
}

/**
 * Pied du panneau, present quel que soit l'etat du devis.
 *
 * Le PDF y figure a cote du contact plutot qu'en tete : la page suffit a lire
 * la proposition, le document sert a la transmettre ou a la faire signer. Il
 * n'est propose que lorsque le devis porte un numero — un brouillon n'engage
 * personne et n'a pas a circuler.
 */
function Contact({
  commercial,
  jeton,
  pdfDisponible,
}: {
  commercial: Props["commercial"];
  jeton: string;
  pdfDisponible: boolean;
}) {
  return (
    <div className="bloc-contact">
      {pdfDisponible && (
        <p className="lien-document">
          <a href={`/p/${jeton}/pdf`} target="_blank" rel="noopener">
            Télécharger le devis au format PDF
          </a>
        </p>
      )}
      <p className="intitule-bloc">Une question&nbsp;?</p>
      <p className="contact-nom">{commercial.nom}</p>
      {commercial.telephone && (
        <p>
          <a href={`tel:${commercial.telephone.replace(/\s/g, "")}`}>{commercial.telephone}</a>
        </p>
      )}
      <p>
        <a href={`mailto:${commercial.email}`}>{commercial.email}</a>
      </p>
    </div>
  );
}
