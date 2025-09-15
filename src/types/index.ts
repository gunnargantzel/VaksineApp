// User and Authentication Types
export interface User {
  id: string
  email: string
  name: string
  givenName: string
  surname: string
  roles: string[]
  groups: string[]
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  error: string | null
}

// DataVerse Entity Types
export interface Patient {
  sogv_vaksineinnbyggerid: string
  sogv_fornavn: string
  sogv_etternavn: string
  sogv_fodselsdato: string
  sogv_personnummer: string
  sogv_telefon: string
  sogv_epost: string
  sogv_adresse: string
  sogv_createdon: string
  sogv_modifiedon: string
}

export interface VaccinationRecord {
  sogv_vaksineringid: string
  sogv_pasientid: string
  sogv_vaksinetypeid: string
  sogv_vaksinasjonsdato: string
  sogv_lotnummer: string
  sogv_helsepersonellid: string
  sogv_dosage: number
  sogv_bivirkninger: string
  sogv_notater: string
  sogv_createdon: string
  sogv_modifiedon: string
}

export interface VaccineType {
  sogv_vaksinetypeid: string
  sogv_vaksinenavn: string
  sogv_produsent: string
  sogv_sykdom: string
  sogv_dosageform: string
  sogv_lagringsbetingelser: string
  sogv_utlopstid: number
  sogv_kontraindikasjoner: string
  sogv_aktiv: boolean
}

export interface HealthcareProvider {
  sogv_helsepersonellid: string
  sogv_navn: string
  sogv_type: string
  sogv_autorisasjonsnummer: string
  sogv_telefon: string
  sogv_epost: string
  sogv_adresse: string
  sogv_spesialisering: string
  sogv_aktiv: boolean
}

export interface Appointment {
  sogv_avtaleid: string
  sogv_pasientid: string
  sogv_helsepersonellid: string
  sogv_vaksinetypeid: string
  sogv_avtaletid: string
  sogv_status: string
  sogv_notater: string
  sogv_paminnelsesendt: boolean
}

// API Response Types
export interface ApiResponse<T> {
  value: T[]
  '@odata.context': string
  '@odata.count'?: number
  '@odata.nextLink'?: string
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: any[]
  }
}

// Form Types
export interface VaccinationFormData {
  patientId: string
  vaccineTypeId: string
  vaccinationDate: string
  lotNumber: string
  dosage: number
  sideEffects: string
  notes: string
}

export interface PatientFormData {
  firstName: string
  lastName: string
  dateOfBirth: string
  personNumber: string
  phone: string
  email: string
  address: string
  emergencyContact: string
  medicalConditions: string
  allergies: string
}

// Search and Filter Types
export interface SearchFilters {
  name?: string
  personNumber?: string
  dateOfBirth?: string
  phone?: string
  email?: string
}

export interface VaccinationFilters {
  patientId?: string
  vaccineTypeId?: string
  dateFrom?: string
  dateTo?: string
  healthcareProviderId?: string
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface NotificationState {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

// Role and Permission Types
export interface UserRole {
  name: string
  permissions: Permission[]
}

export interface Permission {
  resource: string
  actions: string[]
  scope: 'user' | 'businessunit' | 'organization'
}

// External API Types (matching original app)
export interface FolkeregisterPerson {
  fornavn: string
  etternavn: string
  mellomnavn?: string
  foedselsdato: string
  personidentifikator: string
  adresse?: {
    adressenavn: string
    husnummer: string
    postnummer: string
    poststed: string
  }
}

export interface CovidVaccinationData {
  patientNin: string
  kanLevereUtData: boolean
  immunizations: CovidImmunization[]
}

export interface CovidImmunization {
  vaccinationDate: string
  vaccineCode: {
    system: string
    code: string
    display: string
  }
  atcCode: string
  lotNumber: string
  preparation: {
    system: string
    code: string
    display: string
  }
  identifier: string
  recordedDate: string
  recorder: {
    system: string
    code: string
    display: string
    id: string
    name: string
  }
  performedByRecorder: boolean
}

export interface KRRContactInfo {
  mobilnummer: string
  epost: string
  reservert: boolean
}

// Component Props Types
export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

export interface PaginationState {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

// Environment Configuration
export interface EnvironmentConfig {
  dataverseUrl: string
  apiVersion: string
  clientId: string
  tenantId: string
  redirectUri: string
}
