import { NextResponse } from "next/server";
import { consommerJeton, cookieSession, urlApplication } from "@/auth/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Consommation d'un lien de connexion.
 *
 * C'est une route et non une page : Next n'autorise l'ecriture d'un cookie que
 * depuis une action serveur ou un gestionnaire de route.
 *
 * Qu'il reussisse ou echoue, le lien n'apparait jamais dans l'historique du
 * navigateur comme une page consultable : la route redirige aussitot, et le
 * jeton disparait de la barre d'adresse.
 */
export async function GET(_requete: Request, { params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const base = urlApplication();
  const resultat = await consommerJeton(jeton);

  if (!resultat.ok) {
    return NextResponse.redirect(`${base}/connexion?motif=${resultat.motif}`);
  }

  const reponse = NextResponse.redirect(`${base}/`);
  const { nom, valeur, options } = cookieSession(resultat.utilisateurId);
  reponse.cookies.set(nom, valeur, options);
  return reponse;
}
