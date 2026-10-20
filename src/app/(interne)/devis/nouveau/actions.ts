"use server";

import { redirect } from "next/navigation";
import { enregistrerBrouillon } from "@/devis/service";
import { prisma } from "@/lib/prisma";
import type { DevisInput } from "@/pricing/engine";

function normaliserNom(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\b(SAS|SARL|SA|SASU|EURL|SNC|GIE|SCI)\b/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

export type DonneesBrouillon = {
  organisationId: string | null;
  nouveauClient: string | null;
  clientEstAgence: boolean;
  input: DevisInput;
  grilleMillesime: number | null;
  pax: number | null;
  paxMax: number | null;
};

export type ResultatEnregistrement = { erreur: string } | never;

/**
 * Enregistre le brouillon, en creant le client au passage s'il est nouveau.
 *
 * La creation du client est faite ici plutot que dans un ecran separe : un
 * devis se prepare souvent avant que la fiche client n'existe, et interrompre
 * la saisie pour aller la creer ailleurs est exactement la friction que l'outil
 * doit supprimer.
 */
export async function enregistrerDevis(donnees: DonneesBrouillon): Promise<ResultatEnregistrement> {
  let organisationId = donnees.organisationId;

  if (!organisationId) {
    const nom = donnees.nouveauClient?.trim();
    if (!nom) return { erreur: "Indiquez le client." };

    const nomCle = normaliserNom(nom);
    const existante = await prisma.organisation.findFirst({ where: { nomCle } });
    organisationId =
      existante?.id ??
      (
        await prisma.organisation.create({
          data: {
            nom,
            nomCle,
            estAgence: donnees.clientEstAgence,
            type: donnees.clientEstAgence ? "AGENCE" : "CLIENT_DIRECT",
            secteur: donnees.clientEstAgence ? "Agence événementielle" : null,
            secteurAuto: true,
          },
        })
      ).id;
  }

  if (donnees.input.prestations.length === 0) {
    return { erreur: "Ajoutez au moins une animation." };
  }

  const devis = await enregistrerBrouillon({
    organisationId,
    input: donnees.input,
    grilleMillesime: donnees.grilleMillesime,
    pax: donnees.pax,
    paxMax: donnees.paxMax,
  });

  redirect(`/devis/${devis.id}`);
}
