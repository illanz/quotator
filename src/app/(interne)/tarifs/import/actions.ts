"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { comparerGrilles } from "@/tarifs/diff";
import { parseGrille } from "@/tarifs/parse-grille";
import {
  annulerImport,
  appliquerImport,
  enregistrerImport,
  grilleActive,
  versGrilleParsee,
} from "@/tarifs/service";

export type EtatImport = { erreur?: string };

/**
 * Analyse un classeur televerse et le met en attente de validation.
 *
 * L'import n'ecrit rien dans la grille active : il produit un constat d'ecarts
 * que le commercial relit. Une faute de frappe dans l'Excel ne doit pas se
 * propager sur les devis a venir sans que personne ne l'ait vue.
 */
export async function analyserGrille(
  _etat: EtatImport,
  donnees: FormData,
): Promise<EtatImport> {
  const fichier = donnees.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { erreur: "Choisissez le fichier Excel de la grille." };
  }
  if (!/\.xlsx?$/i.test(fichier.name)) {
    return { erreur: "Le fichier doit être un classeur Excel (.xlsx)." };
  }

  let identifiant: string;
  try {
    const parsee = await parseGrille(await fichier.arrayBuffer(), fichier.name);
    if (parsee.lignes.length === 0) {
      return {
        erreur:
          "Aucune animation trouvée dans ce fichier. Vérifiez qu'il s'agit bien de la grille tarifaire.",
      };
    }

    const active = await grilleActive();
    const ecarts = active ? comparerGrilles(versGrilleParsee(active), parsee) : null;
    const enregistrement = await enregistrerImport({ parsee, ecarts });
    identifiant = enregistrement.id;
  } catch (cause) {
    return {
      erreur: `Lecture impossible : ${cause instanceof Error ? cause.message : "fichier illisible"}.`,
    };
  }

  redirect(`/tarifs/import/${identifiant}`);
}

export async function validerImport(donnees: FormData) {
  const id = String(donnees.get("id"));
  await appliquerImport(id);
  revalidatePath("/tarifs");
  redirect("/tarifs");
}

export async function rejeterImport(donnees: FormData) {
  const id = String(donnees.get("id"));
  await annulerImport(id);
  revalidatePath("/tarifs/import");
  redirect("/tarifs/import");
}
