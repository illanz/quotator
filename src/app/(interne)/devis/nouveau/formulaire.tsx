"use client";

import { useMemo, useState, useTransition } from "react";
import { BORNES, type Palier } from "@/domain/paliers";
import { formatEuros } from "@/domain/money";
import { STATIONNEMENT_PARIS_CENTS } from "@/domain/regles";
import { animateursPour } from "@/devis/animateurs";
import {
  analyserDesignation,
  designationEnTexte,
  rendreDesignation,
} from "@/devis/designation";
import { palierPourDemande, type AnimationVendable } from "@/devis/catalogue";
import { composerTitre, type PrecisionDate } from "@/devis/titre";
import { calculerDevis, type Prestation } from "@/pricing/engine";
import { enregistrerDevis } from "./actions";

type Organisation = { id: string; nom: string; estAgence: boolean; secteur: string | null };

type LignePrestation = {
  cle: string;
  /** Prix saisi a la main : forfait, ou tarif negocie hors grille. */
  prixManuelCents: number | null;
  remisePct: number;
  optionnelle: boolean | null;
};

/** Options transverses de la grille, proposees plutot que ressaisies. */
const COMPLEMENTS = [
  { cle: "stationnement", libelle: "Stationnement Paris intra-muros", cents: STATIONNEMENT_PARIS_CENTS },
  { cle: "photo", libelle: "Reportage photo professionnel", cents: 50000 },
  { cle: "video", libelle: "Captation vidéo professionnelle", cents: 80000 },
  { cle: "montage-veille", libelle: "Montage la veille", cents: 60000 },
  { cle: "montage-4h", libelle: "Montage 4 h à l'avance", cents: 40000 },
] as const;

/** Designation vendue : l'intitule du catalogue, ses sections, et l'effectif. */
function designationComplete(
  animation: AnimationVendable,
  palier: Palier | null,
  animateurs: string | null,
): string {
  const base = `${animation.nom}${palier ? ` - Base ${BORNES[palier].label} participants` : ""}`;
  if (!animation.descriptionHtml) {
    return animateurs ? `${base}\nSTAFF :\n- ${animateurs}` : base;
  }
  const { designation } = rendreDesignation(analyserDesignation(animation.descriptionHtml), {
    palier: palier ? BORNES[palier].label : null,
    duree: animation.dureeStandard,
    animateurs,
  });
  return designationEnTexte(designation);
}

