interface CategoryMeta {
  label: string
  fieldLabel: string
  placeholder: string
  prefix: string
}

const DEFAULT: CategoryMeta = {
  label: 'Non précisé',
  fieldLabel: 'Nom du bénéficiaire',
  placeholder: 'Nom de la personne concernée',
  prefix: 'Pour',
}

export const COLLECTE_CATEGORIES: Record<string, CategoryMeta> = {
  '': DEFAULT,
  deces: {
    label: 'Décès',
    fieldLabel: 'Nom du défunt',
    placeholder: 'M. Jean Dupont',
    prefix: 'En mémoire de',
  },
  naissance: {
    label: 'Naissance',
    fieldLabel: 'Nom du nouveau-né',
    placeholder: 'Bébé Dupont',
    prefix: 'Pour la naissance de',
  },
  mariage: {
    label: 'Mariage',
    fieldLabel: 'Noms des mariés',
    placeholder: 'Jean & Marie Dupont',
    prefix: "En l'honneur de",
  },
  maladie: {
    label: 'Maladie',
    fieldLabel: 'Nom de la personne concernée',
    placeholder: 'M. Jean Dupont',
    prefix: 'Pour',
  },
  autre: {
    label: 'Autre',
    fieldLabel: 'Nom du bénéficiaire',
    placeholder: 'Nom de la personne concernée',
    prefix: 'Pour',
  },
}

export const CATEGORY_OPTIONS = Object.entries(COLLECTE_CATEGORIES).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

function meta(category?: string | null): CategoryMeta {
  return COLLECTE_CATEGORIES[category ?? ''] ?? DEFAULT
}

export const categoryLabel = (category?: string | null) => meta(category).label
export const categoryFieldLabel = (category?: string | null) => meta(category).fieldLabel
export const categoryPlaceholder = (category?: string | null) => meta(category).placeholder
export const categoryPrefix = (category?: string | null) => meta(category).prefix
