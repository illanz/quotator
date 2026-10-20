/**
 * Expedition par SMTP.
 *
 * Le transport est construit une fois et garde ses connexions ouvertes : un
 * envoi de devis avec piece jointe n'a pas a rouvrir une session TLS.
 */

import { createTransport, type Transporter } from "nodemailer";
import type { ConfigurationCourrier } from "./expediteur";
import { adresseComplete, emailPlausible, type Expediteur, type Message } from "./message";

export function expediteurSMTP(configuration: ConfigurationCourrier): Expediteur {
  let transport: Transporter | null = null;

  const obtenir = (): Transporter => {
    transport ??= createTransport({
      host: configuration.hote,
      port: configuration.port,
      // 465 est le port TLS implicite ; 587 negocie par STARTTLS.
      secure: configuration.port === 465,
      auth: { user: configuration.utilisateur, pass: configuration.motDePasse },
      pool: true,
    });
    return transport;
  };

  return {
    async envoyer(message: Message) {
      if (!emailPlausible(message.a.email)) {
        return { ok: false, erreur: `Adresse invalide : ${message.a.email}` };
      }

      try {
        const envoi = await obtenir().sendMail({
          from: configuration.de,
          ...(configuration.repondreA ? { replyTo: configuration.repondreA } : {}),
          to: adresseComplete(message.a),
          ...(message.cci?.length ? { bcc: message.cci } : {}),
          subject: message.sujet,
          text: message.texte,
          ...(message.html ? { html: message.html } : {}),
          ...(message.piecesJointes?.length
            ? {
                attachments: message.piecesJointes.map((p) => ({
                  filename: p.nom,
                  content: p.contenu,
                  contentType: p.typeMime,
                })),
              }
            : {}),
        });
        return { ok: true as const, identifiant: envoi.messageId };
      } catch (erreur) {
        // L'echec remonte comme une valeur, pas comme une exception : l'appelant
        // doit pouvoir consigner que le devis n'est pas parti, sans que la
        // transaction qui l'entoure soit annulee.
        return { ok: false as const, erreur: erreur instanceof Error ? erreur.message : String(erreur) };
      }
    },
  };
}
