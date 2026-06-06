export interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  birth_date?: string
  joined_at: string
  status: 'active' | 'inactive' | 'suspended' | 'honorary'
  roles: string[]
  created_at: string
  updated_at: string
}

export interface PaginatedMembers {
  items: Member[]
  total: number
  page: number
  size: number
  pages: number
}

export interface TreasurerDashboard {
  total_members: number
  active_members: number
  paid_this_month: number
  unpaid_this_month: number
  revenue_this_month: number
  revenue_ytd: number
  pending_count: number
}

export interface CotisationPlan {
  id: string
  label: string
  amount: number
  frequency: string
  valid_from: string
  valid_until?: string
  is_active: boolean
}

export interface Payment {
  id: string
  member_id: string
  member_name: string
  cotisation_plan_id: string
  plan_label: string
  amount: number
  payment_date: string
  period_month?: number
  period_year: number
  method: string
  status: string
  reference?: string
  notes?: string
}

export interface MonthCell {
  month: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'none'
  amount?: number
  payment_id?: string
}

export interface PaymentGridRow {
  member_id: string
  member_name: string
  year: number
  months: MonthCell[]
}

export interface EventRead {
  id: string
  title: string
  description?: string
  event_date: string
  location?: string
  capacity?: number
  ticket_price: number
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  created_by?: string
  created_at: string
  registrations_count: number
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface CollecteRead {
  id: string
  title: string
  beneficiary_name: string
  photo_url?: string
  description?: string
  min_amount: number
  start_date: string
  end_date: string
  is_closed: boolean
  is_active: boolean
  is_archived: boolean
  archived_at?: string
  category?: string
  status: 'upcoming' | 'active' | 'expired' | 'closed'
  total_collected: number
  contributors_count: number
  created_at: string
}

export interface ContributionRead {
  id: string
  collecte_id: string
  member_id: string
  member_name: string
  amount: number
  contributed_at: string
}
