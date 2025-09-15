# VaksineApp - Modern Vaccine Management System

En moderne vaksinasjonsadministrasjonsløsning bygget med React, Azure Static Web Apps, Entra ID og DataVerse.

## 🚀 Funksjonalitet

- **Personoppslag**: Integrasjon med folkeregisteret og KRR
- **Vaksinasjonsadministrasjon**: Registrering og sporing av vaksinasjoner
- **Rollebasert tilgang**: Admin, Helsepersonell og Pasient-roller
- **SMS-notifikasjoner**: Automatiske påminnelser
- **COVID-19 integrasjon**: Henting av vaksinasjonsdata fra nasjonale registre
- **Moderne UI**: Responsivt design med Fluent UI

## 🏗️ Arkitektur

### Frontend
- **React 18** med TypeScript
- **Vite** for build og development
- **Fluent UI** for komponenter
- **React Query** for data management
- **MSAL React** for autentisering

### Backend & Integrasjoner
- **Azure Static Web Apps** for hosting
- **Entra ID** for autentisering og autorisasjon
- **DataVerse** som hoveddatabase
- **Azure API Management** for eksterne API-er

### Eksterne API-er
- **FiksFolkeregisteret**: Personopplysninger
- **KRR**: Kontaktinformasjon
- **Vaksinering API**: COVID-19 vaksinasjonsdata
- **Microsoft Graph**: Brukeradministrasjon

## 🛠️ Utviklingsmiljø

### Forutsetninger
- Node.js 18+
- npm eller yarn
- Azure CLI
- Git

### Installasjon

1. **Klon repositoriet**
```bash
git clone <repository-url>
cd VaksineApp
```

2. **Installer avhengigheter**
```bash
npm install
```

3. **Konfigurer miljøvariabler**
```bash
cp env.example .env.local
```

Rediger `.env.local` med dine verdier:
```env
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_DATAVERSE_URL_DEV=https://your-environment.crm4.dynamics.com
```

4. **Start utviklingsserver**
```bash
npm run dev
```

## 🔧 Konfigurasjon

### Azure AD App Registration

1. Opprett en app registration i Azure Portal
2. Konfigurer redirect URIs:
   - `http://localhost:3000` (development)
   - `https://your-app.azurestaticapps.net` (production)
3. Legg til API permissions:
   - Microsoft Graph: `User.Read`, `User.ReadBasic.All`, `GroupMember.Read.All`
4. Opprett client secret

### DataVerse Setup

1. Opprett DataVerse-miljø
2. Importer tabeller fra `dataverse/table-definitions/`
3. Konfigurer sikkerhetsroller
4. Opprett app registration for DataVerse

### Entra ID Sikkerhetsgrupper

Opprett følgende sikkerhetsgrupper:
- `VaksineApp-Admins`
- `VaksineApp-HealthcareProviders`
- `VaksineApp-Patients`

## 📁 Prosjektstruktur

```
src/
├── components/          # React komponenter
│   ├── Layout/         # Layout komponenter
│   ├── Forms/          # Skjema komponenter
│   ├── Tables/         # Tabell komponenter
│   └── UI/             # UI komponenter
├── pages/              # Side komponenter
├── hooks/              # Custom React hooks
├── services/           # API tjenester
├── types/              # TypeScript typer
├── utils/              # Hjelpefunksjoner
└── config/             # Konfigurasjon
```

## 🚀 Deployment

### Azure Static Web Apps

1. **Opprett Static Web App**
```bash
az staticwebapp create \
  --name vaksine-app \
  --resource-group your-rg \
  --source https://github.com/your-org/VaksineApp \
  --location "West Europe" \
  --branch main
```

2. **Konfigurer GitHub Actions**
- Legg til `AZURE_STATIC_WEB_APPS_API_TOKEN` som GitHub secret
- Push til main branch for automatisk deployment

3. **Konfigurer miljøvariabler**
Legg til følgende i Azure Portal:
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `DATAVERSE_URL`
- `ADMIN_GROUP_ID`
- `HEALTHCARE_PROVIDER_GROUP_ID`
- `PATIENT_GROUP_ID`

### DataVerse Deployment

1. **Eksporter løsning**
```bash
pac solution export --name "VaksineApp-Core" --path "solution-export"
```

2. **Importer til produksjon**
```bash
pac solution import --path "solution-export/VaksineApp-Core.zip"
```

## 🔐 Sikkerhet

### Autentisering
- Entra ID med gruppemedlemskap
- JWT tokens for API-autentisering
- Session management

### Autorisation
- Rollbasert tilgangskontroll
- Row-level security i DataVerse
- API endpoint beskyttelse

### Personvern
- GDPR compliance
- Data minimering
- Sikker håndtering av personnummer

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📊 Monitoring

- **Application Insights**: Ytelse og feil
- **Azure Monitor**: Infrastruktur
- **DataVerse Analytics**: Data operasjoner

## 🤝 Bidrag

1. Fork repositoriet
2. Opprett feature branch
3. Commit endringer
4. Push til branch
5. Opprett Pull Request

## 📄 Lisens

MIT License - se [LICENSE](LICENSE) fil for detaljer.

## 🆘 Support

- **Dokumentasjon**: [docs/](docs/)
- **Issues**: GitHub Issues
- **Email**: support@vaksineapp.no

## 🔄 Changelog

### v1.0.0
- Første release
- Grunnleggende vaksinasjonsadministrasjon
- Entra ID integrasjon
- DataVerse backend
- Responsivt UI

## 🗺️ Roadmap

- [ ] Offline støtte
- [ ] Mobile app
- [ ] Avanserte rapporter
- [ ] AI-drevet innsikter
- [ ] Flerspråklig støtte