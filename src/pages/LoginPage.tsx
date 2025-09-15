import React, { useEffect } from 'react'
import { 
  Button,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import { 
  Security,
  People,
  Description,
  CheckCircle
} from '@mui/icons-material'
import { useMsal } from '@azure/msal-react'
import { login } from '../services/authService'

const LoginPage: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    if (accounts.length > 0) {
      // User is already logged in, redirect will be handled by App component
      return
    }
  }, [accounts])

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await login()
    } catch (error: any) {
      console.error('Login failed:', error)
      setError(error.message || 'Innlogging feilet. Prøv igjen.')
    } finally {
      setIsLoading(false)
    }
  }

  if (inProgress === 'login') {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Container maxWidth="sm">
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh"
        py={4}
      >
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={4}>
              <Typography variant="h3" component="h1" gutterBottom color="primary">
                VaksineApp
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                Moderne vaksinasjonsadministrasjon med Entra ID og DataVerse
              </Typography>
            </Box>

            <Grid container spacing={2} mb={4}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Security color="primary" />
                  <Typography variant="body2">Sikker autentisering</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <People color="primary" />
                  <Typography variant="body2">Pasientadministrasjon</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Description color="primary" />
                  <Typography variant="body2">Vaksinasjonsjournaler</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle color="primary" />
                  <Typography variant="body2">Integrasjon med nasjonale registre</Typography>
                </Box>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleLogin}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
              sx={{ mb: 2 }}
            >
              {isLoading ? 'Logger inn...' : 'Logg inn med Entra ID'}
            </Button>

            {error && (
              <Typography color="error" variant="body2" textAlign="center" mt={1}>
                {error}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
              Logg inn med din organisasjonskonto for å få tilgang til systemet
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default LoginPage