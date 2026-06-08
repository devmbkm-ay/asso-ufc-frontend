const BASE_URL = process.env.NEXT_PUBLIC_API_URL!

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refresh_token')
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// Mutex so concurrent 401s only trigger one refresh
let refreshInFlight: Promise<string | null> | null = null

async function tryRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    const refresh = getRefreshToken()
    if (!refresh) return null
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      })
      if (!res.ok) return null
      const data = await res.json()
      localStorage.setItem('access_token', data.access_token)
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
      return data.access_token as string
    } catch {
      return null
    }
  })().finally(() => { refreshInFlight = null })
  return refreshInFlight
}

function handleAuthFailure() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  // Soft logout via event so AuthProvider can update state without hard reload
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:logout'))
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const doFetch = (token: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    })

  let res = await doFetch(getToken())

  // On 401, attempt one token refresh then retry
  if (res.status === 401) {
    const newToken = await tryRefresh()
    if (newToken) {
      res = await doFetch(newToken)
    }
    if (res.status === 401) {
      handleAuthFailure()
      throw new ApiError(401, 'Session expirée')
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Erreur réseau' }))
    throw new ApiError(res.status, body.detail ?? `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export async function apiUpload(path: string, file: File): Promise<{ url: string }> {
  const token = getToken()
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: form,
  })

  if (res.status === 401) {
    handleAuthFailure()
    throw new ApiError(401, 'Session expirée')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Erreur réseau' }))
    throw new ApiError(res.status, body.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function apiDownload(path: string, filename: string): Promise<void> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  })
  if (res.status === 401) {
    handleAuthFailure()
    throw new ApiError(401, 'Session expirée')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Erreur réseau' }))
    throw new ApiError(res.status, body.detail ?? `HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ── Auth ────────────────────────────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    apiRequest<{ access_token: string; refresh_token: string; token_type: string }>(
      '/api/v1/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    ),
  me: () => apiRequest<import('./types').Member>('/api/v1/auth/me'),
  setup: (data: { first_name: string; last_name: string; email: string; password: string }) =>
    apiRequest<{ message: string }>('/api/v1/auth/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ── Members ─────────────────────────────────────────────────────────────────

export const members = {
  list: (params?: { page?: number; size?: number; status?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.page)   q.set('page', String(params.page))
    if (params?.size)   q.set('size', String(params.size))
    if (params?.status) q.set('status', params.status)
    if (params?.search) q.set('search', params.search)
    return apiRequest<import('./types').PaginatedMembers>(`/api/v1/members?${q}`)
  },
  get: (id: string) => apiRequest<import('./types').Member>(`/api/v1/members/${id}`),
  create: (data: {
    first_name: string
    last_name: string
    email: string
    password: string
    phone?: string
    address?: string
    birth_date?: string
  }) => apiRequest<import('./types').Member>('/api/v1/members', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<{ first_name: string; last_name: string; phone: string; address: string }>) =>
    apiRequest<import('./types').Member>(`/api/v1/members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  assignRole: (id: string, role_name: string) =>
    apiRequest<import('./types').Member>(`/api/v1/members/${id}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role_name }),
    }),
  revokeRole: (id: string, role_name: string) =>
    apiRequest<import('./types').Member>(`/api/v1/members/${id}/roles/${role_name}`, {
      method: 'DELETE',
    }),
}

// ── Notifications ─────────────────────────────────────────────────────────────

export const notifications = {
  list: (params?: { sent?: boolean; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.sent !== undefined) q.set('sent', String(params.sent))
    if (params?.limit)              q.set('limit', String(params.limit))
    return apiRequest<import('./types').NotificationRead[]>(`/api/v1/notifications?${q}`)
  },
  remindOverdue: (month: number, year: number) =>
    apiRequest<import('./types').ReminderResult>(
      `/api/v1/notifications/remind-overdue?month=${month}&year=${year}`,
      { method: 'POST' },
    ),
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export const dashboard = {
  treasurer: () =>
    apiRequest<import('./types').TreasurerDashboard>('/api/v1/dashboard/treasurer'),
}

// ── Cotisations ──────────────────────────────────────────────────────────────

export const cotisations = {
  plans: () => apiRequest<import('./types').CotisationPlan[]>('/api/v1/cotisation-plans'),
  grid: (year: number) =>
    apiRequest<import('./types').PaymentGridRow[]>(`/api/v1/payments/grid?year=${year}`),
  payments: (params?: { page?: number; size?: number; member_id?: string; year?: number }) => {
    const q = new URLSearchParams()
    if (params?.page)      q.set('page', String(params.page))
    if (params?.size)      q.set('size', String(params.size))
    if (params?.member_id) q.set('member_id', params.member_id)
    if (params?.year)      q.set('year', String(params.year))
    return apiRequest<import('./types').PaginatedPayments>(`/api/v1/payments?${q}`)
  },
  createPlan: (data: {
    label:       string
    amount:      number
    frequency:   'monthly' | 'annual' | 'one_time'
    valid_from:  string
    valid_until?: string
  }) => apiRequest<import('./types').CotisationPlan>('/api/v1/cotisation-plans', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePlan: (id: string, data: {
    label?:       string
    amount?:      number
    valid_until?: string
    is_active?:   boolean
  }) => apiRequest<import('./types').CotisationPlan>(`/api/v1/cotisation-plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  initPlanPayments: (id: string) =>
    apiRequest<{ detail: string }>(`/api/v1/cotisation-plans/${id}/init-payments`, {
      method: 'POST',
    }),
  exportCSV: (year: number) =>
    apiDownload(`/api/v1/payments/export?year=${year}`, `cotisations-${year}.csv`),
  record: (data: {
    member_id: string
    cotisation_plan_id: string
    amount: number
    payment_date: string
    period_month: number
    period_year: number
    method: string
    reference?: string
    notes?: string
  }) => apiRequest<import('./types').Payment>('/api/v1/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  confirm: (id: string) =>
    apiRequest<import('./types').Payment>(`/api/v1/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmed' }),
    }),
  memberConfirm: (id: string) =>
    apiRequest<import('./types').Payment>(`/api/v1/payments/${id}/confirm`, {
      method: 'POST',
    }),
  cancelPayment: (id: string) =>
    apiRequest<void>(`/api/v1/payments/${id}`, { method: 'DELETE' }),
}

// ── Events ───────────────────────────────────────────────────────────────────

export const events = {
  list: (params?: { upcoming_only?: boolean; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.upcoming_only) q.set('upcoming_only', 'true')
    if (params?.status)        q.set('status', params.status)
    return apiRequest<import('./types').EventRead[]>(`/api/v1/events?${q}`)
  },
  create: (data: {
    title: string
    event_date: string
    description?: string
    location?: string
    capacity?: number
    ticket_price?: number
  }) => apiRequest<import('./types').EventRead>('/api/v1/events', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<{
    title: string
    event_date: string
    description: string
    location: string
    capacity: number
    ticket_price: number
    status: string
  }>) => apiRequest<import('./types').EventRead>(`/api/v1/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  cancel: (id: string) =>
    apiRequest<void>(`/api/v1/events/${id}`, { method: 'DELETE' }),
  myRegistrations: () =>
    apiRequest<import('./types').EventRegistration[]>('/api/v1/events/my-registrations'),
  myRegistration: (eventId: string) =>
    apiRequest<import('./types').EventRegistration | null>(`/api/v1/events/${eventId}/my-registration`),
  register: (eventId: string, memberId: string, amount_paid = 0) =>
    apiRequest<import('./types').EventRegistration>(`/api/v1/events/${eventId}/registrations`, {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId, amount_paid }),
    }),
  unregister: (eventId: string, registrationId: string) =>
    apiRequest<void>(`/api/v1/events/${eventId}/registrations/${registrationId}`, { method: 'DELETE' }),
}

// ── Upload ────────────────────────────────────────────────────────────────────

export const upload = {
  image: (file: File) => apiUpload('/api/v1/upload/image', file),
}

// ── Collectes ─────────────────────────────────────────────────────────────────

export const collectes = {
  list: (params?: { active_only?: boolean; include_archived?: boolean }) => {
    const q = new URLSearchParams()
    if (params?.active_only)     q.set('active_only',     'true')
    if (params?.include_archived) q.set('include_archived', 'true')
    return apiRequest<import('./types').CollecteRead[]>(`/api/v1/collectes?${q}`)
  },
  get: (id: string) =>
    apiRequest<import('./types').CollecteRead>(`/api/v1/collectes/${id}`),
  create: (data: {
    title: string
    beneficiary_name: string
    photo_url?: string
    description?: string
    min_amount?: number
    start_date: string
    category?: string
  }) => apiRequest<import('./types').CollecteRead>('/api/v1/collectes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  contribute: (id: string, amount: number, is_anonymous = false) =>
    apiRequest<import('./types').ContributionRead>(`/api/v1/collectes/${id}/contributions`, {
      method: 'POST',
      body: JSON.stringify({ amount, is_anonymous }),
    }),
  contributions: (id: string) =>
    apiRequest<import('./types').ContributionRead[]>(`/api/v1/collectes/${id}/contributions`),
  update: (id: string, data: {
    title?: string
    beneficiary_name?: string
    photo_url?: string
    description?: string
    min_amount?: number
  }) => apiRequest<import('./types').CollecteRead>(`/api/v1/collectes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  close: (id: string) =>
    apiRequest<import('./types').CollecteRead>(`/api/v1/collectes/${id}/close`, {
      method: 'PATCH',
    }),
  archive: (id: string) =>
    apiRequest<import('./types').CollecteRead>(`/api/v1/collectes/${id}/archive`, {
      method: 'PATCH',
    }),
}
