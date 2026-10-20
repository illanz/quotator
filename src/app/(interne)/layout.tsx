/**
 * Habillage des ecrans internes : en-tete et navigation de l'outil.
 *
 * La page publique du devis vit hors de ce groupe : un client n'a rien a faire
 * devant la grille tarifaire ni l'ecran d'import.
 */
export default function LayoutInterne({ children }: { children: React.ReactNode }) {
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
            <a href="/tarifs/import">Import</a>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
