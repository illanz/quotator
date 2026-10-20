import { Fragment } from "react";
import type { Designation, SectionDesignation } from "@/devis/designation";
import { intituleSection, normaliserTypographie } from "@/devis/typographie";

/**
 * Composition d'une designation de prestation.
 *
 * Le texte vient de facturation.pro, ou aucune mise en forme n'etait possible :
 * tout y est ecrit en lignes plates prefixees de tirets, les intitules de
 * section en capitales. Le rendu redonne a chaque element son role — un
 * intitule, des sections, des listes — et la typographie francaise est
 * retablie au passage.
 *
 * Le texte n'est pas justifie : sur une colonne etroite, la justification
 * creuse des rivieres de blanc bien plus genantes qu'un bord droit irregulier.
 */
export function BlocDesignation({
  designation,
  compact = false,
}: {
  designation: Designation;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "designation-bloc compact" : "designation-bloc"}>
      <p className="designation-intitule">{normaliserTypographie(designation.intitule)}</p>
      {designation.sections.map((section, i) => (
        <Section key={`${section.intitule ?? "corps"}-${i}`} section={section} />
      ))}
    </div>
  );
}

function Section({ section }: { section: SectionDesignation }) {
  // Une section d'une seule ligne se lit mieux en paragraphe qu'en liste d'un
  // seul element.
  const enListe = section.lignes.length > 1;

  return (
    <Fragment>
      {section.intitule && (
        <p className="designation-section">{intituleSection(section.intitule)}</p>
      )}
      {enListe ? (
        <ul className="designation-liste">
          {section.lignes.map((ligne, i) => (
            <li key={i}>{normaliserTypographie(ligne)}</li>
          ))}
        </ul>
      ) : (
        section.lignes.map((ligne, i) => (
          <p className="designation-texte" key={i}>
            {normaliserTypographie(ligne)}
          </p>
        ))
      )}
    </Fragment>
  );
}

/** Structure stockee sur la ligne de devis, relue sans confiance aveugle. */
export function designationDepuisJson(valeur: unknown): Designation | null {
  if (!valeur || typeof valeur !== "object") return null;
  const candidat = valeur as Partial<Designation>;
  if (typeof candidat.intitule !== "string" || !Array.isArray(candidat.sections)) return null;
  return { intitule: candidat.intitule, sections: candidat.sections };
}