export default function FormulaireDevis({
  millesime,
  animations,
  organisations,
}: {
  millesime: number | null;
  animations: AnimationVendable[];
  organisations: Organisation[];
}) {
  const [organisationId, setOrganisationId] = useState("");
  const [nouveauClient, setNouveauClient] = useState("");
  const [clientEstAgence, setClientEstAgence] = useState(false);

  const [dateEvent, setDateEvent] = useState("");
  const [precisionDate, setPrecisionDate] = useState<PrecisionDate>("JOUR");
  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [pax, setPax] = useState("");
  const [paxMax, setPaxMax] = useState("");
  const [km, setKm] = useState("");
  const [plageHoraire, setPlageHoraire] = useState("");

  const [lignes, setLignes] = useState<LignePrestation[]>([]);
  const [complements, setComplements] = useState<string[]>([]);
  const [palierForce, setPalierForce] = useState<Palier | "">("");

  const [titreManuel, setTitreManuel] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const parCle = useMemo(() => new Map(animations.map((a) => [a.cle, a])), [animations]);
  const choisies = lignes.map((l) => parCle.get(l.cle)).filter((a): a is AnimationVendable => !!a);

  const nPax = pax === "" ? null : Number(pax);
  const nPaxMax = paxMax === "" ? null : Number(paxMax);
  const { palier: palierAuto, ambigu } = palierPourDemande(nPax, nPaxMax);
  const palier = (palierForce || palierAuto) as Palier | null;

  const libreAcces = choisies.length > 0 && choisies.every((a) => a.libreAcces);

  const titreAuto = composerTitre({
    animations: choisies.map((a) => a.nom),
    dateEvent: dateEvent || null,
    precisionDate,
    pax: nPax,
    paxMax: nPaxMax,
    ville,
    duree: choisies[0]?.dureeStandard ?? null,
    libreAcces,
    plageHoraire,
  });
  const titre = titreManuel ?? titreAuto;

  /** Prix de grille pour une animation au palier retenu. */
  const prixGrille = (a: AnimationVendable): number | null =>
    palier ? (a.prixParPalier[palier] ?? null) : null;

  const prestations: Prestation[] = lignes.flatMap((ligne, index) => {
    const a = parCle.get(ligne.cle);
    if (!a) return [];
    const prix = ligne.prixManuelCents ?? prixGrille(a) ?? 0;
    const effectif = palier ? animateursPour(a.cle, palier) : null;
    return [
      {
        cle: a.cle,
        // La designation complete du catalogue, marqueurs remplis : c'est elle
        // que lit le client, et elle dit ce qui est compris dans la prestation.
        designation: designationComplete(a, palier, effectif?.connu ? effectif.effectif : null),
        prixUnitaireCents: prix,
        remisePct: ligne.remisePct || undefined,
        optionnelle: ligne.optionnelle ?? (lignes.length > 1 && index > 0),
      },
    ];
  });

  const calcul = calculerDevis({
    titre,
    dateEvent: dateEvent || null,
    ville: ville || null,
    codePostal: codePostal || null,
    kmAllerRetour: km === "" ? null : Number(km),
    prestations,
    conventionMultiAnimations: lignes.length > 1,
    lignesLibres: COMPLEMENTS.filter((c) => complements.includes(c.cle)).map((c) => ({
      designation: c.libelle,
      prixUnitaireCents: c.cents,
    })),
  });

  const ajouter = (cle: string) => {
    if (!cle || lignes.some((l) => l.cle === cle)) return;
    setLignes((l) => [...l, { cle, prixManuelCents: null, remisePct: 0, optionnelle: null }]);
  };
  const modifier = (i: number, champ: Partial<LignePrestation>) =>
    setLignes((l) => l.map((x, j) => (j === i ? { ...x, ...champ } : x)));
  const retirer = (i: number) => setLignes((l) => l.filter((_, j) => j !== i));

  const enregistrer = () => {
    setErreur(null);
    demarrer(async () => {
      const r = await enregistrerDevis({
        organisationId: organisationId || null,
        nouveauClient: nouveauClient || null,
        clientEstAgence,
        input: {
          titre,
          dateEvent: dateEvent || null,
          ville: ville || null,
          codePostal: codePostal || null,
          kmAllerRetour: km === "" ? null : Number(km),
          prestations,
          conventionMultiAnimations: lignes.length > 1,
          lignesLibres: COMPLEMENTS.filter((c) => complements.includes(c.cle)).map((c) => ({
            designation: c.libelle,
            prixUnitaireCents: c.cents,
          })),
        },
        grilleMillesime: millesime,
        pax: nPax,
        paxMax: nPaxMax,
      });
      if (r && "erreur" in r) setErreur(r.erreur);
    });
  };

  const familles = [...new Set(animations.map((a) => a.famille ?? "Autres"))];

  return (
    <>
      <h1>Nouveau devis</h1>
      <p className="lede">
        Grille {millesime ?? "—"} en vigueur. Le total se recalcule à mesure que vous saisissez ;
        rien n&apos;est enregistré avant que vous ne le demandiez.
      </p>

      <div className="colonnes">
        <div className="colonne-saisie">
          <section className="carte">
            <h3>Client</h3>
            <div className="champs">
              <label>
                <span>Client existant</span>
                <select value={organisationId} onChange={(e) => setOrganisationId(e.target.value)}>
                  <option value="">— nouveau client —</option>
                  {organisations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nom}
                      {o.estAgence ? " (agence)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              {!organisationId && (
                <>
                  <label>
                    <span>Raison sociale</span>
                    <input
                      value={nouveauClient}
                      onChange={(e) => setNouveauClient(e.target.value)}
                      placeholder="NATUROPERA"
                    />
                  </label>
                  <label className="case">
                    <input
                      type="checkbox"
                      checked={clientEstAgence}
                      onChange={(e) => setClientEstAgence(e.target.checked)}
                    />
                    <span>Agence ou revendeur</span>
                  </label>
                </>
              )}
            </div>
          </section>

          <section className="carte">
            <h3>Événement</h3>
            <div className="champs">
              <label>
                <span>Date</span>
                <input type="date" value={dateEvent} onChange={(e) => setDateEvent(e.target.value)} />
              </label>
              <label>
                <span>Précision annoncée</span>
                <select
                  value={precisionDate}
                  onChange={(e) => setPrecisionDate(e.target.value as PrecisionDate)}
                >
                  <option value="JOUR">Jour exact</option>
                  <option value="MOIS">Mois seulement</option>
                  <option value="INDEFINIE">Date à définir</option>
                </select>
              </label>
              <label>
                <span>Ville</span>
                <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Lognes" />
              </label>
              <label>
                <span>Code postal</span>
                <input
                  value={codePostal}
                  onChange={(e) => setCodePostal(e.target.value)}
                  placeholder="77185"
                  inputMode="numeric"
                />
              </label>
              <label>
                <span>Participants</span>
                <input value={pax} onChange={(e) => setPax(e.target.value)} inputMode="numeric" />
              </label>
              <label>
                <span>jusqu&apos;à (facultatif)</span>
                <input value={paxMax} onChange={(e) => setPaxMax(e.target.value)} inputMode="numeric" />
              </label>
              {calcul.avertissements.some((a) => a.includes("kilometrage")) && (
                <label>
                  <span>Km aller-retour</span>
                  <input value={km} onChange={(e) => setKm(e.target.value)} inputMode="numeric" />
                </label>
              )}
              {libreAcces && (
                <label>
                  <span>Plage horaire</span>
                  <input
                    value={plageHoraire}
                    onChange={(e) => setPlageHoraire(e.target.value)}
                    placeholder="de 12h45 à 14h15"
                  />
                </label>
              )}
            </div>

            {ambigu.length > 1 && (
              <div className="encadre encadre-alerte">
                <p>
                  La fourchette {pax}-{paxMax} chevauche deux tranches de la grille. Choisissez
                  celle qui s&apos;applique :
                </p>
                <div className="barre-actions">
                  {ambigu.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`bouton ${palierForce === p ? "bouton-primaire" : ""}`}
                      onClick={() => setPalierForce(p)}
                    >
                      {BORNES[p].label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="carte">
            <h3>Animations</h3>
            <select
              value=""
              onChange={(e) => ajouter(e.target.value)}
              aria-label="Ajouter une animation"
            >
              <option value="">Ajouter une animation…</option>
              {familles.map((f) => (
                <optgroup key={f} label={f}>
                  {animations
                    .filter((a) => (a.famille ?? "Autres") === f)
                    .map((a) => (
                      <option key={a.cle} value={a.cle}>
                        {a.nom}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>

            {lignes.length === 0 && (
              <p className="silence" style={{ marginTop: 12 }}>
                Aucune animation. Le devis a besoin d&apos;au moins une prestation.
              </p>
            )}

            {lignes.map((ligne, i) => {
              const a = parCle.get(ligne.cle);
              if (!a) return null;
              const grille = prixGrille(a);
              const mention = palier ? a.mentionParPalier[palier] : undefined;
              const effectif = palier ? animateursPour(a.cle, palier) : null;

              return (
                <div className="prestation" key={ligne.cle}>
                  <div className="prestation-tete">
                    <strong>{a.nom}</strong>
                    <button type="button" className="lien-discret" onClick={() => retirer(i)}>
                      retirer
                    </button>
                  </div>

                  {a.regime === "FORFAIT" && a.regleForfait && (
                    <p className="silence regle-forfait">{a.regleForfait}</p>
                  )}
                  {mention && !grille && (
                    <p className="silence">
                      Grille {palier ? BORNES[palier].label : ""} : {mention} — prix à saisir.
                    </p>
                  )}
                  {effectif && !effectif.connu && (
                    <p className="silence">
                      Effectif d&apos;animateurs non documenté pour ce palier — à préciser.
                    </p>
                  )}

                  <div className="champs">
                    <label>
                      <span>Prix HT</span>
                      <input
                        inputMode="numeric"
                        value={
                          ligne.prixManuelCents !== null
                            ? String(ligne.prixManuelCents / 100)
                            : grille !== null
                              ? String(grille / 100)
                              : ""
                        }
                        onChange={(e) =>
                          modifier(i, {
                            prixManuelCents:
                              e.target.value === "" ? null : Math.round(Number(e.target.value) * 100),
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>Remise %</span>
                      <input
                        inputMode="numeric"
                        value={ligne.remisePct || ""}
                        onChange={(e) => modifier(i, { remisePct: Number(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </label>
                    <label className="case">
                      <input
                        type="checkbox"
                        checked={ligne.optionnelle ?? (lignes.length > 1 && i > 0)}
                        onChange={(e) => modifier(i, { optionnelle: e.target.checked })}
                      />
                      <span>Présentée en option</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="carte">
            <h3>Compléments</h3>
            <div className="cases">
              {COMPLEMENTS.map((c) => (
                <label className="case" key={c.cle}>
                  <input
                    type="checkbox"
                    checked={complements.includes(c.cle)}
                    onChange={(e) =>
                      setComplements((l) =>
                        e.target.checked ? [...l, c.cle] : l.filter((x) => x !== c.cle),
                      )
                    }
                  />
                  <span>
                    {c.libelle} <span className="silence">{formatEuros(c.cents)}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="colonne-apercu">
          <section className="carte apercu">
            <h3>Aperçu</h3>

            <label className="champ-titre">
              <span>Titre du devis</span>
              <textarea
                rows={2}
                value={titre}
                onChange={(e) => setTitreManuel(e.target.value)}
                onBlur={(e) => {
                  if (e.target.value.trim() === titreAuto.trim()) setTitreManuel(null);
                }}
              />
              {titreManuel !== null && (
                <button type="button" className="lien-discret" onClick={() => setTitreManuel(null)}>
                  revenir au titre composé
                </button>
              )}
            </label>

            {calcul.majorationAppliquee && (
              <div className="encadre encadre-alerte">
                <p>Week-end ou jour férié : la majoration est ajoutée en ligne.</p>
              </div>
            )}

            <div className="table-enveloppe">
              <table>
                <tbody>
                  {calcul.lignes
                    .filter((l) => l.type !== "SAUT_PAGE" && l.type !== "TITRE")
                    .map((l) => (
                      <tr key={l.position} className={l.optionnelle ? "ligne-option" : ""}>
                        <td>
                          {l.designation.split("\n")[0]}
                          {l.optionnelle && <span className="puce">option</span>}
                        </td>
                        <td className="num">{formatEuros(l.totalHTCents)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <dl className="totaux">
              <div>
                <dt>Total HT</dt>
                <dd>{formatEuros(calcul.totalHTCents)}</dd>
              </div>
              {calcul.ventilationTVA.map((v) => (
                <div key={v.tauxPct}>
                  <dt>TVA {v.tauxPct} %</dt>
                  <dd>{formatEuros(v.montantCents)}</dd>
                </div>
              ))}
              <div className="total-ttc">
                <dt>Total TTC</dt>
                <dd>{formatEuros(calcul.totalTTCCents)}</dd>
              </div>
              {calcul.totalOptionsHTCents > 0 && (
                <div>
                  <dt>Options présentées</dt>
                  <dd>{formatEuros(calcul.totalOptionsHTCents)}</dd>
                </div>
              )}
              <div>
                <dt>Acompte à l&apos;acceptation</dt>
                <dd>{formatEuros(calcul.acompteCents)}</dd>
              </div>
            </dl>

            {calcul.avertissements.length > 0 && (
              <div className="encadre encadre-alerte">
                <ul>
                  {calcul.avertissements.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {erreur && (
              <div className="encadre encadre-danger">
                <p>{erreur}</p>
              </div>
            )}

            <div className="barre-actions">
              <button
                type="button"
                className="bouton bouton-primaire"
                onClick={enregistrer}
                disabled={enCours || lignes.length === 0}
              >
                {enCours ? "Enregistrement…" : "Enregistrer le brouillon"}
              </button>
              <span className="silence">Le numéro sera attribué à l&apos;envoi.</span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
