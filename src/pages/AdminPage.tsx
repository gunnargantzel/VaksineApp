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
  Tabs,
  Tab,
  TabList,
  TabValue
} from '@fluentui/react-components'
import { 
  PeopleRegular,
  ShieldRegular,
  SettingsRegular,
  AddRegular,
  EditRegular,
  DeleteRegular,
  DocumentRegular,
  PersonRegular,
  CalendarRegular
} from '@fluentui/react-icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '../hooks/useAuth'
import { useUserRoles } from '../hooks/useUserRoles'
import { dataverseService } from '../services/dataverseService'
import { Patient, VaccinationRecord, VaccineType, HealthcareProvider } from '../types'
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
  tabsContainer: {
    marginBottom: tokens.spacingVerticalL,
  },
  tabContent: {
    marginTop: tokens.spacingVerticalL,
  },
  actionCard: {
    marginBottom: tokens.spacingVerticalL,
  },
  dataCard: {
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL,
  },
  statCard: {
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
  },
  statNumber: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXS,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
})

const AdminPage: React.FC = () => {
  const styles = useStyles()
  const { user } = useAuth()
  const { roles } = useUserRoles()
  const queryClient = useQueryClient()
  
  const [selectedTab, setSelectedTab] = useState<TabValue>('overview')
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
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Text size={300}>
            Du har ikke tilgang til administrasjon.
          </Text>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>
          Systemadministrasjon
        </Text>
        <Text className={styles.subtitle}>
          Administrer brukere, data og systeminnstillinger
        </Text>
      </div>

      <div className={styles.tabsContainer}>
        <Tabs value={selectedTab} onValueChange={(_, data) => setSelectedTab(data.value)}>
          <TabList>
            <Tab value="overview">Oversikt</Tab>
            <Tab value="patients">Pasienter</Tab>
            <Tab value="vaccinations">Vaksinasjoner</Tab>
            <Tab value="vaccines">Vaksinetyper</Tab>
            <Tab value="providers">Helsepersonell</Tab>
            <Tab value="settings">Innstillinger</Tab>
          </TabList>
        </Tabs>
      </div>

      <div className={styles.tabContent}>
        {selectedTab === 'overview' && (
          <>
            <div className={styles.statsGrid}>
              <Card className={styles.statCard}>
                <CardPreview>
                  <Text className={styles.statNumber}>
                    {patients?.length || 0}
                  </Text>
                  <Text className={styles.statLabel}>
                    Registrerte pasienter
                  </Text>
                </CardPreview>
              </Card>

              <Card className={styles.statCard}>
                <CardPreview>
                  <Text className={styles.statNumber}>
                    {vaccinationRecords?.length || 0}
                  </Text>
                  <Text className={styles.statLabel}>
                    Utførte vaksinasjoner
                  </Text>
                </CardPreview>
              </Card>

              <Card className={styles.statCard}>
                <CardPreview>
                  <Text className={styles.statNumber}>
                    {vaccineTypes?.length || 0}
                  </Text>
                  <Text className={styles.statLabel}>
                    Tilgjengelige vaksinetyper
                  </Text>
                </CardPreview>
              </Card>

              <Card className={styles.statCard}>
                <CardPreview>
                  <Text className={styles.statNumber}>
                    {healthcareProviders?.length || 0}
                  </Text>
                  <Text className={styles.statLabel}>
                    Registrerte helsepersonell
                  </Text>
                </CardPreview>
              </Card>
            </div>

            <Card className={styles.dataCard}>
              <CardHeader>
                <Text size={400} weight="semibold">
                  Siste aktivitet
                </Text>
              </CardHeader>
              <CardPreview>
                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                  Her vil du se siste systemaktivitet og viktige hendelser.
                </Text>
              </CardPreview>
            </Card>
          </>
        )}

        {selectedTab === 'patients' && (
          <Card className={styles.dataCard}>
            <CardHeader>
              <Text size={400} weight="semibold">
                Pasientadministrasjon
              </Text>
            </CardHeader>
            <CardPreview>
              {patientsLoading ? (
                <div className={styles.loadingContainer}>
                  <Spinner size="large" label="Laster pasienter..." />
                </div>
              ) : patients && patients.length > 0 ? (
                <div className={styles.tableContainer}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Navn</TableHeaderCell>
                        <TableHeaderCell>Personnummer</TableHeaderCell>
                        <TableHeaderCell>Fødselsdato</TableHeaderCell>
                        <TableHeaderCell>Registrert</TableHeaderCell>
                        <TableHeaderCell>Handlinger</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.map((patient) => (
                        <TableRow key={patient.sogv_vaksineinnbyggerid}>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                              <PersonRegular />
                              {patient.sogv_fornavn} {patient.sogv_etternavn}
                            </div>
                          </TableCell>
                          <TableCell>{patient.sogv_personnummer}</TableCell>
                          <TableCell>{formatDate(patient.sogv_fodselsdato)}</TableCell>
                          <TableCell>{formatDate(patient.sogv_createdon)}</TableCell>
                          <TableCell>
                            <div className={styles.actionButtons}>
                              <Button
                                size="small"
                                onClick={() => handleItemSelect(patient)}
                                icon={<DocumentRegular />}
                              >
                                Vis
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
                    Ingen pasienter funnet.
                  </Text>
                </div>
              )}
            </CardPreview>
          </Card>
        )}

        {selectedTab === 'vaccinations' && (
          <Card className={styles.dataCard}>
            <CardHeader>
              <Text size={400} weight="semibold">
                Vaksinasjonsadministrasjon
              </Text>
            </CardHeader>
            <CardPreview>
              {recordsLoading ? (
                <div className={styles.loadingContainer}>
                  <Spinner size="large" label="Laster vaksinasjoner..." />
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
                        <TableHeaderCell>Handlinger</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vaccinationRecords.map((record) => (
                        <TableRow key={record.sogv_vaksineringid}>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                              <PersonRegular />
                              {record.sogv_pasientid}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                              <ShieldRegular />
                              {record.sogv_vaksinetypeid}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                              <CalendarRegular />
                              {formatDate(record.sogv_vaksinasjonsdato)}
                            </div>
                          </TableCell>
                          <TableCell>{record.sogv_lotnummer || 'Ikke oppgitt'}</TableCell>
                          <TableCell>
                            <div className={styles.actionButtons}>
                              <Button
                                size="small"
                                onClick={() => handleItemSelect(record)}
                                icon={<DocumentRegular />}
                              >
                                Vis
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
                    Ingen vaksinasjoner funnet.
                  </Text>
                </div>
              )}
            </CardPreview>
          </Card>
        )}

        {selectedTab === 'vaccines' && (
          <Card className={styles.dataCard}>
            <CardHeader>
              <Text size={400} weight="semibold">
                Vaksinetyper
              </Text>
            </CardHeader>
            <CardPreview>
              {vaccineTypesLoading ? (
                <div className={styles.loadingContainer}>
                  <Spinner size="large" label="Laster vaksinetyper..." />
                </div>
              ) : vaccineTypes && vaccineTypes.length > 0 ? (
                <div className={styles.tableContainer}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Navn</TableHeaderCell>
                        <TableHeaderCell>Produsent</TableHeaderCell>
                        <TableHeaderCell>Sykdom</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Handlinger</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vaccineTypes.map((vaccineType) => (
                        <TableRow key={vaccineType.sogv_vaksinetypeid}>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                              <ShieldRegular />
                              {vaccineType.sogv_vaksinenavn}
                            </div>
                          </TableCell>
                          <TableCell>{vaccineType.sogv_produsent}</TableCell>
                          <TableCell>{vaccineType.sogv_sykdom}</TableCell>
                          <TableCell>
                            <Badge
                              appearance="filled"
                              color={vaccineType.sogv_aktiv ? 'success' : 'neutral'}
                            >
                              {vaccineType.sogv_aktiv ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className={styles.actionButtons}>
                              <Button
                                size="small"
                                onClick={() => handleItemSelect(vaccineType)}
                                icon={<DocumentRegular />}
                              >
                                Vis
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
                    Ingen vaksinetyper funnet.
                  </Text>
                </div>
              )}
            </CardPreview>
          </Card>
        )}

        {selectedTab === 'providers' && (
          <Card className={styles.dataCard}>
            <CardHeader>
              <Text size={400} weight="semibold">
                Helsepersonell
              </Text>
            </CardHeader>
            <CardPreview>
              {providersLoading ? (
                <div className={styles.loadingContainer}>
                  <Spinner size="large" label="Laster helsepersonell..." />
                </div>
              ) : healthcareProviders && healthcareProviders.length > 0 ? (
                <div className={styles.tableContainer}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Navn</TableHeaderCell>
                        <TableHeaderCell>Type</TableHeaderCell>
                        <TableHeaderCell>Autorisasjon</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Handlinger</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {healthcareProviders.map((provider) => (
                        <TableRow key={provider.sogv_helsepersonellid}>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                              <PersonRegular />
                              {provider.sogv_navn}
                            </div>
                          </TableCell>
                          <TableCell>{provider.sogv_type}</TableCell>
                          <TableCell>{provider.sogv_autorisasjonsnummer}</TableCell>
                          <TableCell>
                            <Badge
                              appearance="filled"
                              color={provider.sogv_aktiv ? 'success' : 'neutral'}
                            >
                              {provider.sogv_aktiv ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className={styles.actionButtons}>
                              <Button
                                size="small"
                                onClick={() => handleItemSelect(provider)}
                                icon={<DocumentRegular />}
                              >
                                Vis
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
                    Ingen helsepersonell funnet.
                  </Text>
                </div>
              )}
            </CardPreview>
          </Card>
        )}

        {selectedTab === 'settings' && (
          <Card className={styles.dataCard}>
            <CardHeader>
              <Text size={400} weight="semibold">
                Systeminnstillinger
              </Text>
            </CardHeader>
            <CardPreview>
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                Her kan du konfigurere systeminnstillinger, sikkerhet og integrasjoner.
              </Text>
              <div style={{ marginTop: tokens.spacingVerticalM }}>
                <Button appearance="primary" icon={<SettingsRegular />}>
                  Konfigurer innstillinger
                </Button>
              </div>
            </CardPreview>
          </Card>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={(_, data) => setIsDetailsOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>
            Detaljer
          </DialogTitle>
          <DialogBody>
            {selectedItem && (
              <div>
                <Text>Detaljert informasjon om valgt element vil vises her.</Text>
                <pre style={{ marginTop: tokens.spacingVerticalM, fontSize: tokens.fontSizeBase200 }}>
                  {JSON.stringify(selectedItem, null, 2)}
                </pre>
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

export default AdminPage
