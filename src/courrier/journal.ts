/**
 * Expediteur de developpement : ecrit au lieu d'envoyer.
 *
 * Il sert deux fins. D'abord travailler sans compte chez un prestataire : la
 * connexion par lien magique et l'envoi de devis se mettent au point en lisant
 * les messages sur disque. Ensuite, et surtout, garantir qu'un environnement
 * mal configure n'ecrit jamais a un vrai client — un devis parti par erreur
 * depuis une base de recette ne se rappelle pas.
 */

import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { adresseComplete, type Expediteur, type Message } from "./message";

const DOSSIER = join(process.cwd(), ".courrier");

export function expediteurJournal(dossier = DOSSIER): Expediteur {
  return {
    async envoyer(message: Message) {
      const horodatage = new Date().toISOString().replace(/[:.]/g, "-");
      const identifiant = `${horodatage}-${message.reference ?? "message"}`;

      mkdirSync(dossier, { recursive: true });

      const entete = [
        `À        : ${adresseComplete(message.a)}`,
        message.cci?.length ? `Cci      : ${message.cci.join(", ")}` : null,
        `Sujet    : ${message.sujet}`,
        message.piecesJointes?.length
          ? `Jointes  : ${message.piecesJointes.map((p) => `${p.nom} (${p.contenu.length} o)`).join(", ")}`
          : null,
        "",
      ]
        .filter((l) => l !== null)
        .join("\n");

      writeFileSync(join(dossier, `${identifiant}.txt`), `${entete}\n${message.texte}\n`);
      if (message.html) {
        writeFileSync(join(dossier, `${identifiant}.html`), message.html);
      }
      for (const piece of message.piecesJointes ?? []) {
        writeFileSync(join(dossier, `${identifiant}-${piece.nom}`), piece.contenu);
      }

      // Une ligne par message, pour retrouver d'un coup d'oeil ce qui est parti.
      appendFileSync(
        join(dossier, "journal.log"),
        `${new Date().toISOString()}  ${message.a.email}  ${message.sujet}\n`,
      );

      return { ok: true as const, identifiant };
    },
  };
}
