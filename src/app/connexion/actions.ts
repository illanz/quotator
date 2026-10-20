"use server";

import { headers } from "next/headers";
import { demanderLien, lienEcritSurDisque } from "@/auth/service";
import { emailPlausible } from "@/courrier/message";

export type RetourDemande = { ok: boolean; message: string };

/**
 * Demande un lien de connexion.
 *
 * Le message de retour est le meme que l'adresse soit connue ou non. C'est
 * délibéré : une reponse qui distinguerait les deux cas ferait de ce
 * formulaire un annuaire du personnel.
 */
export async function demander(email: string): Promise<RetourDemande> {
  if (!emailPlausible(email)) {
    return { ok: false, message: "Cette adresse ne semble pas valide." };
  }

  const entetes = await headers();
  const ip = entetes.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  await demanderLien(email, ip);

  if (lienEcritSurDisque()) {
    return {
      ok: true,
      message:
        "Envoi non configuré : le lien a été écrit dans le dossier .courrier du serveur.",
    };
  }

  return {
    ok: true,
    message:
      "Si cette adresse correspond à un compte, un lien de connexion vient d'être envoyé. Il est valable un quart d'heure.",
  };
}
