"use server";

import { revalidatePath } from "next/cache";
import { commercialParDefaut } from "@/devis/service";
import { emettreDevis } from "@/devis/emission";
import { MESSAGES_REFUS } from "@/devis/numerotation";
import { formaterDateLongue } from "@/devis/titre";

/**
 * Emet le devis : il prend son numero et devient opposable.
 *
 * L'envoi du courriel n'est pas encore branche ; l'emission marque malgre tout
 * le devis comme envoye, parce que c'est elle qui consomme le numero. Le jour
 * ou le courriel partira d'ici, il partira apres ce point, jamais avant : un
 * devis dont le numero n'est pas attribue ne doit pas atteindre un client.
 */
export async function emettre(devisId: string): Promise<{ ok: boolean; message: string }> {
  const commercial = await commercialParDefaut();
  const resultat = await emettreDevis(devisId, commercial.id);

  if (!resultat.ok) {
    return { ok: false, message: MESSAGES_REFUS[resultat.motif] };
  }

  revalidatePath(`/devis/${devisId}`);
  return {
    ok: true,
    message: `Devis n° ${resultat.numero} émis, valable jusqu'au ${formaterDateLongue(resultat.valableAu)}.`,
  };
}
