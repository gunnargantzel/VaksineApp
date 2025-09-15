import React from 'react'
import { 
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Box,
  Grid,
  Chip
} from '@mui/material'
import { 
  People,
  Vaccines,
  CalendarToday,
  Person,
  Description
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { useAuth } from '../hooks/useAuth'
import { useUserRoles } from '../hooks/useUserRoles'
import { dataverseService } from '../services/dataverseService'
import { useNavigate } from 'react-router-dom'

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { roles } = useUserRoles()

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboardStats',
    async () => {
      const [patients, vaccinations, appointments] = await Promise.all([
        dataverseService.getPatients({ $count: true }),
        dataverseService.getVaccinationRecords({ $count: true }),
        dataverseService.getAppointments({ $count: true }),
      ])

      return {
        totalPatients: patients.length,
        totalVaccinations: vaccinations.length,
        totalAppointments: appointments.length,
        recentVaccinations: vaccinations.slice(0, 5),
      }
    },
    {
      enabled: roles.length > 0,
    }
  )

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'Administrator'
      case 'HealthcareProvider':
        return 'Helsepersonell'
      case 'Patient':
        return 'Pasient'
      default:
        return role
    }
  }

  const getRoleColor = (role: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (role) {
      case 'Admin':
        return 'error'
      case 'HealthcareProvider':
        return 'success'
      case 'Patient':
        return 'primary'
      default:
        return 'default'
    }
  }

  if (statsLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight={400}
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Velkommen, {user?.givenName}!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Oversikt over vaksinasjonsadministrasjon
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {roles.map((role) => (
            <Chip
              key={role}
              label={getRoleDisplayName(role)}
              color={getRoleColor(role)}
              variant="filled"
            />
          ))}
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <People sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h3" component="div" color="primary" gutterBottom>
                {stats?.totalPatients || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registrerte pasienter
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Vaccines sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h3" component="div" color="primary" gutterBottom>
                {stats?.totalVaccinations || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Utførte vaksinasjoner
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <CalendarToday sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
              <Typography variant="h3" component="div" color="primary" gutterBottom>
                {stats?.totalAppointments || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Planlagte avtaler
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pasientadministrasjon
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Søk etter pasienter, vis vaksinasjonshistorikk og administrer pasientdata
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/patients')}
                startIcon={<People />}
              >
                Gå til pasienter
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {(roles.includes('HealthcareProvider') || roles.includes('Admin')) && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vaksinasjonsadministrasjon
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Registrer nye vaksinasjoner, oppdater journaler og administrer vaksinasjonsdata
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/vaccination')}
                  startIcon={<Vaccines />}
                >
                  Gå til vaksinasjon
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {roles.includes('Admin') && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Systemadministrasjon
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Administrer brukere, roller, systeminnstillinger og rapporter
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/admin')}
                  startIcon={<Person />}
                >
                  Gå til admin
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {roles.includes('Patient') && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Min vaksinasjonsjournal
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Se din vaksinasjonshistorikk, kommende avtaler og vaksinasjonsstatus
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/patients')}
                  startIcon={<Description />}
                >
                  Se min journal
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default DashboardPage