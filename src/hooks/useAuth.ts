import { useMsal } from '@azure/msal-react'
import { useQuery } from 'react-query'
import { useMemo } from 'react'
import { User, AuthState } from '../types'
import { graphConfig } from '../config/authConfig'
import { msalInstance } from '../services/authService'

export const useAuth = () => {
  const { accounts, instance } = useMsal()

  const { data: user, isLoading, error } = useQuery<User | null>(
    ['user', accounts[0]?.localAccountId],
    async () => {
      if (!accounts[0]) return null

      try {
        // Get user info from Microsoft Graph
        const response = await instance.acquireTokenSilent({
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
      enabled: !!accounts[0],
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  const authState: AuthState = useMemo(() => ({
    isAuthenticated: !!user,
    user,
    loading: isLoading,
    error: error?.message || null,
  }), [user, isLoading, error])

  return authState
}
