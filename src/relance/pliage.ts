/**
 * Pliage d'un texte de courriel.
 *
 * Les modeles sont ecrits en paragraphes d'une seule ligne, et replies ici.
 * Les replier a l'ecriture ne tiendrait pas : la date, le prenom et le nom de
 * l'animation s'y interpolent, et une ligne calibree a la main deborde des que
 * la valeur est plus longue que prevu.
 *
 * Soixante-seize colonnes : la convention des courriels en texte brut, qui
 * laisse de la place aux chevrons de citation d'une reponse.
 */

export const LARGEUR = 76;

/**
 * Replie un paragraphe, en laissant intact ce qui ne doit pas etre coupe.
 *
 * Une ligne sans espace est une adresse ou un lien : la couper la rendrait
 * incliquable, et c'est precisement ce que le message demande de cliquer.
 */
export function replier(paragraphe: string, largeur = LARGEUR): string[] {
  if (paragraphe === "") return [""];
  if (!paragraphe.includes(" ")) return [paragraphe];

  const lignes: string[] = [];
  let courante = "";

  for (const mot of paragraphe.split(/\s+/)) {
    if (courante === "") {
      courante = mot;
    } else if (`${courante} ${mot}`.length <= largeur) {
      courante = `${courante} ${mot}`;
    } else {
      lignes.push(courante);
      courante = mot;
    }
  }
  if (courante !== "") lignes.push(courante);

  return lignes;
}

/** Assemble des paragraphes replies en un corps de message. */
export function corps(paragraphes: string[], largeur = LARGEUR): string {
  return paragraphes.flatMap((p) => replier(p, largeur)).join("\n");
}
