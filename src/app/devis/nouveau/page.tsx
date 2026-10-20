import { prisma } from "@/lib/prisma";
import { catalogueVendable } from "@/devis/service";
import FormulaireDevis from "./formulaire";

export const dynamic = "force-dynamic";

export default async function PageNouveauDevis() {
  const [catalogue, organisations] = await Promise.all([
    catalogueVendable(),
    prisma.organisation.findMany({
      where: { active: true },
      orderBy: { nom: "asc" },
      select: { id: true, nom: true, estAgence: true, secteur: true },
      take: 2000,
    }),
  ]);

  if (catalogue.animations.length === 0) {
    return (
      <>
        <h1>Nouveau devis</h1>
        <div className="vide-etat">
          <p>
            Aucune grille tarifaire n&apos;est en vigueur : impossible de chiffrer une animation.
          </p>
          <a className="bouton bouton-primaire" href="/tarifs/import">
            Importer la grille
          </a>
        </div>
      </>
    );
  }

  return (
    <FormulaireDevis
      millesime={catalogue.millesime}
      animations={catalogue.animations}
      organisations={organisations}
    />
  );
}
