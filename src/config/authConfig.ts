import { Configuration, PopupRequest } from '@azure/msal-browser'

// Azure AD B2C Configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'your-client-id',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'your-tenant-id'}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_POST_LOGOUT_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return
        }
        switch (level) {
          case 0: // LogLevel.Error
            console.error(message)
            return
          case 1: // LogLevel.Warning
            console.warn(message)
            return
          case 2: // LogLevel.Info
            console.info(message)
            return
          case 3: // LogLevel.Verbose
            console.debug(message)
            return
        }
      },
    },
    // Fix for browser compatibility
    allowNativeBroker: false,
    allowRedirectInIframe: false,
  },
}

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
  scopes: [
    'User.Read',
    'User.ReadBasic.All',
    'GroupMember.Read.All',
  ],
  prompt: 'select_account',
}

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphGroupsEndpoint: 'https://graph.microsoft.com/v1.0/me/memberOf',
}

// Environment variables for different environments
export const environmentConfig = {
  development: {
    dataverseUrl: import.meta.env.VITE_DATAVERSE_URL_DEV || 'https://your-dev-environment.crm4.dynamics.com',
    apiVersion: 'v9.0',
  },
  production: {
    dataverseUrl: import.meta.env.VITE_DATAVERSE_URL_PROD || 'https://your-prod-environment.crm4.dynamics.com',
    apiVersion: 'v9.0',
  },
}

// Get current environment
export const getCurrentEnvironment = () => {
  return import.meta.env.MODE === 'production' ? 'production' : 'development'
}

// Get DataVerse configuration for current environment
export const getDataverseConfig = () => {
  const env = getCurrentEnvironment()
  return environmentConfig[env]
}
