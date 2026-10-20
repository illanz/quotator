"use client";

import { useState, useTransition } from "react";
import { demander, type RetourDemande } from "./actions";

export default function FormulaireConnexion() {
  const [email, setEmail] = useState("");
  const [retour, setRetour] = useState<RetourDemande | null>(null);
  const [enCours, demarrer] = useTransition();

  if (retour?.ok) {
    return (
      <div className="encadre encadre-succes">
        <p>{retour.message}</p>
      </div>
    );
  }

  return (
    <form
      className="formulaire-connexion"
      onSubmit={(e) => {
        e.preventDefault();
        demarrer(async () => setRetour(await demander(email)));
      }}
    >
      {retour && !retour.ok && (
        <div className="encadre encadre-danger">
          <p>{retour.message}</p>
        </div>
      )}
      <label>
        <span>Adresse professionnelle</span>
        <input
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="prenom@madcityzen.fr"
        />
      </label>
      <button className="bouton bouton-primaire" type="submit" disabled={enCours || email === ""}>
        {enCours ? "Envoi…" : "Recevoir mon lien"}
      </button>
    </form>
  );
}
