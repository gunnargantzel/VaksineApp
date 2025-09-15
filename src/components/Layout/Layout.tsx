import React from 'react'
import { 
  FluentProvider, 
  webLightTheme,
  makeStyles,
  tokens,
  Button,
  Avatar,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  Spinner
} from '@fluentui/react-components'
import { 
  PersonRegular,
  SignOutRegular,
  SettingsRegular,
  HomeRegular,
  PeopleRegular,
  ShieldRegular
} from '@fluentui/react-icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { useAuth } from '../../hooks/useAuth'
import { useUserRoles } from '../../hooks/useUserRoles'
import { logout } from '../../services/authService'

const useStyles = makeStyles({
  layout: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    boxShadow: tokens.shadow4,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  logo: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForegroundOnBrand,
    textDecoration: 'none',
  },
  navigation: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  navButton: {
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: 'transparent',
    border: 'none',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
    '&.active': {
      backgroundColor: tokens.colorBrandBackgroundPressed,
    },
  },
  main: {
    flex: 1,
    padding: tokens.spacingVerticalL,
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  footer: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
})

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const styles = useStyles()
  const navigate = useNavigate()
  const location = useLocation()
  const { instance } = useMsal()
  const { user } = useAuth()
  const { roles, loading: rolesLoading } = useUserRoles()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  const isActiveRoute = (path: string) => {
    return location.pathname === path
  }

  if (rolesLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="large" label="Laster brukerroller..." />
      </div>
    )
  }

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={styles.layout}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <a href="/" className={styles.logo}>
              VaksineApp
            </a>
            <nav className={styles.navigation}>
              <button
                className={`${styles.navButton} ${isActiveRoute('/dashboard') ? 'active' : ''}`}
                onClick={() => handleNavigation('/dashboard')}
              >
                <HomeRegular />
                Dashboard
              </button>
              <button
                className={`${styles.navButton} ${isActiveRoute('/patients') ? 'active' : ''}`}
                onClick={() => handleNavigation('/patients')}
              >
                <PeopleRegular />
                Pasienter
              </button>
              {(roles.includes('HealthcareProvider') || roles.includes('Admin')) && (
                <button
                  className={`${styles.navButton} ${isActiveRoute('/vaccination') ? 'active' : ''}`}
                  onClick={() => handleNavigation('/vaccination')}
                >
                  <ShieldRegular />
                  Vaksinasjon
                </button>
              )}
              {roles.includes('Admin') && (
                <button
                  className={`${styles.navButton} ${isActiveRoute('/admin') ? 'active' : ''}`}
                  onClick={() => handleNavigation('/admin')}
                >
                  <SettingsRegular />
                  Admin
                </button>
              )}
            </nav>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userMenu}>
              <Text>{user?.name}</Text>
              <Menu>
                <MenuTrigger disableButtonEnhancement>
                  <Avatar
                    name={user?.name}
                    size={32}
                    color="colorful"
                  />
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem icon={<PersonRegular />}>
                      Profil
                    </MenuItem>
                    <MenuItem icon={<SettingsRegular />}>
                      Innstillinger
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem icon={<SignOutRegular />} onClick={handleLogout}>
                      Logg ut
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          {children}
        </main>

        <footer className={styles.footer}>
          <Text size={200}>
            © 2024 VaksineApp - Moderne vaksinasjonsadministrasjon
          </Text>
        </footer>
      </div>
    </FluentProvider>
  )
}

export default Layout
