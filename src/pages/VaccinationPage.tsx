import React, { useState } from 'react'
import { 
  makeStyles,
  tokens,
  Text,
  Card,
  CardHeader,
  CardPreview,
  Button,
  Input,
  Spinner,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Field,
  DatePicker,
  Combobox,
  Option,
  Textarea
} from '@fluentui/react-components'
import { 
  AddRegular,
  ShieldRegular,
  CalendarRegular,
  PersonRegular,
  EditRegular,
  DeleteRegular,
  DocumentRegular
} from '@fluentui/react-icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '../hooks/useAuth'
import { useUserRoles } from '../hooks/useUserRoles'
import { dataverseService } from '../services/dataverseService'
import { VaccinationRecord, VaccineType, Patient, VaccinationFormData } from '../types'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

const useStyles = makeStyles({
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: tokens.spacingVerticalL,
  },
  header: {
    marginBottom: tokens.spacingVerticalXXL,
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalS,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  actionCard: {
    marginBottom: tokens.spacingVerticalL,
  },
  recordsCard: {
    marginBottom: tokens.spacingVerticalL,
  },
  tableContainer: {
    overflowX: 'auto',
  },
  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground2,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
  statusBadge: {
    '&.completed': {
      backgroundColor: tokens.colorPaletteGreenBackground2,
      color: tokens.colorPaletteGreenForeground2,
    },
    '&.pending': {
      backgroundColor: tokens.colorPaletteYellowBackground2,
      color: tokens.colorPaletteYellowForeground2,
    },
    '&.cancelled': {
      backgroundColor: tokens.colorPaletteRedBackground2,
      color: tokens.colorPaletteRedForeground2,
    },
  },
})

