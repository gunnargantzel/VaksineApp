import React, { useEffect } from 'react'
import { 
  makeStyles,
  tokens,
  Button,
  Text,
  Card,
  CardHeader,
  CardPreview,
  Image,
  Spinner
} from '@fluentui/react-components'
import { 
  ShieldRegular,
  PeopleRegular,
  DocumentRegular,
  CheckmarkCircleRegular
} from '@fluentui/react-icons'
import { useMsal } from '@azure/msal-react'
import { login } from '../services/authService'

const useStyles = makeStyles({
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
  },
  loginCard: {
    maxWidth: '500px',
    width: '100%',
    padding: tokens.spacingVerticalXXL,
  },
  header: {
    textAlign: 'center',
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
    marginBottom: tokens.spacingVerticalL,
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalXXL,
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
  },
  featureIcon: {
    color: tokens.colorBrandForeground1,
  },
  loginButton: {
    width: '100%',
    marginBottom: tokens.spacingVerticalM,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },
  errorMessage: {
    color: tokens.colorPaletteRedForeground1,
    textAlign: 'center',
    marginTop: tokens.spacingVerticalM,
  },
})

const LoginPage: React.FC = () => {
  const styles = useStyles()
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
      <div className={styles.loadingContainer}>
        <Spinner size="large" label="Logger inn..." />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Card className={styles.loginCard}>
        <CardHeader>
          <div className={styles.header}>
            <Text className={styles.title}>
              VaksineApp
            </Text>
            <Text className={styles.subtitle}>
              Moderne vaksinasjonsadministrasjon med Entra ID og DataVerse
            </Text>
          </div>
        </CardHeader>

        <CardPreview>
          <div className={styles.features}>
            <div className={styles.feature}>
              <ShieldRegular className={styles.featureIcon} />
              <Text>Sikker autentisering</Text>
            </div>
            <div className={styles.feature}>
              <PeopleRegular className={styles.featureIcon} />
              <Text>Pasientadministrasjon</Text>
            </div>
            <div className={styles.feature}>
              <DocumentRegular className={styles.featureIcon} />
              <Text>Vaksinasjonsjournaler</Text>
            </div>
            <div className={styles.feature}>
              <CheckmarkCircleRegular className={styles.featureIcon} />
              <Text>Integrasjon med nasjonale registre</Text>
            </div>
          </div>

          <Button
            className={styles.loginButton}
            appearance="primary"
            size="large"
            onClick={handleLogin}
            disabled={isLoading}
            icon={isLoading ? <Spinner size="tiny" /> : undefined}
          >
            {isLoading ? 'Logger inn...' : 'Logg inn med Entra ID'}
          </Button>

          {error && (
            <Text className={styles.errorMessage}>
              {error}
            </Text>
          )}

          <Text size={200} style={{ textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
            Logg inn med din organisasjonskonto for å få tilgang til systemet
          </Text>
        </CardPreview>
      </Card>
    </div>
  )
}

export default LoginPage
