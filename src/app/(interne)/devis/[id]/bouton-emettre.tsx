"use client";

import { useState, useTransition } from "react";
import { emettre } from "./actions";

/**
 * Emission du devis.
 *
 * L'action consomme un numero de la serie et ne se defait pas : elle demande
 * donc une confirmation, et le bouton se verrouille pendant le traitement pour
 * qu'un double clic n'en consomme pas deux.
 */
export default function BoutonEmettre({
  devisId,
  statut,
}: {
  devisId: string;
  statut: string;
}) {
  const [confirme, setConfirme] = useState(false);
  const [retour, setRetour] = useState<{ ok: boolean; message: string } | null>(null);
  const [enCours, demarrer] = useTransition();

  // Le compte rendu passe avant tout le reste : l'emission revalide la page, et
  // le devis n'est alors plus un brouillon. Si la condition d'affichage etait
  // portee par la page, le composant disparaitrait en emportant son message,
  // et le commercial ne saurait pas quel numero vient d'etre attribue.
  if (retour) {
    return (
      <div className={retour.ok ? "encadre encadre-succes" : "encadre encadre-danger"}>
        <p>{retour.message}</p>
      </div>
    );
  }

  if (statut !== "BROUILLON") return null;

  if (!confirme) {
    return (
      <button className="bouton bouton-primaire" onClick={() => setConfirme(true)}>
        Émettre le devis
      </button>
    );
  }

  return (
    <div className="confirmation">
      <p className="silence petit">
        Le devis prend le prochain numéro de la série. Cette action ne se défait pas.
      </p>
      <button
        className="bouton bouton-primaire"
        disabled={enCours}
        onClick={() => demarrer(async () => setRetour(await emettre(devisId)))}
      >
        {enCours ? "Émission…" : "Confirmer l'émission"}
      </button>
      <button className="lien-discret" onClick={() => setConfirme(false)}>
        annuler
      </button>
    </div>
  );
}
