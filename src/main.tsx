import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import App from './App.tsx'
import { msalConfig } from './config/authConfig.ts'
import './index.css'

// Create MSAL instance using global MSAL from CDN
let msalInstance: any = null;

// Initialize MSAL with error handling
const initializeMsal = async () => {
  try {
    console.log('AuthManager: Starting initialization...');
    
    // Check if MSAL is available (like in auth.js)
    if (typeof (window as any).msal === 'undefined') {
      console.error('MSAL library not loaded');
      throw new Error('MSAL library not loaded');
    }
    console.log('MSAL library is available');
    
    // Additional check for MSAL object
    if (!(window as any).msal.PublicClientApplication) {
      console.error('MSAL PublicClientApplication not available');
      throw new Error('MSAL PublicClientApplication not available');
    }
    console.log('MSAL PublicClientApplication is available');
    
    // Create MSAL instance
    console.log('Creating MSAL instance...');
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    console.log('iOS detected:', isIOS);
    
    msalInstance = new (window as any).msal.PublicClientApplication({
      auth: {
        ...msalConfig.auth,
        navigateToLoginRequestUrl: false
      },
      cache: {
        cacheLocation: isIOS ? 'sessionStorage' : 'localStorage',
        storeAuthStateInCookie: isIOS ? true : false
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
    });
    console.log('MSAL instance created');
    
    // Set global instance for use in hooks
    (window as any).msalInstance = msalInstance;
    
    // Add event callback for token/account events
    msalInstance.addEventCallback((event: any) => {
      if (event.eventType === (window as any).msal.EventType.LOGIN_SUCCESS && event.payload?.account) {
        msalInstance.setActiveAccount(event.payload.account);
      }
      if (event.eventType === (window as any).msal.EventType.ACQUIRE_TOKEN_SUCCESS && event.payload?.account) {
        msalInstance.setActiveAccount(event.payload.account);
      }
    });

    // Handle redirect promise
    console.log('Handling redirect promise...');
    const response = await msalInstance.handleRedirectPromise();
    console.log('Redirect promise handled');
    
    if (response?.account) {
      console.log('Redirect response received:', response);
      console.log('Redirect response account:', response.account);
      msalInstance.setActiveAccount(response.account);
      console.log('Login successful via redirect:', response.account.username);
    } else {
      // Check if user is already logged in
      console.log('Checking for existing accounts...');
      const accounts = msalInstance.getAllAccounts();
      console.log('Found accounts:', accounts.length);
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
        console.log('User already logged in:', accounts[0].username);
      }
    }
    
    console.log('MSAL initialized successfully');
  } catch (error) {
    console.error('MSAL initialization failed:', error);
    // Continue with app initialization even if MSAL fails
  }
}

// Initialize MSAL
initializeMsal()

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#034B45',
      light: '#479a93',
      dark: '#1d726b',
    },
    secondary: {
      main: '#00BCF2',
    },
    background: {
      default: '#f8f9fa',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
