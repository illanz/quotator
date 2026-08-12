/**
 * Next 15 ne fournit pas de declaration pour les feuilles de style, et
 * TypeScript 6 refuse desormais un import d'effet de bord non declare.
 */
declare module "*.css";
