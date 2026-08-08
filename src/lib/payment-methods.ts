export type PaymentMethodValue = 'cash' | 'bank_transfer' | 'lydia' | 'sumeria' | 'wero' | 'paypal' | 'other'
export type PaymentStatusValue = 'pending' | 'declared' | 'confirmed' | 'cancelled'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> = {
  cash: 'Espèces',
  bank_transfer: 'Virement',
  lydia: 'Lydia',
  sumeria: 'Sumeria',
  wero: 'Wero',
  paypal: 'PayPal',
  other: 'Autre',
}

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
  value: value as PaymentMethodValue,
  label,
}))
