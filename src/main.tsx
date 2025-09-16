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
    // Check if MSAL is available
    if (typeof window.msal === 'undefined') {
      console.error('MSAL library not loaded from CDN');
      return;
    }
    
    console.log('MSAL library is available from CDN');
    
    // Create MSAL instance
    msalInstance = new window.msal.PublicClientApplication(msalConfig);
    
    // Set global instance for use in hooks
    (window as any).msalInstance = msalInstance;
    
    // Handle redirect promise
    const response = await msalInstance.handleRedirectPromise();
    
    if (response?.account) {
      msalInstance.setActiveAccount(response.account);
      console.log('Login successful via redirect:', response.account.username);
    } else {
      // Check if user is already logged in
      const accounts = msalInstance.getAllAccounts();
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
