import axios, { AxiosInstance } from 'axios'
import { getAccessToken } from './authService'
import { 
  FolkeregisterPerson, 
  CovidVaccinationData, 
  KRRContactInfo 
} from '../types'

class ExternalApiService {
  private folkeregisterApi: AxiosInstance
  private vaksineringApi: AxiosInstance
  private krrApi: AxiosInstance

  constructor() {
    // FiksFolkeregisteret API
    this.folkeregisterApi = axios.create({
      baseURL: import.meta.env.VITE_FIKS_FOLKEREGISTERET_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Vaksinering API
    this.vaksineringApi = axios.create({
      baseURL: import.meta.env.VITE_VAKSINERING_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // KRR API
    this.krrApi = axios.create({
      baseURL: import.meta.env.VITE_KRR_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add auth interceptors
    this.setupAuthInterceptors()
  }

  private setupAuthInterceptors() {
    const addAuthInterceptor = (api: AxiosInstance) => {
      api.interceptors.request.use(async (config) => {
        try {
          const token = await getAccessToken(['https://graph.microsoft.com/.default'])
          config.headers.Authorization = `Bearer ${token}`
        } catch (error) {
          console.error('Failed to get access token for external API:', error)
        }
        return config
      })
    }

    addAuthInterceptor(this.folkeregisterApi)
    addAuthInterceptor(this.vaksineringApi)
    addAuthInterceptor(this.krrApi)
  }

  // FiksFolkeregisteret operations
  async searchPerson(query: string): Promise<FolkeregisterPerson[]> {
    try {
      const response = await this.folkeregisterApi.get('/v1/personer/soek', {
        params: {
          navn: query,
          maksTreff: 10,
        },
      })
      return response.data.foedselsEllerDNummer || []
    } catch (error) {
      console.error('Error searching person in folkeregister:', error)
      throw error
    }
  }

  async getPersonDetails(personNumber: string): Promise<FolkeregisterPerson> {
    try {
      const response = await this.folkeregisterApi.get(`/v1/personer/${personNumber}`)
      return response.data
    } catch (error) {
      console.error('Error getting person details from folkeregister:', error)
      throw error
    }
  }

  async getLatestPersonVersion(personNumber: string): Promise<FolkeregisterPerson> {
    try {
      const response = await this.folkeregisterApi.get(`/v1/personer/${personNumber}`)
      return response.data
    } catch (error) {
      console.error('Error getting latest person version:', error)
      throw error
    }
  }

  // Vaksinering API operations
  async getCovidVaccinations(personNumber: string): Promise<CovidVaccinationData> {
    try {
      const response = await this.vaksineringApi.get('/covidvaksineringer', {
        params: {
          Fnr: personNumber,
        },
      })
      return response.data
    } catch (error) {
      console.error('Error getting COVID vaccinations:', error)
      throw error
    }
  }

  // KRR operations
  async getContactInfo(personNumber: string): Promise<KRRContactInfo> {
    try {
      const response = await this.krrApi.get(`/rest/v1/personer/${personNumber}`)
      return response.data
    } catch (error) {
      console.error('Error getting contact info from KRR:', error)
      throw error
    }
  }

  async getMultipleContactInfo(personNumbers: string[]): Promise<KRRContactInfo[]> {
    try {
      const response = await this.krrApi.post('/rest/v1/personer', {
        personer: personNumbers.map(fnr => ({ personidentifikator: fnr }))
      })
      return response.data.personer || []
    } catch (error) {
      console.error('Error getting multiple contact info from KRR:', error)
      throw error
    }
  }

  // Combined operations
  async getCompletePersonInfo(personNumber: string) {
    try {
      const [personDetails, contactInfo, covidVaccinations] = await Promise.allSettled([
        this.getPersonDetails(personNumber),
        this.getContactInfo(personNumber),
        this.getCovidVaccinations(personNumber),
      ])

      return {
        personDetails: personDetails.status === 'fulfilled' ? personDetails.value : null,
        contactInfo: contactInfo.status === 'fulfilled' ? contactInfo.value : null,
        covidVaccinations: covidVaccinations.status === 'fulfilled' ? covidVaccinations.value : null,
        errors: [
          personDetails.status === 'rejected' ? personDetails.reason : null,
          contactInfo.status === 'rejected' ? contactInfo.reason : null,
          covidVaccinations.status === 'rejected' ? covidVaccinations.reason : null,
        ].filter(Boolean),
      }
    } catch (error) {
      console.error('Error getting complete person info:', error)
      throw error
    }
  }

  // Search with multiple sources
  async searchPersonComprehensive(query: string) {
    try {
      // Search in folkeregister
      const folkeregisterResults = await this.searchPerson(query)
      
      // Get contact info for found persons
      const personNumbers = folkeregisterResults.map(person => person.personidentifikator)
      const contactInfoResults = personNumbers.length > 0 
        ? await this.getMultipleContactInfo(personNumbers)
        : []

      // Combine results
      return folkeregisterResults.map((person, index) => ({
        ...person,
        contactInfo: contactInfoResults[index] || null,
      }))
    } catch (error) {
      console.error('Error in comprehensive person search:', error)
      throw error
    }
  }
}

// Export singleton instance
export const externalApiService = new ExternalApiService()
export default externalApiService
