import React, { useState } from 'react'
import { 
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip
} from '@mui/material'
import { 
  Search,
  Add,
  Person,
  Phone,
  Email,
  CalendarToday,
  Description,
  Edit,
  Close
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '../hooks/useAuth'
import { useUserRoles } from '../hooks/useUserRoles'
import { dataverseService } from '../services/dataverseService'
import { externalApiService } from '../services/externalApiService'
import { Patient, FolkeregisterPerson } from '../types'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

const PatientSearchPage: React.FC = () => {
  const { user } = useAuth()
  const { roles } = useUserRoles()
  const queryClient = useQueryClient()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Search patients
  const { data: patients, isLoading: patientsLoading, refetch: searchPatients } = useQuery(
    ['patients', searchQuery],
    () => dataverseService.searchPatients(searchQuery),
    {
      enabled: false, // Only search when explicitly triggered
    }
  )

  // Search in folkeregister
  const { data: folkeregisterResults, isLoading: folkeregisterLoading } = useQuery(
    ['folkeregister', searchQuery],
    () => externalApiService.searchPersonComprehensive(searchQuery),
    {
      enabled: false,
    }
  )

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchPatients()
    }
  }

  const handleFolkeregisterSearch = () => {
    if (searchQuery.trim()) {
      // This would trigger the folkeregister search
      // Implementation depends on your specific needs
    }
  }

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsDetailsOpen(true)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: nb })
    } catch {
      return dateString
    }
  }

  const canCreatePatient = roles.includes('HealthcareProvider') || roles.includes('Admin')
  const canEditPatient = roles.includes('HealthcareProvider') || roles.includes('Admin')

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Pasientoppslag
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Søk etter og administrer pasientdata
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Søk etter pasienter
          </Typography>
          <Grid container spacing={2} alignItems="end">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Søk etter navn eller personnummer"
                placeholder="Skriv navn eller personnummer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearch}
                startIcon={<Search />}
                disabled={!searchQuery.trim()}
              >
                Søk i database
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleFolkeregisterSearch}
                startIcon={<Search />}
                disabled={!searchQuery.trim()}
              >
                Søk i folkeregister
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {canCreatePatient && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Button
              variant="contained"
              onClick={() => setIsCreateOpen(true)}
              startIcon={<Add />}
            >
              Registrer ny pasient
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Søkeresultater
          </Typography>
          {patientsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress size={60} />
            </Box>
          ) : patients && patients.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Navn</TableCell>
                    <TableCell>Personnummer</TableCell>
                    <TableCell>Fødselsdato</TableCell>
                    <TableCell>Kontakt</TableCell>
                    <TableCell>Handlinger</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.sogv_vaksineinnbyggerid}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person />
                          {patient.sogv_fornavn} {patient.sogv_etternavn}
                        </Box>
                      </TableCell>
                      <TableCell>{patient.sogv_personnummer}</TableCell>
                      <TableCell>{formatDate(patient.sogv_fodselsdato)}</TableCell>
                      <TableCell>
                        <Box>
                          {patient.sogv_telefon && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Phone fontSize="small" />
                              {patient.sogv_telefon}
                            </Box>
                          )}
                          {patient.sogv_epost && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Email fontSize="small" />
                              {patient.sogv_epost}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            onClick={() => handlePatientSelect(patient)}
                            startIcon={<Description />}
                          >
                            Vis detaljer
                          </Button>
                          {canEditPatient && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Edit />}
                            >
                              Rediger
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                Ingen pasienter funnet. Prøv et annet søk.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Pasientdetaljer
          <IconButton
            onClick={() => setIsDetailsOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Navn:</Typography>
                <Typography>{selectedPatient.sogv_fornavn} {selectedPatient.sogv_etternavn}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Personnummer:</Typography>
                <Typography>{selectedPatient.sogv_personnummer}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Fødselsdato:</Typography>
                <Typography>{formatDate(selectedPatient.sogv_fodselsdato)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Telefon:</Typography>
                <Typography>{selectedPatient.sogv_telefon || 'Ikke oppgitt'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">E-post:</Typography>
                <Typography>{selectedPatient.sogv_epost || 'Ikke oppgitt'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Adresse:</Typography>
                <Typography>{selectedPatient.sogv_adresse || 'Ikke oppgitt'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDetailsOpen(false)}>Lukk</Button>
          <Button variant="contained">Se vaksinasjonsjournal</Button>
        </DialogActions>
      </Dialog>

      {/* Create Patient Dialog */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Registrer ny pasient
          <IconButton
            onClick={() => setIsCreateOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fornavn"
                required
                placeholder="Skriv fornavn..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Etternavn"
                required
                placeholder="Skriv etternavn..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Personnummer"
                required
                placeholder="DDMMÅÅÅÅÅÅÅ"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fødselsdato"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefon"
                placeholder="Skriv telefonnummer..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="E-post"
                type="email"
                placeholder="Skriv e-postadresse..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateOpen(false)}>Avbryt</Button>
          <Button variant="contained">Registrer pasient</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PatientSearchPage