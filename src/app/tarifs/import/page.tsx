import { prisma } from "@/lib/prisma";
import { grilleActive } from "@/tarifs/service";
import FormulaireImport from "./formulaire";

export const dynamic = "force-dynamic";

export default async function PageImport() {
  const [active, enAttente] = await Promise.all([
    grilleActive(),
    prisma.importGrille.findMany({
      where: { statut: "EN_ATTENTE" },
      orderBy: { creeLe: "desc" },
    }),
  ]);

  return (
    <>
      <h1>Importer la grille tarifaire</h1>
      <p className="lede">
        L&apos;Excel reste la source de vérité. Le fichier est analysé, comparé à la grille en
        vigueur, et vous validez les écarts avant qu&apos;il ne la remplace.
      </p>

      {active ? (
        <p className="silence">
          Grille en vigueur : <strong>{active.millesime}</strong>
          {active.version ? ` (version ${active.version})` : ""} — {active.lignes.length}{" "}
          animations, importée le{" "}
          {active.importeLe.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      ) : (
        <div className="encadre encadre-alerte">
          <p>
            Aucune grille n&apos;est encore en vigueur. Le premier import fera référence, sans
            comparaison possible.
          </p>
        </div>
      )}

      <FormulaireImport />

      {enAttente.length > 0 && (
        <>
          <h2>En attente de validation</h2>
          <div className="table-enveloppe">
            <table>
              <thead>
                <tr>
                  <th>Fichier</th>
                  <th>Analysé le</th>
                  <th>Anomalies</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {enAttente.map((i) => (
                  <tr key={i.id}>
                    <td>{i.fichier}</td>
                    <td className="silence">
                      {i.creeLe.toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td>
                      {i.avertissements.length === 0 ? (
                        <span className="silence">aucune</span>
                      ) : (
                        <span className="puce">{i.avertissements.length}</span>
                      )}
                    </td>
                    <td className="num">
                      <a className="bouton" href={`/tarifs/import/${i.id}`}>
                        Examiner
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
