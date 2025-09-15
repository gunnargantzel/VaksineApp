import React from 'react'
import { 
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Container,
  CircularProgress
} from '@mui/material'
import { 
  Home,
  People,
  Vaccines,
  Settings,
  Person,
  Logout
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { useAuth } from '../../hooks/useAuth'
import { useUserRoles } from '../../hooks/useUserRoles'
import { logout } from '../../services/authService'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { instance, accounts } = useMsal()
  const { user } = useAuth()
  const { roles, loading: rolesLoading } = useUserRoles()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
    setAnchorEl(null)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const isActiveRoute = (path: string) => {
    return location.pathname === path
  }

  if (rolesLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            VaksineApp
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
            <Button
              color="inherit"
              startIcon={<Home />}
              onClick={() => handleNavigation('/dashboard')}
              sx={{ 
                backgroundColor: isActiveRoute('/dashboard') ? 'rgba(255,255,255,0.1)' : 'transparent' 
              }}
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              startIcon={<People />}
              onClick={() => handleNavigation('/patients')}
              sx={{ 
                backgroundColor: isActiveRoute('/patients') ? 'rgba(255,255,255,0.1)' : 'transparent' 
              }}
            >
              Pasienter
            </Button>
            {(roles.includes('HealthcareProvider') || roles.includes('Admin')) && (
              <Button
                color="inherit"
                startIcon={<Vaccines />}
                onClick={() => handleNavigation('/vaccination')}
                sx={{ 
                  backgroundColor: isActiveRoute('/vaccination') ? 'rgba(255,255,255,0.1)' : 'transparent' 
                }}
              >
                Vaksinasjon
              </Button>
            )}
            {roles.includes('Admin') && (
              <Button
                color="inherit"
                startIcon={<Settings />}
                onClick={() => handleNavigation('/admin')}
                sx={{ 
                  backgroundColor: isActiveRoute('/admin') ? 'rgba(255,255,255,0.1)' : 'transparent' 
                }}
              >
                Admin
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              {user?.name}
            </Typography>
            <IconButton
              size="large"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.givenName?.[0]}{user?.surname?.[0]}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleMenuClose}>
                <Person sx={{ mr: 1 }} />
                Profil
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <Settings sx={{ mr: 1 }} />
                Innstillinger
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logg ut
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>

      <Box 
        component="footer" 
        sx={{ 
          py: 2, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: 'grey.100',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © 2024 VaksineApp - Moderne vaksinasjonsadministrasjon
        </Typography>
      </Box>
    </Box>
  )
}

export default Layout