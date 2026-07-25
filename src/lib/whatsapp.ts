export function buildWhatsAppShareUrl(message: string): string {
  // Pas de numéro fixe : ouvre le sélecteur de contact/groupe WhatsApp,
  // car une collecte se coordonne dans un groupe ad hoc, pas avec un
  // destinataire unique.
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function buildContributionShareMessage(params: {
  collecteTitle: string
  amount: number
  referenceCode: string
}): string {
  const amountStr = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
    .format(params.amount)
  return (
    `Collecte "${params.collecteTitle}" — je viens d'envoyer ${amountStr} via Wero.\n` +
    `Référence à indiquer dans la note du virement : ${params.referenceCode}`
  )
}
