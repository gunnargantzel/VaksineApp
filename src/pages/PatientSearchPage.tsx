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
  Option
} from '@fluentui/react-components'
import { 
  SearchRegular,
  AddRegular,
  PersonRegular,
  PhoneRegular,
  MailRegular,
  CalendarRegular,
  DocumentRegular,
  EditRegular
} from '@fluentui/react-icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '../hooks/useAuth'
import { useUserRoles } from '../hooks/useUserRoles'
import { dataverseService } from '../services/dataverseService'
import { externalApiService } from '../services/externalApiService'
import { Patient, FolkeregisterPerson } from '../types'
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
  searchCard: {
    marginBottom: tokens.spacingVerticalL,
  },
  searchForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingVerticalM,
    alignItems: 'end',
  },
  resultsCard: {
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
  patientDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
})

const PatientSearchPage: React.FC = () => {
  const styles = useStyles()
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
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>
          Pasientoppslag
        </Text>
        <Text className={styles.subtitle}>
          Søk etter og administrer pasientdata
        </Text>
      </div>

      <Card className={styles.searchCard}>
        <CardHeader>
          <Text size={400} weight="semibold">
            Søk etter pasienter
          </Text>
        </CardHeader>
        <CardPreview>
          <div className={styles.searchForm}>
            <Field label="Søk etter navn eller personnummer">
              <Input
                placeholder="Skriv navn eller personnummer..."
                value={searchQuery}
                onChange={(_, data) => setSearchQuery(data.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Field>
            <Button
              appearance="primary"
              onClick={handleSearch}
              icon={<SearchRegular />}
              disabled={!searchQuery.trim()}
            >
              Søk i database
            </Button>
            <Button
              appearance="secondary"
              onClick={handleFolkeregisterSearch}
              icon={<SearchRegular />}
              disabled={!searchQuery.trim()}
            >
              Søk i folkeregister
            </Button>
          </div>
        </CardPreview>
      </Card>

      {canCreatePatient && (
        <Card className={styles.searchCard}>
          <CardPreview>
            <Button
              appearance="primary"
              onClick={() => setIsCreateOpen(true)}
              icon={<AddRegular />}
            >
              Registrer ny pasient
            </Button>
          </CardPreview>
        </Card>
      )}

      <Card className={styles.resultsCard}>
        <CardHeader>
          <Text size={400} weight="semibold">
            Søkeresultater
          </Text>
        </CardHeader>
        <CardPreview>
          {patientsLoading ? (
            <div className={styles.loadingContainer}>
              <Spinner size="large" label="Søker etter pasienter..." />
            </div>
          ) : patients && patients.length > 0 ? (
            <div className={styles.tableContainer}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Navn</TableHeaderCell>
                    <TableHeaderCell>Personnummer</TableHeaderCell>
                    <TableHeaderCell>Fødselsdato</TableHeaderCell>
                    <TableHeaderCell>Kontakt</TableHeaderCell>
                    <TableHeaderCell>Handlinger</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.sogv_vaksineinnbyggerid}>
                      <TableCell>
                        <div className={styles.detailItem}>
                          <PersonRegular />
                          {patient.sogv_fornavn} {patient.sogv_etternavn}
                        </div>
                      </TableCell>
                      <TableCell>{patient.sogv_personnummer}</TableCell>
                      <TableCell>{formatDate(patient.sogv_fodselsdato)}</TableCell>
                      <TableCell>
                        <div>
                          {patient.sogv_telefon && (
                            <div className={styles.detailItem}>
                              <PhoneRegular />
                              {patient.sogv_telefon}
                            </div>
                          )}
                          {patient.sogv_epost && (
                            <div className={styles.detailItem}>
                              <MailRegular />
                              {patient.sogv_epost}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={styles.actionButtons}>
                          <Button
                            size="small"
                            onClick={() => handlePatientSelect(patient)}
                            icon={<DocumentRegular />}
                          >
                            Vis detaljer
                          </Button>
                          {canEditPatient && (
                            <Button
                              size="small"
                              appearance="secondary"
                              icon={<EditRegular />}
                            >
                              Rediger
                            </Button>
                          )}
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
                Ingen pasienter funnet. Prøv et annet søk.
              </Text>
            </div>
          )}
        </CardPreview>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={(_, data) => setIsDetailsOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>
            Pasientdetaljer
          </DialogTitle>
          <DialogBody>
            {selectedPatient && (
              <div className={styles.patientDetails}>
                <div>
                  <Text weight="semibold">Navn:</Text>
                  <Text>{selectedPatient.sogv_fornavn} {selectedPatient.sogv_etternavn}</Text>
                </div>
                <div>
                  <Text weight="semibold">Personnummer:</Text>
                  <Text>{selectedPatient.sogv_personnummer}</Text>
                </div>
                <div>
                  <Text weight="semibold">Fødselsdato:</Text>
                  <Text>{formatDate(selectedPatient.sogv_fodselsdato)}</Text>
                </div>
                <div>
                  <Text weight="semibold">Telefon:</Text>
                  <Text>{selectedPatient.sogv_telefon || 'Ikke oppgitt'}</Text>
                </div>
                <div>
                  <Text weight="semibold">E-post:</Text>
                  <Text>{selectedPatient.sogv_epost || 'Ikke oppgitt'}</Text>
                </div>
                <div>
                  <Text weight="semibold">Adresse:</Text>
                  <Text>{selectedPatient.sogv_adresse || 'Ikke oppgitt'}</Text>
                </div>
              </div>
            )}
          </DialogBody>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Lukk</Button>
            </DialogTrigger>
            <Button appearance="primary">Se vaksinasjonsjournal</Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Create Patient Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(_, data) => setIsCreateOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>
            Registrer ny pasient
          </DialogTitle>
          <DialogBody>
            <div className={styles.patientDetails}>
              <Field label="Fornavn" required>
                <Input placeholder="Skriv fornavn..." />
              </Field>
              <Field label="Etternavn" required>
                <Input placeholder="Skriv etternavn..." />
              </Field>
              <Field label="Personnummer" required>
                <Input placeholder="DDMMÅÅÅÅÅÅÅ" />
              </Field>
              <Field label="Fødselsdato" required>
                <DatePicker placeholder="Velg fødselsdato..." />
              </Field>
              <Field label="Telefon">
                <Input placeholder="Skriv telefonnummer..." />
              </Field>
              <Field label="E-post">
                <Input placeholder="Skriv e-postadresse..." />
              </Field>
            </div>
          </DialogBody>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Avbryt</Button>
            </DialogTrigger>
            <Button appearance="primary">Registrer pasient</Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </div>
  )
}

export default PatientSearchPage
