import { notFound } from "next/navigation";
import {
  ACOMPTE_PCT,
  BAREME_ANNULATION,
  DELAI_MODIFICATION_PAX_JOURS,
  MENTION_ENGAGEMENT,
} from "@/domain/regles";
import { formatEuros } from "@/domain/money";
import { formaterDateLongue } from "@/devis/titre";
import { prisma } from "@/lib/prisma";
import PanneauClient from "./panneau";

export const dynamic = "force-dynamic";

/** Le lien public ne porte ni navigation interne ni indexation. */
export const metadata = { robots: { index: false, follow: false } };

export default async function PageDevisPublic({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;
  const devis = await prisma.devis.findUnique({
    where: { jetonPublic: jeton },
    include: {
      organisation: true,
      contact: true,
      commercial: true,
      lignes: { orderBy: { position: "asc" } },
    },
  });
  if (!devis) notFound();

  // Premiere ouverture : le commercial doit savoir que son devis a ete lu.
  if (devis.statut === "ENVOYE") {
    await prisma.$transaction([
      prisma.devis.update({ where: { id: devis.id }, data: { statut: "VU" } }),
      prisma.devisEvenement.create({ data: { devisId: devis.id, type: "OUVERTURE" } }),
    ]);
  }

  const fermes = devis.lignes.filter((l) => !l.optionnelle && l.type !== "SAUT_PAGE");
  const options = devis.lignes.filter((l) => l.optionnelle && l.totalHTCents !== 0);
  const acompteCents = devis.acompteCents;
  const soldeCents = devis.totalTTCCents - acompteCents;

  return (
    <div className="public">
      <aside className="public-identite">
        <div className="marque-signe grand" aria-hidden="true" />
        <p className="marque-nom">MadCityZen</p>
        <p className="silence petit">
          {devis.numero ? `Devis n° ${devis.numero}` : "Proposition"}
          <br />
          {devis.organisation.nom}
        </p>
      </aside>

      <main className="public-corps">
        <header className="public-entete">
          <h1>{devis.titre}</h1>
          <p className="silence">
            {[
              devis.dateEvent ? formaterDateLongue(devis.dateEvent) : null,
              devis.ville,
              devis.pax ? `${devis.pax}${devis.paxMax ? `-${devis.paxMax}` : ""} participants` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </header>

        <section>
          <h2>Votre proposition</h2>
          <div className="table-enveloppe">
            <table>
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th className="num">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {fermes
                  .filter((l) => l.type !== "TITRE")
                  .map((l) => (
                    <tr key={l.id}>
                      <td>
                        <span className="designation">{l.designation}</span>
                      </td>
                      <td className="num">
                        <strong>{formatEuros(l.totalHTCents)}</strong>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <dl className="totaux">
            <div>
              <dt>Total HT</dt>
              <dd>{formatEuros(devis.totalHTCents)}</dd>
            </div>
            <div className="silence">
              <dt>TVA</dt>
              <dd>{formatEuros(devis.totalTVACents)}</dd>
            </div>
            <div className="total-ttc">
              <dt>Total TTC</dt>
              <dd>{formatEuros(devis.totalTTCCents)}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2>Échéancier</h2>
          <div className="table-enveloppe">
            <table>
              <tbody>
                <tr>
                  <td>Acompte, à l&apos;acceptation du devis</td>
                  <td className="num">{ACOMPTE_PCT} %</td>
                  <td className="num">
                    <strong>{formatEuros(acompteCents)}</strong>
                  </td>
                </tr>
                <tr>
                  <td>Solde, selon les conditions portées au devis</td>
                  <td className="num">{100 - ACOMPTE_PCT} %</td>
                  <td className="num">
                    <strong>{formatEuros(soldeCents)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Ce à quoi vous vous engagez</h2>
          <div className="encadre encadre-alerte">
            <p>{MENTION_ENGAGEMENT}</p>
          </div>

          <p>
            Le nombre de participants peut être revu à la hausse comme à la baisse jusqu&apos;à{" "}
            {DELAI_MODIFICATION_PAX_JOURS} jours de la date de l&apos;événement. Passé ce délai,
            une baisse ne diminue plus le montant dû.
          </p>

          <h3>En cas d&apos;annulation</h3>
          <div className="table-enveloppe">
            <table>
              <tbody>
                {BAREME_ANNULATION.map((p) => (
                  <tr key={p.delai}>
                    <td>{p.delai}</td>
                    <td className="num">
                      <strong>{p.partTTCPct} %</strong> du total TTC
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="silence petit">
            Extrait des conditions générales de vente, remises avec la présente proposition.
          </p>
        </section>

        {devis.valableAu && (
          <p className="silence">Cette proposition est valable jusqu&apos;au {devis.valableAu}.</p>
        )}
      </main>

      <PanneauClient
        jeton={jeton}
        statut={devis.statut}
        options={options.map((l) => ({
          id: l.id,
          designation: l.designation,
          totalHTCents: l.totalHTCents,
        }))}
        totalHTCents={devis.totalHTCents}
        commercial={{
          nom: devis.commercial.nom,
          telephone: devis.commercial.telephone,
          email: devis.commercial.email,
        }}
        accepteParNom={devis.accepteParNom}
      />
    </div>
  );
}
