import { formatEuros } from "@/domain/money";
import { BORNES, PALIERS } from "@/domain/paliers";
import { grilleActive } from "@/tarifs/service";

export const dynamic = "force-dynamic";

export default async function PageGrille() {
  const grille = await grilleActive();

  if (!grille) {
    return (
      <>
        <h1>Grille tarifaire</h1>
        <div className="vide-etat">
          <p>Aucune grille n&apos;est en vigueur.</p>
          <a className="bouton bouton-primaire" href="/tarifs/import">
            Importer la grille
          </a>
        </div>
      </>
    );
  }

  // Les lignes arrivent dans l'ordre du fichier : les regrouper par famille
  // redonne la lecture de l'Excel, que le commercial connait par coeur.
  const familles = new Map<string, typeof grille.lignes>();
  for (const ligne of grille.lignes) {
    const cle = ligne.famille ?? "Sans famille";
    familles.set(cle, [...(familles.get(cle) ?? []), ligne]);
  }

  return (
    <>
      <h1>Grille tarifaire {grille.millesime}</h1>
      <p className="lede">
        {grille.lignes.length} animations
        {grille.version ? `, version ${grille.version}` : ""}, importée depuis{" "}
        <span className="mono">{grille.fichier}</span>.{" "}
        <a href="/tarifs/import">Importer un nouveau millésime</a>
      </p>

      <div className="table-enveloppe">
        <table>
          <thead>
            <tr>
              <th>Animation</th>
              {PALIERS.map((p) => (
                <th key={p} className="num">
                  {BORNES[p].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...familles.entries()].flatMap(([famille, lignes]) => [
              <tr className="famille" key={famille}>
                <td colSpan={PALIERS.length + 1}>{famille}</td>
              </tr>,
              ...lignes.map((ligne) => {
                const parPalier = new Map(ligne.prix.map((p) => [p.palier, p]));
                return (
                  <tr key={ligne.id}>
                    <td>
                      {ligne.libelle}{" "}
                      {ligne.libreAcces && <span className="puce puce-libre">libre accès</span>}
                    </td>
                    {ligne.regime === "FORFAIT" ? (
                      <td colSpan={PALIERS.length} className="silence">
                        <span className="puce puce-forfait">forfait</span> {ligne.regleForfait}
                      </td>
                    ) : (
                      PALIERS.map((p) => {
                        const cellule = parPalier.get(p);
                        if (!cellule || cellule.kind === "VIDE") {
                          return (
                            <td key={p} className="num vide">
                              —
                            </td>
                          );
                        }
                        if (cellule.kind === "PRIX" && cellule.prixCents !== null) {
                          return (
                            <td key={p} className="num">
                              {formatEuros(cellule.prixCents)}
                            </td>
                          );
                        }
                        return (
                          <td key={p} className="num silence">
                            {cellule.kind === "CONSULTER"
                              ? "consulter"
                              : cellule.kind === "SUR_DEMANDE"
                                ? "sur demande"
                                : cellule.kind === "INDISPONIBLE"
                                  ? "—"
                                  : cellule.texte}
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              }),
            ])}
          </tbody>
        </table>
      </div>

      {grille.regles.length > 0 && (
        <>
          <h2>Règles de bas de grille</h2>
          <div className="carte" style={{ marginTop: 16 }}>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {grille.regles.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
