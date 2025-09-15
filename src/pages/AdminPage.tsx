import React, { useState } from 'react'
import { 
  Typography,
  Card,
  CardContent,
  Button,
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
  Tabs,
  Tab,
  Chip
} from '@mui/material'
import { 
  People,
  Vaccines,
  Settings,
  Edit,
  Description,
  Person,
  CalendarToday,
  Close
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '../hooks/useAuth'
import { useUserRoles } from '../hooks/useUserRoles'
import { dataverseService } from '../services/dataverseService'
import { Patient, VaccinationRecord, VaccineType, HealthcareProvider } from '../types'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

const AdminPage: React.FC = () => {
  const { user } = useAuth()
  const { roles } = useUserRoles()
  const queryClient = useQueryClient()
  
  const [selectedTab, setSelectedTab] = useState(0)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Fetch all data for admin overview
  const { data: patients, isLoading: patientsLoading } = useQuery(
    'adminPatients',
    () => dataverseService.getPatients()
  )

  const { data: vaccinationRecords, isLoading: recordsLoading } = useQuery(
    'adminVaccinationRecords',
    () => dataverseService.getVaccinationRecords()
  )

  const { data: vaccineTypes, isLoading: vaccineTypesLoading } = useQuery(
    'adminVaccineTypes',
    () => dataverseService.getVaccineTypes()
  )

  const { data: healthcareProviders, isLoading: providersLoading } = useQuery(
    'adminHealthcareProviders',
    () => dataverseService.getHealthcareProviders()
  )

  const handleItemSelect = (item: any) => {
    setSelectedItem(item)
    setIsDetailsOpen(true)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: nb })
    } catch {
      return dateString
    }
  }

  const isLoading = patientsLoading || recordsLoading || vaccineTypesLoading || providersLoading

  if (!roles.includes('Admin')) {
    return (
      <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            Du har ikke tilgang til administrasjon.
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Systemadministrasjon
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administrer brukere, data og systeminnstillinger
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab label="Oversikt" />
          <Tab label="Pasienter" />
          <Tab label="Vaksinasjoner" />
          <Tab label="Vaksinetyper" />
          <Tab label="Helsepersonell" />
          <Tab label="Innstillinger" />
        </Tabs>
      </Box>

      <TabPanel value={selectedTab} index={0}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" component="div" color="primary" gutterBottom>
                  {patients?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Registrerte pasienter
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" component="div" color="primary" gutterBottom>
                  {vaccinationRecords?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Utførte vaksinasjoner
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" component="div" color="primary" gutterBottom>
                  {vaccineTypes?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tilgjengelige vaksinetyper
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" component="div" color="primary" gutterBottom>
                  {healthcareProviders?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Registrerte helsepersonell
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Siste aktivitet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Her vil du se siste systemaktivitet og viktige hendelser.
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pasientadministrasjon
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
                      <TableCell>Registrert</TableCell>
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
                        <TableCell>{formatDate(patient.sogv_createdon)}</TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              onClick={() => handleItemSelect(patient)}
                              startIcon={<Description />}
                            >
                              Vis
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Edit />}
                            >
                              Rediger
                            </Button>
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
                  Ingen pasienter funnet.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vaksinasjonsadministrasjon
            </Typography>
            {recordsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress size={60} />
              </Box>
            ) : vaccinationRecords && vaccinationRecords.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pasient</TableCell>
                      <TableCell>Vaksine</TableCell>
                      <TableCell>Dato</TableCell>
                      <TableCell>Lot nummer</TableCell>
                      <TableCell>Handlinger</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vaccinationRecords.map((record) => (
                      <TableRow key={record.sogv_vaksineringid}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Person />
                            {record.sogv_pasientid}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Vaccines />
                            {record.sogv_vaksinetypeid}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CalendarToday />
                            {formatDate(record.sogv_vaksinasjonsdato)}
                          </Box>
                        </TableCell>
                        <TableCell>{record.sogv_lotnummer || 'Ikke oppgitt'}</TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              onClick={() => handleItemSelect(record)}
                              startIcon={<Description />}
                            >
                              Vis
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Edit />}
                            >
                              Rediger
                            </Button>
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
                  Ingen vaksinasjoner funnet.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={selectedTab} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vaksinetyper
            </Typography>
            {vaccineTypesLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress size={60} />
              </Box>
            ) : vaccineTypes && vaccineTypes.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Navn</TableCell>
                      <TableCell>Produsent</TableCell>
                      <TableCell>Sykdom</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Handlinger</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vaccineTypes.map((vaccineType) => (
                      <TableRow key={vaccineType.sogv_vaksinetypeid}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Vaccines />
                            {vaccineType.sogv_vaksinenavn}
                          </Box>
                        </TableCell>
                        <TableCell>{vaccineType.sogv_produsent}</TableCell>
                        <TableCell>{vaccineType.sogv_sykdom}</TableCell>
                        <TableCell>
                          <Chip
                            label={vaccineType.sogv_aktiv ? 'Aktiv' : 'Inaktiv'}
                            color={vaccineType.sogv_aktiv ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              onClick={() => handleItemSelect(vaccineType)}
                              startIcon={<Description />}
                            >
                              Vis
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Edit />}
                            >
                              Rediger
                            </Button>
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
                  Ingen vaksinetyper funnet.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={selectedTab} index={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Helsepersonell
            </Typography>
            {providersLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress size={60} />
              </Box>
            ) : healthcareProviders && healthcareProviders.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Navn</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Autorisasjon</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Handlinger</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {healthcareProviders.map((provider) => (
                      <TableRow key={provider.sogv_helsepersonellid}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Person />
                            {provider.sogv_navn}
                          </Box>
                        </TableCell>
                        <TableCell>{provider.sogv_type}</TableCell>
                        <TableCell>{provider.sogv_autorisasjonsnummer}</TableCell>
                        <TableCell>
                          <Chip
                            label={provider.sogv_aktiv ? 'Aktiv' : 'Inaktiv'}
                            color={provider.sogv_aktiv ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              onClick={() => handleItemSelect(provider)}
                              startIcon={<Description />}
                            >
                              Vis
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Edit />}
                            >
                              Rediger
                            </Button>
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
                  Ingen helsepersonell funnet.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={selectedTab} index={5}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Systeminnstillinger
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Her kan du konfigurere systeminnstillinger, sikkerhet og integrasjoner.
            </Typography>
            <Button variant="contained" startIcon={<Settings />}>
              Konfigurer innstillinger
            </Button>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detaljer
          <IconButton
            onClick={() => setIsDetailsOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography>Detaljert informasjon om valgt element vil vises her.</Typography>
              <Box component="pre" sx={{ mt: 2, fontSize: '0.875rem', overflow: 'auto' }}>
                {JSON.stringify(selectedItem, null, 2)}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDetailsOpen(false)}>Lukk</Button>
          <Button variant="contained">Rediger</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminPage