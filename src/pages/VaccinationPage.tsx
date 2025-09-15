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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material'
import { 
  Add,
  Vaccines,
  CalendarToday,
  Person,
  Edit,
  Description,
  Close
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '../hooks/useAuth'
import { useUserRoles } from '../hooks/useUserRoles'
import { dataverseService } from '../services/dataverseService'
import { VaccinationRecord, VaccineType, Patient, VaccinationFormData } from '../types'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

const VaccinationPage: React.FC = () => {
  const { user } = useAuth()
  const { roles } = useUserRoles()
  const queryClient = useQueryClient()
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<VaccinationRecord | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [formData, setFormData] = useState<VaccinationFormData>({
    patientId: '',
    vaccineTypeId: '',
    vaccinationDate: '',
    lotNumber: '',
    dosage: 1,
    sideEffects: '',
    notes: '',
  })

  // Fetch vaccination records
  const { data: vaccinationRecords, isLoading: recordsLoading } = useQuery(
    'vaccinationRecords',
    () => dataverseService.getVaccinationRecords(),
    {
      enabled: roles.includes('HealthcareProvider') || roles.includes('Admin'),
    }
  )

  // Fetch vaccine types
  const { data: vaccineTypes } = useQuery(
    'vaccineTypes',
    () => dataverseService.getVaccineTypes()
  )

  // Fetch patients
  const { data: patients } = useQuery(
    'patients',
    () => dataverseService.getPatients()
  )

  // Create vaccination record mutation
  const createVaccinationMutation = useMutation(
    (data: VaccinationFormData) => dataverseService.createVaccinationRecord(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vaccinationRecords')
        setIsCreateOpen(false)
        setFormData({
          patientId: '',
          vaccineTypeId: '',
          vaccinationDate: '',
          lotNumber: '',
          dosage: 1,
          sideEffects: '',
          notes: '',
        })
      },
    }
  )

  const handleCreateVaccination = () => {
    createVaccinationMutation.mutate(formData)
  }

  const handleRecordSelect = (record: VaccinationRecord) => {
    setSelectedRecord(record)
    setIsDetailsOpen(true)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: nb })
    } catch {
      return dateString
    }
  }

  const getVaccineTypeName = (vaccineTypeId: string) => {
    const vaccineType = vaccineTypes?.find(vt => vt.sogv_vaksinetypeid === vaccineTypeId)
    return vaccineType?.sogv_vaksinenavn || 'Ukjent vaksine'
  }

  const getPatientName = (patientId: string) => {
    const patient = patients?.find(p => p.sogv_vaksineinnbyggerid === patientId)
    return patient ? `${patient.sogv_fornavn} ${patient.sogv_etternavn}` : 'Ukjent pasient'
  }

  const canManageVaccinations = roles.includes('HealthcareProvider') || roles.includes('Admin')

  if (!canManageVaccinations) {
    return (
      <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            Du har ikke tilgang til vaksinasjonsadministrasjon.
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Vaksinasjonsadministrasjon
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Registrer og administrer vaksinasjoner
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Button
            variant="contained"
            onClick={() => setIsCreateOpen(true)}
            startIcon={<Add />}
          >
            Registrer ny vaksinasjon
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Vaksinasjonsjournaler
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
                    <TableCell>Dosage</TableCell>
                    <TableCell>Handlinger</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vaccinationRecords.map((record) => (
                    <TableRow key={record.sogv_vaksineringid}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person />
                          {getPatientName(record.sogv_pasientid)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Vaccines />
                          {getVaccineTypeName(record.sogv_vaksinetypeid)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarToday />
                          {formatDate(record.sogv_vaksinasjonsdato)}
                        </Box>
                      </TableCell>
                      <TableCell>{record.sogv_lotnummer || 'Ikke oppgitt'}</TableCell>
                      <TableCell>{record.sogv_dosage}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            onClick={() => handleRecordSelect(record)}
                            startIcon={<Description />}
                          >
                            Vis detaljer
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
                Ingen vaksinasjonsjournaler funnet.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Vaccination Dialog */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Registrer ny vaksinasjon
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
              <FormControl fullWidth required>
                <InputLabel>Pasient</InputLabel>
                <Select
                  value={formData.patientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                  label="Pasient"
                >
                  {patients?.map((patient) => (
                    <MenuItem key={patient.sogv_vaksineinnbyggerid} value={patient.sogv_vaksineinnbyggerid}>
                      {patient.sogv_fornavn} {patient.sogv_etternavn} ({patient.sogv_personnummer})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Vaksinetype</InputLabel>
                <Select
                  value={formData.vaccineTypeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, vaccineTypeId: e.target.value }))}
                  label="Vaksinetype"
                >
                  {vaccineTypes?.map((vaccineType) => (
                    <MenuItem key={vaccineType.sogv_vaksinetypeid} value={vaccineType.sogv_vaksinetypeid}>
                      {vaccineType.sogv_vaksinenavn} - {vaccineType.sogv_sykdom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vaksinasjonsdato"
                type="datetime-local"
                value={formData.vaccinationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, vaccinationDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lot nummer"
                placeholder="Skriv lot nummer..."
                value={formData.lotNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, lotNumber: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dosage"
                type="number"
                placeholder="1"
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: parseInt(e.target.value) || 1 }))}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bivirkninger"
                multiline
                rows={3}
                placeholder="Beskriv eventuelle bivirkninger..."
                value={formData.sideEffects}
                onChange={(e) => setFormData(prev => ({ ...prev, sideEffects: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notater"
                multiline
                rows={3}
                placeholder="Legg til notater..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateOpen(false)}>Avbryt</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateVaccination}
            disabled={createVaccinationMutation.isLoading}
          >
            {createVaccinationMutation.isLoading ? 'Registrerer...' : 'Registrer vaksinasjon'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vaccination Details Dialog */}
      <Dialog open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Vaksinasjonsdetaljer
          <IconButton
            onClick={() => setIsDetailsOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Pasient:</Typography>
                <Typography>{getPatientName(selectedRecord.sogv_pasientid)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Vaksine:</Typography>
                <Typography>{getVaccineTypeName(selectedRecord.sogv_vaksinetypeid)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Dato:</Typography>
                <Typography>{formatDate(selectedRecord.sogv_vaksinasjonsdato)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Lot nummer:</Typography>
                <Typography>{selectedRecord.sogv_lotnummer || 'Ikke oppgitt'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Dosage:</Typography>
                <Typography>{selectedRecord.sogv_dosage}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Bivirkninger:</Typography>
                <Typography>{selectedRecord.sogv_bivirkninger || 'Ingen bivirkninger registrert'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Notater:</Typography>
                <Typography>{selectedRecord.sogv_notater || 'Ingen notater'}</Typography>
              </Grid>
            </Grid>
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

export default VaccinationPage