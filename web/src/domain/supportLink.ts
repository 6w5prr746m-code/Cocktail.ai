// Aucun lien de paiement réel configuré pour l'instant (pas de compte Stripe
// créé côté produit) : ce module documente le point d'intégration plutôt que
// de pointer vers un lien factice ou trompeur. Pour activer la monétisation
// "soutien", remplacer par une vraie URL Stripe Payment Link
// (https://dashboard.stripe.com/payment-links) — l'écran "Soutenir
// Cocktail.ai" du Profil s'affiche automatiquement dès que cette valeur
// n'est plus null, sans autre changement de code.
export const SUPPORT_URL: string | null = null;
