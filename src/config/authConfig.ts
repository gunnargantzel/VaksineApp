// Azure AD Configuration - using global MSAL from CDN
declare global {
  interface Window {
    msal: any;
  }
}

// Configuration object
export const CONFIG = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'your-client-id',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'your-tenant-id'}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_POST_LOGOUT_REDIRECT_URI || window.location.origin,
    scopes: ["User.Read", "profile", "email", "openid", "User.ReadBasic.All", "GroupMember.Read.All"]
  },
  messages: {
    success: {
      loginSuccess: "Innlogging vellykket!",
      logoutSuccess: "Utlogging vellykket!"
    },
    errors: {
      authError: "Feil ved autentisering. Vennligst prøv igjen.",
      networkError: "Nettverksfeil. Sjekk internettforbindelsen."
    }
  }
};

// MSAL Configuration
export const msalConfig = {
  auth: {
    ...CONFIG.auth,
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: number, message: string, containsPii: boolean) => {
        if (containsPii) return;
        console.log(`[MSAL ${level}]: ${message}`);
      },
      piiLoggingEnabled: false,
      logLevel: 2 // Info level
    }
  }
};

// Login request configuration
export const loginRequest = {
  scopes: CONFIG.auth.scopes,
  prompt: 'select_account'
};

// Graph API endpoints
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphGroupsEndpoint: 'https://graph.microsoft.com/v1.0/me/memberOf',
};

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
