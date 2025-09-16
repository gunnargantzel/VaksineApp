import { CONFIG } from '../config/authConfig'

// Get MSAL instance from global scope
const getMsalInstance = () => {
  return (window as any).msalInstance;
}

// Login function
export const login = async () => {
  try {
    const msalInstance = getMsalInstance();
    if (!msalInstance) {
      throw new Error('MSAL instance not available');
    }

    const loginRequest = {
      scopes: CONFIG.auth.scopes,
      prompt: 'select_account',
    }

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isIOS) {
      console.log('iOS device detected, using loginRedirect');
      return msalInstance.loginRedirect(loginRequest);
    }
    
    // Desktop/Android:
    try {
      const resp = await msalInstance.loginPopup(loginRequest);
      msalInstance.setActiveAccount(resp.account);
      return resp;
    } catch {
      console.log('Popup failed, trying redirect as fallback');
      return msalInstance.loginRedirect(loginRequest);
    }
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}

// Logout function
export const logout = async () => {
  try {
    const msalInstance = getMsalInstance();
    if (!msalInstance) {
      throw new Error('MSAL instance not available');
    }

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const logoutRequest = {
      postLogoutRedirectUri: CONFIG.auth.postLogoutRedirectUri
    };

    if (isIOS) {
      await msalInstance.logoutRedirect(logoutRequest);
    } else {
      await msalInstance.logoutPopup(logoutRequest);
    }
  } catch (error) {
    console.error('Logout failed:', error)
    throw error
  }
}

// Get access token
export const getAccessToken = async (scopes: string[]) => {
  try {
    const msalInstance = getMsalInstance();
    if (!msalInstance) {
      throw new Error('MSAL instance not available');
    }

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
  const msalInstance = getMsalInstance();
  if (!msalInstance) return false;
  
  const accounts = msalInstance.getAllAccounts()
  return accounts.length > 0
}

// Get current user account
export const getCurrentAccount = () => {
  const msalInstance = getMsalInstance();
  if (!msalInstance) return null;
  
  const accounts = msalInstance.getAllAccounts()
  return accounts.length > 0 ? accounts[0] : null
}
