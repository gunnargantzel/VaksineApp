import React from 'react'
import { 
  makeStyles,
  tokens,
  Text,
  Card,
  CardHeader,
  CardPreview,
  Button,
  Spinner,
  Badge
} from '@fluentui/react-components'
import { 
  PeopleRegular,
  ShieldRegular,
  DocumentRegular,
  CalendarRegular,
  PersonRegular,
  CheckmarkCircleRegular,
  WarningRegular
} from '@fluentui/react-icons'
import { useQuery } from 'react-query'
import { useAuth } from '../hooks/useAuth'
import { useUserRoles } from '../hooks/useUserRoles'
import { dataverseService } from '../services/dataverseService'
import { useNavigate } from 'react-router-dom'

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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalXXL,
  },
  statCard: {
    padding: tokens.spacingVerticalL,
  },
  statIcon: {
    fontSize: tokens.fontSizeHero700,
    marginBottom: tokens.spacingVerticalM,
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
    marginBottom: tokens.spacingVerticalM,
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingVerticalL,
  },
  actionCard: {
    padding: tokens.spacingVerticalL,
  },
  actionButton: {
    width: '100%',
    marginTop: tokens.spacingVerticalM,
  },
  welcomeCard: {
    gridColumn: '1 / -1',
    marginBottom: tokens.spacingVerticalL,
  },
  roleBadge: {
    marginLeft: tokens.spacingHorizontalS,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
})

const DashboardPage: React.FC = () => {
  const styles = useStyles()
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'danger'
      case 'HealthcareProvider':
        return 'success'
      case 'Patient':
        return 'brand'
      default:
        return 'neutral'
    }
  }

  if (statsLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="large" label="Laster dashboard..." />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>
          Velkommen, {user?.givenName}!
        </Text>
        <Text className={styles.subtitle}>
          Oversikt over vaksinasjonsadministrasjon
        </Text>
        <div style={{ marginTop: tokens.spacingVerticalS }}>
          {roles.map((role) => (
            <Badge
              key={role}
              appearance="filled"
              color={getRoleColor(role)}
              className={styles.roleBadge}
            >
              {getRoleDisplayName(role)}
            </Badge>
          ))}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <CardPreview>
            <PeopleRegular className={styles.statIcon} style={{ color: tokens.colorBrandForeground1 }} />
            <Text className={styles.statNumber}>
              {stats?.totalPatients || 0}
            </Text>
            <Text className={styles.statLabel}>
              Registrerte pasienter
            </Text>
          </CardPreview>
        </Card>

        <Card className={styles.statCard}>
          <CardPreview>
            <ShieldRegular className={styles.statIcon} style={{ color: tokens.colorPaletteGreenForeground1 }} />
            <Text className={styles.statNumber}>
              {stats?.totalVaccinations || 0}
            </Text>
            <Text className={styles.statLabel}>
              Utførte vaksinasjoner
            </Text>
          </CardPreview>
        </Card>

        <Card className={styles.statCard}>
          <CardPreview>
            <CalendarRegular className={styles.statIcon} style={{ color: tokens.colorPaletteBlueForeground1 }} />
            <Text className={styles.statNumber}>
              {stats?.totalAppointments || 0}
            </Text>
            <Text className={styles.statLabel}>
              Planlagte avtaler
            </Text>
          </CardPreview>
        </Card>
      </div>

      <div className={styles.actionsGrid}>
        <Card className={styles.actionCard}>
          <CardHeader>
            <Text size={400} weight="semibold">
              Pasientadministrasjon
            </Text>
          </CardHeader>
          <CardPreview>
            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
              Søk etter pasienter, vis vaksinasjonshistorikk og administrer pasientdata
            </Text>
            <Button
              className={styles.actionButton}
              appearance="primary"
              onClick={() => navigate('/patients')}
              icon={<PeopleRegular />}
            >
              Gå til pasienter
            </Button>
          </CardPreview>
        </Card>

        {(roles.includes('HealthcareProvider') || roles.includes('Admin')) && (
          <Card className={styles.actionCard}>
            <CardHeader>
              <Text size={400} weight="semibold">
                Vaksinasjonsadministrasjon
              </Text>
            </CardHeader>
            <CardPreview>
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                Registrer nye vaksinasjoner, oppdater journaler og administrer vaksinasjonsdata
              </Text>
              <Button
                className={styles.actionButton}
                appearance="primary"
                onClick={() => navigate('/vaccination')}
                icon={<ShieldRegular />}
              >
                Gå til vaksinasjon
              </Button>
            </CardPreview>
          </Card>
        )}

        {roles.includes('Admin') && (
          <Card className={styles.actionCard}>
            <CardHeader>
              <Text size={400} weight="semibold">
                Systemadministrasjon
              </Text>
            </CardHeader>
            <CardPreview>
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                Administrer brukere, roller, systeminnstillinger og rapporter
              </Text>
              <Button
                className={styles.actionButton}
                appearance="primary"
                onClick={() => navigate('/admin')}
                icon={<PersonRegular />}
              >
                Gå til admin
              </Button>
            </CardPreview>
          </Card>
        )}

        {roles.includes('Patient') && (
          <Card className={styles.actionCard}>
            <CardHeader>
              <Text size={400} weight="semibold">
                Min vaksinasjonsjournal
              </Text>
            </CardHeader>
            <CardPreview>
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                Se din vaksinasjonshistorikk, kommende avtaler og vaksinasjonsstatus
              </Text>
              <Button
                className={styles.actionButton}
                appearance="primary"
                onClick={() => navigate('/patients')}
                icon={<DocumentRegular />}
              >
                Se min journal
              </Button>
            </CardPreview>
          </Card>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
