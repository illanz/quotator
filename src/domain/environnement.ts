/**
 * Variables d'environnement, vues par ce qui les lit.
 *
 * Plus etroit que `NodeJS.ProcessEnv`, qui exige `NODE_ENV` : les lecteurs de
 * configuration n'ont besoin que de quelques cles, et se testent alors sans
 * fabriquer un environnement complet.
 */
export type Environnement = Record<string, string | undefined>;
