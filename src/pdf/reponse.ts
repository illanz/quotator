/**
 * Reponse HTTP servant un devis PDF.
 *
 * Partagee par la route interne et la route publique : les deux servent le meme
 * document, seule la facon d'y acceder differe — un identifiant pour le
 * commercial, un jeton pour le client.
 */

import { devisPourPdf, nomFichierDevis, rendreDevisPdf } from "./service";

/**
 * Sert le devis.
 *
 * Le document est affiche dans le navigateur (`inline`) plutot que telecharge :
 * un client qui clique sur le lien veut d'abord le lire. Le nom de fichier
 * reste porte par l'en-tete pour le moment ou il l'enregistre.
 */
export async function reponseDevisPdf(
  ou: { id: string } | { jetonPublic: string },
): Promise<Response> {
  const devis = await devisPourPdf(ou);
  if (!devis) return new Response("Devis introuvable", { status: 404 });

  const corps = await rendreDevisPdf(devis);
  const nom = nomFichierDevis(devis);

  return new Response(new Uint8Array(corps), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nom}"; filename*=UTF-8''${encodeURIComponent(nom)}`,
      // Un devis se recompose a chaque appel : son contenu peut changer tant
      // qu'il n'est pas envoye, et il ne doit pas rester en cache intermediaire.
      "Cache-Control": "private, no-store",
    },
  });
}