const VaccinationPage: React.FC = () => {
  const styles = useStyles()
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
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Text size={300}>
            Du har ikke tilgang til vaksinasjonsadministrasjon.
          </Text>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>
          Vaksinasjonsadministrasjon
        </Text>
        <Text className={styles.subtitle}>
          Registrer og administrer vaksinasjoner
        </Text>
      </div>

      <Card className={styles.actionCard}>
        <CardPreview>
          <Button
            appearance="primary"
            onClick={() => setIsCreateOpen(true)}
            icon={<AddRegular />}
          >
            Registrer ny vaksinasjon
          </Button>
        </CardPreview>
      </Card>

      <Card className={styles.recordsCard}>
        <CardHeader>
          <Text size={400} weight="semibold">
            Vaksinasjonsjournaler
          </Text>
        </CardHeader>
        <CardPreview>
          {recordsLoading ? (
            <div className={styles.loadingContainer}>
              <Spinner size="large" label="Laster vaksinasjonsjournaler..." />
            </div>
          ) : vaccinationRecords && vaccinationRecords.length > 0 ? (
            <div className={styles.tableContainer}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Pasient</TableHeaderCell>
                    <TableHeaderCell>Vaksine</TableHeaderCell>
                    <TableHeaderCell>Dato</TableHeaderCell>
                    <TableHeaderCell>Lot nummer</TableHeaderCell>
                    <TableHeaderCell>Dosage</TableHeaderCell>
                    <TableHeaderCell>Handlinger</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccinationRecords.map((record) => (
                    <TableRow key={record.sogv_vaksineringid}>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                          <PersonRegular />
                          {getPatientName(record.sogv_pasientid)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                          <ShieldRegular />
                          {getVaccineTypeName(record.sogv_vaksinetypeid)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                          <CalendarRegular />
                          {formatDate(record.sogv_vaksinasjonsdato)}
                        </div>
                      </TableCell>
                      <TableCell>{record.sogv_lotnummer || 'Ikke oppgitt'}</TableCell>
                      <TableCell>{record.sogv_dosage}</TableCell>
                      <TableCell>
                        <div className={styles.actionButtons}>
                          <Button
                            size="small"
                            onClick={() => handleRecordSelect(record)}
                            icon={<DocumentRegular />}
                          >
                            Vis detaljer
                          </Button>
                          <Button
                            size="small"
                            appearance="secondary"
                            icon={<EditRegular />}
                          >
                            Rediger
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Text size={300}>
                Ingen vaksinasjonsjournaler funnet.
              </Text>
            </div>
          )}
        </CardPreview>
      </Card>

      {/* Create Vaccination Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(_, data) => setIsCreateOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>
            Registrer ny vaksinasjon
          </DialogTitle>
          <DialogBody>
            <div className={styles.formGrid}>
              <Field label="Pasient" required>
                <Combobox
                  placeholder="Velg pasient..."
                  value={formData.patientId}
                  onOptionSelect={(_, data) => setFormData(prev => ({ ...prev, patientId: data.optionValue || '' }))}
                >
                  {patients?.map((patient) => (
                    <Option key={patient.sogv_vaksineinnbyggerid} value={patient.sogv_vaksineinnbyggerid}>
                      {patient.sogv_fornavn} {patient.sogv_etternavn} ({patient.sogv_personnummer})
                    </Option>
                  ))}
                </Combobox>
              </Field>

              <Field label="Vaksinetype" required>
                <Combobox
                  placeholder="Velg vaksinetype..."
                  value={formData.vaccineTypeId}
                  onOptionSelect={(_, data) => setFormData(prev => ({ ...prev, vaccineTypeId: data.optionValue || '' }))}
                >
                  {vaccineTypes?.map((vaccineType) => (
                    <Option key={vaccineType.sogv_vaksinetypeid} value={vaccineType.sogv_vaksinetypeid}>
                      {vaccineType.sogv_vaksinenavn} - {vaccineType.sogv_sykdom}
                    </Option>
                  ))}
                </Combobox>
              </Field>

              <Field label="Vaksinasjonsdato" required>
                <DatePicker
                  placeholder="Velg dato..."
                  value={formData.vaccinationDate ? new Date(formData.vaccinationDate) : undefined}
                  onSelectDate={(date) => setFormData(prev => ({ 
                    ...prev, 
                    vaccinationDate: date ? date.toISOString() : '' 
                  }))}
                />
              </Field>

              <Field label="Lot nummer">
                <Input
                  placeholder="Skriv lot nummer..."
                  value={formData.lotNumber}
                  onChange={(_, data) => setFormData(prev => ({ ...prev, lotNumber: data.value }))}
                />
              </Field>

              <Field label="Dosage" required>
                <Input
                  type="number"
                  placeholder="1"
                  value={formData.dosage.toString()}
                  onChange={(_, data) => setFormData(prev => ({ ...prev, dosage: parseInt(data.value) || 1 }))}
                />
              </Field>

              <Field label="Bivirkninger">
                <Textarea
                  placeholder="Beskriv eventuelle bivirkninger..."
                  value={formData.sideEffects}
                  onChange={(_, data) => setFormData(prev => ({ ...prev, sideEffects: data.value }))}
                />
              </Field>

              <Field label="Notater">
                <Textarea
                  placeholder="Legg til notater..."
                  value={formData.notes}
                  onChange={(_, data) => setFormData(prev => ({ ...prev, notes: data.value }))}
                />
              </Field>
            </div>
          </DialogBody>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Avbryt</Button>
            </DialogTrigger>
            <Button 
              appearance="primary" 
              onClick={handleCreateVaccination}
              disabled={createVaccinationMutation.isLoading}
            >
              {createVaccinationMutation.isLoading ? 'Registrerer...' : 'Registrer vaksinasjon'}
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Vaccination Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={(_, data) => setIsDetailsOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>
            Vaksinasjonsdetaljer
          </DialogTitle>
          <DialogBody>
            {selectedRecord && (
              <div className={styles.formGrid}>
                <div>
                  <Text weight="semibold">Pasient:</Text>
                  <Text>{getPatientName(selectedRecord.sogv_pasientid)}</Text>
                </div>
                <div>
                  <Text weight="semibold">Vaksine:</Text>
                  <Text>{getVaccineTypeName(selectedRecord.sogv_vaksinetypeid)}</Text>
                </div>
                <div>
                  <Text weight="semibold">Dato:</Text>
                  <Text>{formatDate(selectedRecord.sogv_vaksinasjonsdato)}</Text>
                </div>
                <div>
                  <Text weight="semibold">Lot nummer:</Text>
                  <Text>{selectedRecord.sogv_lotnummer || 'Ikke oppgitt'}</Text>
                </div>
                <div>
                  <Text weight="semibold">Dosage:</Text>
                  <Text>{selectedRecord.sogv_dosage}</Text>
                </div>
                <div>
                  <Text weight="semibold">Bivirkninger:</Text>
                  <Text>{selectedRecord.sogv_bivirkninger || 'Ingen bivirkninger registrert'}</Text>
                </div>
                <div>
                  <Text weight="semibold">Notater:</Text>
                  <Text>{selectedRecord.sogv_notater || 'Ingen notater'}</Text>
                </div>
              </div>
            )}
          </DialogBody>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Lukk</Button>
            </DialogTrigger>
            <Button appearance="primary">Rediger</Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </div>
  )
}

export default VaccinationPage
