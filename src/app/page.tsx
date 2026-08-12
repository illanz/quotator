import { prisma } from "@/lib/prisma";
import { grilleActive } from "@/tarifs/service";

export const dynamic = "force-dynamic";

export default async function Accueil() {
  const [grille, animations, devis] = await Promise.all([
    grilleActive(),
    prisma.animation.count({ where: { actif: true } }),
    prisma.devis.count(),
  ]);

  return (
    <>
      <h1>Quotator</h1>
      <p className="lede">
        Catalogue, grille tarifaire, devis et suivi commercial MadCityZen. Le socle est en place :
        modèle de données, import de la grille et moteur de prix.
      </p>

      <div className="grille-cartes">
        <div className="carte stat">
          <span className="n">{grille ? grille.millesime : "—"}</span>
          <span className="l">
            {grille ? `grille en vigueur, ${grille.lignes.length} animations` : "aucune grille importée"}
          </span>
        </div>
        <div className="carte stat">
          <span className="n">{animations}</span>
          <span className="l">animations au catalogue</span>
        </div>
        <div className="carte stat">
          <span className="n">{devis}</span>
          <span className="l">devis émis</span>
        </div>
      </div>

      <div className="barre-actions">
        <a className="bouton bouton-primaire" href="/tarifs/import">
          Importer la grille
        </a>
        <a className="bouton" href="/tarifs">
          Consulter la grille
        </a>
      </div>
    </>
  );
}
