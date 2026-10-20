import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { DiffGrille } from "@/tarifs/diff";
import type { GrilleParsee } from "@/tarifs/types";
import { rejeterImport, validerImport } from "../actions";

export const dynamic = "force-dynamic";

function Variation({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="vide">—</span>;
  const classe = pct > 0 ? "hausse" : pct < 0 ? "baisse" : "";
  return (
    <span className={classe}>
      {pct > 0 ? "+" : ""}
      {pct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
    </span>
  );
}

export default async function PageValidationImport({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const enregistrement = await prisma.importGrille.findUnique({ where: { id } });
  if (!enregistrement) notFound();

  const parsee = enregistrement.contenu as unknown as GrilleParsee;
  const ecarts = enregistrement.ecarts as unknown as DiffGrille | null;
  const traite = enregistrement.statut !== "EN_ATTENTE";

  const paliers = parsee.lignes.filter((l) => l.regime === "PALIER").length;
  const forfaits = parsee.lignes.filter((l) => l.regime === "FORFAIT").length;

  return (
    <>
      <h1>{parsee.fichier}</h1>
      <p className="lede">
        Millésime {parsee.millesime ?? "non daté"}
        {parsee.version ? `, version ${parsee.version}` : ""} — {parsee.lignes.length} animations
        lues, dont {paliers} à paliers et {forfaits} en forfait.
      </p>

      {traite && (
        <div className="encadre encadre-alerte">
          <p>
            Cet import a déjà été {enregistrement.statut === "APPLIQUE" ? "appliqué" : "annulé"}. Il
            est conservé pour mémoire.
          </p>
        </div>
      )}

      {enregistrement.avertissements.length > 0 && (
        <div className="encadre encadre-alerte">
          <p>
            <strong>
              {enregistrement.avertissements.length} anomalie
              {enregistrement.avertissements.length > 1 ? "s" : ""} à la lecture
            </strong>
          </p>
          <ul>
            {enregistrement.avertissements.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {!ecarts ? (
        <div className="encadre encadre-succes">
          <p>
            Premier import : il n&apos;y a pas de grille en vigueur à laquelle comparer celui-ci.
          </p>
        </div>
      ) : ecarts.resume.identique ? (
        <div className="encadre encadre-succes">
          <p>Rien ne change par rapport à la grille en vigueur. L&apos;import est sans effet.</p>
        </div>
      ) : (
        <>
          <div className="grille-cartes">
            <div className="carte stat">
              <span className="n">{ecarts.ajouts.length}</span>
              <span className="l">animations ajoutées</span>
            </div>
            <div className="carte stat">
              <span className="n">{ecarts.suppressions.length}</span>
              <span className="l">animations retirées</span>
            </div>
            <div className="carte stat">
              <span className="n">{ecarts.resume.prixModifies}</span>
              <span className="l">prix modifiés</span>
            </div>
            <div className="carte stat">
              <span className="n">
                {ecarts.resume.variationMoyennePct === null ? (
                  "—"
                ) : (
                  <Variation pct={ecarts.resume.variationMoyennePct} />
                )}
              </span>
              <span className="l">variation moyenne</span>
            </div>
          </div>

          {ecarts.suppressions.length > 0 && (
            <>
              <h2>Animations retirées</h2>
              <p className="silence">
                Elles ne seront plus proposées. Les devis déjà émis conservent leurs prix.
              </p>
              <div className="table-enveloppe">
                <table>
                  <tbody>
                    {ecarts.suppressions.map((l) => (
                      <tr key={l.cle}>
                        <td>{l.libelle}</td>
                        <td className="silence">{l.famille}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {ecarts.ajouts.length > 0 && (
            <>
              <h2>Animations ajoutées</h2>
              <div className="table-enveloppe">
                <table>
                  <tbody>
                    {ecarts.ajouts.map((l) => (
                      <tr key={l.cle}>
                        <td>{l.libelle}</td>
                        <td className="silence">{l.famille}</td>
                        <td>
                          <span
                            className={l.regime === "PALIER" ? "puce puce-palier" : "puce puce-forfait"}
                          >
                            {l.regime === "PALIER" ? "paliers" : "forfait"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {ecarts.modifications.length > 0 && (
            <>
              <h2>Tarifs modifiés</h2>
              <div className="table-enveloppe">
                <table>
                  <thead>
                    <tr>
                      <th>Animation</th>
                      <th>Palier</th>
                      <th className="num">Avant</th>
                      <th className="num">Après</th>
                      <th className="num">Variation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ecarts.modifications.flatMap((m) => [
                      ...(m.regimeAvant
                        ? [
                            <tr key={`${m.cle}-regime`}>
                              <td>{m.libelle}</td>
                              <td colSpan={4}>
                                Régime : {m.regimeAvant} → <strong>{m.regimeApres}</strong>
                              </td>
                            </tr>,
                          ]
                        : []),
                      ...m.prix.map((p, i) => (
                        <tr key={`${m.cle}-${p.palier}`}>
                          <td>{i === 0 && !m.regimeAvant ? m.libelle : ""}</td>
                          <td className="mono">{p.palier}</td>
                          <td className="num">{p.avant}</td>
                          <td className="num">
                            <strong>{p.apres}</strong>
                          </td>
                          <td className="num">
                            <Variation pct={p.variationPct} />
                          </td>
                        </tr>
                      )),
                      ...(m.regleApres !== undefined
                        ? [
                            <tr key={`${m.cle}-regle`}>
                              <td>{m.prix.length === 0 ? m.libelle : ""}</td>
                              <td colSpan={4} className="silence">
                                Règle de forfait : « {m.regleApres} »
                              </td>
                            </tr>,
                          ]
                        : []),
                    ])}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {(ecarts.reglesAjoutees.length > 0 || ecarts.reglesSupprimees.length > 0) && (
            <>
              <h2>Règles de bas de grille</h2>
              <div className="table-enveloppe">
                <table>
                  <tbody>
                    {ecarts.reglesSupprimees.map((r) => (
                      <tr key={`-${r}`}>
                        <td className="hausse">retirée</td>
                        <td>{r}</td>
                      </tr>
                    ))}
                    {ecarts.reglesAjoutees.map((r) => (
                      <tr key={`+${r}`}>
                        <td className="baisse">ajoutée</td>
                        <td>{r}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {!traite && (
        <div className="barre-actions">
          <form action={validerImport}>
            <input type="hidden" name="id" value={enregistrement.id} />
            <button className="bouton bouton-primaire" type="submit">
              Mettre cette grille en vigueur
            </button>
          </form>
          <form action={rejeterImport}>
            <input type="hidden" name="id" value={enregistrement.id} />
            <button className="bouton bouton-danger" type="submit">
              Écarter cet import
            </button>
          </form>
        </div>
      )}
    </>
  );
}
