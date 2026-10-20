import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/auth/service";
import FormulaireConnexion from "./formulaire";

export const dynamic = "force-dynamic";

export const metadata = { title: "Connexion — Quotator" };

/**
 * Pourquoi un lien n'a pas fonctionne.
 *
 * Chaque cas dit quoi faire ensuite, parce qu'un utilisateur devant un ecran
 * de connexion qui refuse n'a pas besoin d'un diagnostic mais d'une sortie.
 */
const EXPLICATIONS: Record<string, string> = {
  INCONNU:
    "Ce lien n'est pas valide — il a peut-être été tronqué par votre messagerie. En voici un nouveau à demander.",
  EXPIRE: "Ce lien a expiré : il ne vaut qu'un quart d'heure. Demandez-en un nouveau.",
  DEJA_UTILISE:
    "Ce lien a déjà servi. Il arrive que l'antivirus d'une messagerie l'ouvre avant vous : demandez-en un nouveau.",
  COMPTE_INACTIF:
    "Ce compte n'est plus actif. Rapprochez-vous de l'administrateur de l'outil.",
};

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ motif?: string }>;
}) {
  // Deja connecte : rien a demander.
  if (await utilisateurCourant()) redirect("/");

  const { motif } = await searchParams;
  const explication = motif ? EXPLICATIONS[motif] : undefined;

  return (
    <div className="connexion">
      <div className="connexion-carte">
        <div className="marque-signe grand" aria-hidden="true" />
        <h1>Quotator</h1>
        {explication ? (
          <div className="encadre encadre-alerte">
            <p>{explication}</p>
          </div>
        ) : (
          <p className="silence">
            Saisissez votre adresse professionnelle. Vous recevrez un lien de connexion, valable un
            quart d&apos;heure. Il n&apos;y a pas de mot de passe.
          </p>
        )}
        <FormulaireConnexion />
      </div>
    </div>
  );
}
