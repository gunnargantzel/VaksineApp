import { useQuery } from 'react-query'
import { useMemo, useState, useEffect } from 'react'
import { User, AuthState } from '../types'
import { graphConfig } from '../config/authConfig'

// Global MSAL instance
let globalMsalInstance: any = null;

export const useAuth = () => {
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

  const { data: user, isLoading, error } = useQuery<User | null>(
    ['user', accounts[0]?.localAccountId],
    async () => {
      if (!accounts[0] || !globalMsalInstance) return null

      try {
        // Get user info from Microsoft Graph
        const response = await globalMsalInstance.acquireTokenSilent({
          scopes: ['User.Read'],
          account: accounts[0],
        })

        const graphResponse = await fetch(graphConfig.graphMeEndpoint, {
          headers: {
            Authorization: `Bearer ${response.accessToken}`,
          },
        })

        if (!graphResponse.ok) {
          throw new Error('Failed to fetch user info')
        }

        const userData = await graphResponse.json()

        return {
          id: userData.id,
          email: userData.mail || userData.userPrincipalName,
          name: userData.displayName,
          givenName: userData.givenName,
          surname: userData.surname,
          roles: [], // Will be populated by useUserRoles
          groups: [], // Will be populated by useUserRoles
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
        throw error
      }
    },
    {
      enabled: !!accounts[0] && isInitialized,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  const authState: AuthState = useMemo(() => ({
    isAuthenticated: !!user,
    user,
    loading: isLoading || !isInitialized,
    error: error?.message || null,
  }), [user, isLoading, error, isInitialized])

  return authState
}
