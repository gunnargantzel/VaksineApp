import { useQuery } from 'react-query'
import { useMemo, useState, useEffect } from 'react'

interface UserRoles {
  roles: string[]
  groups: string[]
  isAdmin: boolean
  isHealthcareProvider: boolean
  isPatient: boolean
}

// Global MSAL instance
let globalMsalInstance: any = null;

export const useUserRoles = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Get MSAL instance from global scope
    const checkMsalInstance = () => {
      const existingInstance = (window as any).msalInstance;
      if (existingInstance) {
        globalMsalInstance = existingInstance;
        const currentAccounts = globalMsalInstance.getAllAccounts();
        setAccounts(currentAccounts);
        setIsInitialized(true);
      } else {
        // Retry after a short delay
        setTimeout(checkMsalInstance, 100);
      }
    };

    checkMsalInstance();
  }, []);

  const { data: rolesData, isLoading, error } = useQuery<UserRoles>(
    ['userRoles', accounts[0]?.localAccountId],
    async () => {
      if (!accounts[0] || !globalMsalInstance) {
        return {
          roles: [],
          groups: [],
          isAdmin: false,
          isHealthcareProvider: false,
          isPatient: false,
        }
      }

      try {
        // Get user's group memberships
        const response = await globalMsalInstance.acquireTokenSilent({
          scopes: ['GroupMember.Read.All'],
          account: accounts[0],
        })

        const graphResponse = await fetch(
          'https://graph.microsoft.com/v1.0/me/memberOf',
          {
            headers: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          }
        )

        if (!graphResponse.ok) {
          throw new Error('Failed to fetch user groups')
        }

        const groupsData = await graphResponse.json()
        const groups = groupsData.value.map((group: any) => group.id)
        const groupNames = groupsData.value.map((group: any) => group.displayName)

        // Check for specific role groups
        const adminGroupId = import.meta.env.VITE_ADMIN_AD_GROUP
        const healthcareProviderGroupId = import.meta.env.VITE_ANSATT_VAKSINE_AD_GROUP
        const patientGroupId = import.meta.env.VITE_INNBYGGER_VAKSINE_AD_GROUP

        const isAdmin = groups.includes(adminGroupId)
        const isHealthcareProvider = groups.includes(healthcareProviderGroupId)
        const isPatient = groups.includes(patientGroupId)

        // Build roles array
        const roles: string[] = []
        if (isAdmin) roles.push('Admin')
        if (isHealthcareProvider) roles.push('HealthcareProvider')
        if (isPatient) roles.push('Patient')

        return {
          roles,
          groups,
          isAdmin,
          isHealthcareProvider,
          isPatient,
        }
      } catch (error) {
        console.error('Error fetching user roles:', error)
        throw error
      }
    },
    {
      enabled: !!accounts[0] && isInitialized,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  return {
    ...rolesData,
    loading: isLoading || !isInitialized,
    error: error?.message || null,
  }
}
