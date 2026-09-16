// Pas de programme d'affiliation réel branché pour l'instant (aucun compte
// créé côté produit) : ce lien pointe vers une recherche shopping générique,
// utile dès aujourd'hui pour l'utilisateur. Pour monétiser, il suffit de
// remplacer buildBuyLinkUrl par un lien vers un partenaire réel (avec son
// identifiant de tracking) — le point d'entrée UI ("Où acheter") ne change pas.
export function buildBuyLinkUrl(ingredientName: string): string {
  const query = encodeURIComponent(`${ingredientName} acheter`);
  return `https://www.google.com/search?q=${query}&tbm=shop`;
}
