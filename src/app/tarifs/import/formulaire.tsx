"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { analyserGrille, type EtatImport } from "./actions";

function BoutonAnalyser() {
  const { pending } = useFormStatus();
  return (
    <button className="bouton bouton-primaire" type="submit" disabled={pending}>
      {pending ? "Analyse en cours…" : "Analyser le fichier"}
    </button>
  );
}

export default function FormulaireImport() {
  const [etat, action] = useActionState<EtatImport, FormData>(analyserGrille, {});

  return (
    <form action={action}>
      <label className="champ-fichier">
        <strong>Déposer le classeur de la grille</strong>
        <span className="silence"> — fichier .xlsx, tel qu&apos;il sort de Dropbox</span>
        <input type="file" name="fichier" accept=".xlsx,.xls" required />
      </label>

      {etat.erreur && (
        <div className="encadre encadre-danger">
          <p>{etat.erreur}</p>
        </div>
      )}

      <div className="barre-actions">
        <BoutonAnalyser />
        <span className="silence">Rien n&apos;est modifié avant votre validation.</span>
      </div>
    </form>
  );
}
