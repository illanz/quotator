import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/auth/service";
import { seDeconnecter } from "./actions";

/**
 * Habillage des ecrans internes : en-tete et navigation de l'outil.
 *
 * La page publique du devis vit hors de ce groupe : un client n'a rien a faire
 * devant la grille tarifaire ni l'ecran d'import.
 *
 * C'est aussi ici que se joue la garde d'acces. La poser sur le layout du
 * groupe, et non ecran par ecran, evite qu'un ecran ajoute demain soit publie
 * sans protection parce que son auteur aura oublie de la reprendre.
 */
export const dynamic = "force-dynamic";

export default async function LayoutInterne({ children }: { children: React.ReactNode }) {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) redirect("/connexion");

  return (
    <>
      <header className="entete">
        <div className="entete-inner">
          <a className="marque" href="/">
            <span className="marque-signe" aria-hidden="true" />
            Quotator
          </a>
          <nav className="nav">
            <a href="/">Accueil</a>
            <a href="/devis/nouveau">Nouveau devis</a>
            <a href="/tarifs">Grille tarifaire</a>
            {utilisateur.role === "ADMIN" && <a href="/tarifs/import">Import</a>}
          </nav>
          <form action={seDeconnecter} className="entete-compte">
            <span className="silence petit">{utilisateur.nom}</span>
            <button className="lien-discret" type="submit">
              se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
