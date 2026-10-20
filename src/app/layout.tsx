import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quotator — MadCityZen",
  description: "Catalogue, grille tarifaire, devis et suivi commercial MadCityZen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
