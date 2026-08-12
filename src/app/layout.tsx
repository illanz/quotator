import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quotator — MadCityZen",
  description: "Catalogue, grille tarifaire, devis et suivi commercial MadCityZen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="entete">
          <div className="entete-inner">
            <a className="marque" href="/">
              <span className="marque-signe" aria-hidden="true" />
              Quotator
            </a>
            <nav className="nav">
              <a href="/">Accueil</a>
              <a href="/tarifs">Grille tarifaire</a>
              <a href="/tarifs/import">Import</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
