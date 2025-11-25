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
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    
    // Use redirect for iOS, development, or if popup is not supported
    if (isIOS || isDevelopment) {
      console.log(isIOS ? 'iOS device detected, using loginRedirect' : 'Development mode, using loginRedirect');
      return msalInstance.loginRedirect(loginRequest);
    }
    
    // Production desktop/Android: try popup first, fallback to redirect
    try {
      const resp = await msalInstance.loginPopup(loginRequest);
      msalInstance.setActiveAccount(resp.account);
      return resp;
    } catch (error) {
      console.log('Popup failed, trying redirect as fallback:', error);
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
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    const logoutRequest = {
      postLogoutRedirectUri: CONFIG.auth.postLogoutRedirectUri
    };

    // Use redirect for iOS or development
    if (isIOS || isDevelopment) {
      await msalInstance.logoutRedirect(logoutRequest);
    } else {
      try {
        await msalInstance.logoutPopup(logoutRequest);
      } catch (error) {
        console.log('Logout popup failed, using redirect:', error);
        await msalInstance.logoutRedirect(logoutRequest);
      }
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
