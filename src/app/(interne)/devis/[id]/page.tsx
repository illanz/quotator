import { notFound } from "next/navigation";
import { BlocDesignation, designationDepuisJson } from "@/app/designation-bloc";
import { formatEuros } from "@/domain/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LIBELLES_STATUT: Record<string, string> = {
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  VU: "Vu par le client",
  EN_DISCUSSION: "En discussion",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
  EXPIRE: "Expiré",
  ANNULE: "Annulé",
};

export default async function PageDevis({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const devis = await prisma.devis.findUnique({
    where: { id },
    include: {
      organisation: true,
      contact: true,
      lignes: { orderBy: { position: "asc" } },
      evenements: { orderBy: { creeLe: "desc" }, take: 10 },
    },
  });
  if (!devis) notFound();

  return (
    <>
      <p className="eyebrow">
        {devis.numero ? `Devis n° ${devis.numero}` : "Brouillon — numéro à l'envoi"}
        {" · "}
        {LIBELLES_STATUT[devis.statut] ?? devis.statut}
      </p>
      <h1>{devis.organisation.nom}</h1>
      <p className="lede">{devis.titre}</p>

      <div className="grille-cartes">
        <div className="carte stat">
          <span className="n">{formatEuros(devis.totalHTCents)}</span>
          <span className="l">total HT</span>
        </div>
        <div className="carte stat bleu">
          <span className="n">{formatEuros(devis.totalTTCCents)}</span>
          <span className="l">total TTC</span>
        </div>
        <div className="carte stat">
          <span className="n">{formatEuros(devis.acompteCents)}</span>
          <span className="l">acompte à l&apos;acceptation</span>
        </div>
        {devis.totalOptionsCents > 0 && (
          <div className="carte stat">
            <span className="n">{formatEuros(devis.totalOptionsCents)}</span>
            <span className="l">options présentées, hors total</span>
          </div>
        )}
      </div>

      <h2>Lignes</h2>
      <div className="table-enveloppe">
        <table>
          <thead>
            <tr>
              <th>Désignation</th>
              <th className="num">PU HT</th>
              <th className="num">Qté</th>
              <th className="num">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes
              .filter((l) => l.type !== "SAUT_PAGE")
              .map((l) => (
                <tr key={l.id} className={l.optionnelle ? "ligne-option" : ""}>
                  <td>
                    {designationDepuisJson(l.designationStructuree) ? (
                      <BlocDesignation
                        designation={designationDepuisJson(l.designationStructuree)!}
                        compact
                      />
                    ) : (
                      <span className="designation">{l.designation}</span>
                    )}
                    {l.optionnelle && <span className="puce">option</span>}
                  </td>
                  <td className="num">{l.type === "TITRE" ? "" : formatEuros(l.prixUnitaireCents)}</td>
                  <td className="num">{l.type === "TITRE" ? "" : l.quantite}</td>
                  <td className="num">{l.type === "TITRE" ? "" : formatEuros(l.totalHTCents)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <h2>Contexte</h2>
      <dl className="kv">
        <div className="kv-row">
          <dt>Date</dt>
          <dd>{devis.dateEvent ?? "à définir"}</dd>
        </div>
        <div className="kv-row">
          <dt>Lieu</dt>
          <dd>{[devis.ville, devis.codePostal].filter(Boolean).join(" ") || "—"}</dd>
        </div>
        <div className="kv-row">
          <dt>Participants</dt>
          <dd>{devis.pax ? `${devis.pax}${devis.paxMax ? `-${devis.paxMax}` : ""}` : "—"}</dd>
        </div>
        <div className="kv-row">
          <dt>Majoration</dt>
          <dd>{devis.majoration ? "week-end ou jour férié" : "aucune"}</dd>
        </div>
        <div className="kv-row">
          <dt>Grille</dt>
          <dd>{devis.grilleMillesime ?? "—"}</dd>
        </div>
      </dl>

      <div className="barre-actions">
        {devis.jetonPublic && (
          <a className="bouton bouton-primaire" href={`/p/${devis.jetonPublic}`} target="_blank">
            Ouvrir la page client
          </a>
        )}
        <a className="bouton" href={`/devis/${devis.id}/pdf`} target="_blank">
          Relire le PDF
        </a>
        <a className="bouton" href="/devis/nouveau">
          Nouveau devis
        </a>
      </div>
      {devis.jetonPublic && (
        <p className="silence petit">
          C&apos;est cette page que reçoit le client. Le jeton du lien tient lieu d&apos;accès :
          personne ne peut la deviner, et elle n&apos;est pas indexée.
        </p>
      )}
    </>
  );
}
