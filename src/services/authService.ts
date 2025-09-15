import { PublicClientApplication, Configuration } from '@azure/msal-browser'
import { msalConfig } from '../config/authConfig'

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig)

// Initialize MSAL
export const initializeMsal = async () => {
  await msalInstance.initialize()
}

// Login function
export const login = async () => {
  try {
    const loginRequest = {
      scopes: ['User.Read', 'User.ReadBasic.All', 'GroupMember.Read.All'],
      prompt: 'select_account',
    }

    const response = await msalInstance.loginPopup(loginRequest)
    return response
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}

// Logout function
export const logout = async () => {
  try {
    await msalInstance.logoutPopup({
      postLogoutRedirectUri: window.location.origin,
    })
  } catch (error) {
    console.error('Logout failed:', error)
    throw error
  }
}

// Get access token
export const getAccessToken = async (scopes: string[]) => {
  try {
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length === 0) {
      throw new Error('No accounts found')
    }

    const response = await msalInstance.acquireTokenSilent({
      scopes,
      account: accounts[0],
    })

    return response.accessToken
  } catch (error) {
    console.error('Failed to acquire token:', error)
    throw error
  }
}

// Check if user is authenticated
export const isAuthenticated = () => {
  const accounts = msalInstance.getAllAccounts()
  return accounts.length > 0
}

// Get current user account
export const getCurrentAccount = () => {
  const accounts = msalInstance.getAllAccounts()
  return accounts.length > 0 ? accounts[0] : null
}
