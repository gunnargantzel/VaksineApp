import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { getAccessToken } from './authService'
import { getDataverseConfig } from '../config/authConfig'
import { 
  Patient, 
  VaccinationRecord, 
  VaccineType, 
  HealthcareProvider, 
  Appointment,
  ApiResponse,
  ApiError 
} from '../types'

class DataVerseService {
  private api: AxiosInstance
  private baseUrl: string

  constructor() {
    const config = getDataverseConfig()
    this.baseUrl = `${config.dataverseUrl}/api/data/${config.apiVersion}`
    
    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
    })

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(async (config) => {
      try {
        const token = await getAccessToken(['https://your-environment.crm4.dynamics.com/.default'])
        config.headers.Authorization = `Bearer ${token}`
      } catch (error) {
        console.error('Failed to get access token:', error)
      }
      return config
    })

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('DataVerse API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // Patient operations
  async getPatients(filters?: any): Promise<Patient[]> {
    const response: AxiosResponse<ApiResponse<Patient>> = await this.api.get('/sogv_vaksineinnbyggers', {
      params: filters,
    })
    return response.data.value
  }

  async getPatient(id: string): Promise<Patient> {
    const response: AxiosResponse<Patient> = await this.api.get(`/sogv_vaksineinnbyggers(${id})`)
    return response.data
  }

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    const response: AxiosResponse<Patient> = await this.api.post('/sogv_vaksineinnbyggers', patient)
    return response.data
  }

  async updatePatient(id: string, patient: Partial<Patient>): Promise<Patient> {
    const response: AxiosResponse<Patient> = await this.api.patch(`/sogv_vaksineinnbyggers(${id})`, patient)
    return response.data
  }

  // Vaccination record operations
  async getVaccinationRecords(filters?: any): Promise<VaccinationRecord[]> {
    const response: AxiosResponse<ApiResponse<VaccinationRecord>> = await this.api.get('/sogv_vaksinerings', {
      params: filters,
    })
    return response.data.value
  }

  async getVaccinationRecord(id: string): Promise<VaccinationRecord> {
    const response: AxiosResponse<VaccinationRecord> = await this.api.get(`/sogv_vaksinerings(${id})`)
    return response.data
  }

  async createVaccinationRecord(record: Partial<VaccinationRecord>): Promise<VaccinationRecord> {
    const response: AxiosResponse<VaccinationRecord> = await this.api.post('/sogv_vaksinerings', record)
    return response.data
  }

  async updateVaccinationRecord(id: string, record: Partial<VaccinationRecord>): Promise<VaccinationRecord> {
    const response: AxiosResponse<VaccinationRecord> = await this.api.patch(`/sogv_vaksinerings(${id})`, record)
    return response.data
  }

  // Vaccine type operations
  async getVaccineTypes(): Promise<VaccineType[]> {
    const response: AxiosResponse<ApiResponse<VaccineType>> = await this.api.get('/sogv_vaksinetypes')
    return response.data.value
  }

  async getVaccineType(id: string): Promise<VaccineType> {
    const response: AxiosResponse<VaccineType> = await this.api.get(`/sogv_vaksinetypes(${id})`)
    return response.data
  }

  // Healthcare provider operations
  async getHealthcareProviders(): Promise<HealthcareProvider[]> {
    const response: AxiosResponse<ApiResponse<HealthcareProvider>> = await this.api.get('/sogv_helsepersonells')
    return response.data.value
  }

  async getHealthcareProvider(id: string): Promise<HealthcareProvider> {
    const response: AxiosResponse<HealthcareProvider> = await this.api.get(`/sogv_helsepersonells(${id})`)
    return response.data
  }

  // Appointment operations
  async getAppointments(filters?: any): Promise<Appointment[]> {
    const response: AxiosResponse<ApiResponse<Appointment>> = await this.api.get('/sogv_avtales', {
      params: filters,
    })
    return response.data.value
  }

  async createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
    const response: AxiosResponse<Appointment> = await this.api.post('/sogv_avtales', appointment)
    return response.data
  }

  async updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    const response: AxiosResponse<Appointment> = await this.api.patch(`/sogv_avtales(${id})`, appointment)
    return response.data
  }

  // Search operations
  async searchPatients(query: string): Promise<Patient[]> {
    const response: AxiosResponse<ApiResponse<Patient>> = await this.api.get('/sogv_vaksineinnbyggers', {
      params: {
        $filter: `contains(sogv_fornavn,'${query}') or contains(sogv_etternavn,'${query}') or contains(sogv_personnummer,'${query}')`,
        $select: 'sogv_vaksineinnbyggerid,sogv_fornavn,sogv_etternavn,sogv_personnummer,sogv_fodselsdato',
      },
    })
    return response.data.value
  }

  // Batch operations
  async batchRequest(requests: any[]): Promise<any[]> {
    const batchPayload = {
      requests: requests.map((req, index) => ({
        id: index.toString(),
        method: req.method,
        url: req.url,
        headers: req.headers || {},
        body: req.body || null,
      })),
    }

    const response = await this.api.post('/$batch', batchPayload, {
      headers: {
        'Content-Type': 'multipart/mixed; boundary=batch',
      },
    })

    return response.data.responses
  }
}

// Export singleton instance
export const dataverseService = new DataVerseService()
export default dataverseService
