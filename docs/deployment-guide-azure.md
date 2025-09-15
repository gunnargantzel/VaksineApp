# Azure Static Web Apps Deployment Guide

Denne guiden viser deg hvordan du deployer VaksineApp til Azure Static Web Apps med Entra ID og DataVerse.

## 🚀 Hurtigstart

### 1. Forutsetninger

- **Azure CLI** installert og konfigurert
- **Node.js 18+** installert
- **Power Platform** lisens for DataVerse
- **Entra ID** tenant med admin-rettigheter

### 2. Automatisk Setup

Kjør setup-scriptet for å opprette alle nødvendige Azure-ressurser:

```powershell
.\setup-azure.ps1 -ResourceGroupName "vaksine-app-rg" -Location "West Europe" -TenantId "your-tenant-id"
```

### 3. Manuell Setup

Hvis du foretrekker manuell setup, følg disse stegene:

#### Steg 1: Opprett Resource Group

```bash
az group create --name vaksine-app-rg --location "West Europe"
```

#### Steg 2: Opprett App Registration

```bash
# Opprett app registration
az ad app create --display-name "VaksineApp-WebApp" --web-redirect-uris "http://localhost:3000" "https://your-app.azurestaticapps.net"

# Opprett client secret
az ad app credential reset --id <app-id>

# Opprett service principal
az ad sp create --id <app-id>
```

#### Steg 3: Konfigurer API Permissions

```bash
# Legg til Microsoft Graph permissions
az ad app permission add --id <app-id> --api 00000003-0000-0000-c000-000000000000 --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope
az ad app permission add --id <app-id> --api 00000003-0000-0000-c000-000000000000 --api-permissions 5f8c59db-677d-491c-a38c-7bbf31590e69=Scope
az ad app permission add --id <app-id> --api 00000003-0000-0000-c000-000000000000 --api-permissions 06da0dbc-49e2-44d2-8312-53f166ab848a=Scope

# Gi admin consent
az ad app permission admin-consent --id <app-id>
```

#### Steg 4: Opprett Sikkerhetsgrupper

```bash
# Opprett sikkerhetsgrupper
az ad group create --display-name "VaksineApp-Admins" --mail-nickname "VaksineApp-Admins"
az ad group create --display-name "VaksineApp-HealthcareProviders" --mail-nickname "VaksineApp-HealthcareProviders"
az ad group create --display-name "VaksineApp-Patients" --mail-nickname "VaksineApp-Patients"
```

## 🔧 Konfigurasjon

### 1. Miljøvariabler

Opprett en `.env.local` fil med følgende innhold:

```env
# Azure AD Configuration
VITE_AZURE_CLIENT_ID=your-app-registration-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_REDIRECT_URI=http://localhost:3000
VITE_POST_LOGOUT_REDIRECT_URI=http://localhost:3000

# DataVerse Configuration
VITE_DATAVERSE_URL_DEV=https://your-dev-environment.crm4.dynamics.com
VITE_DATAVERSE_URL_PROD=https://your-prod-environment.crm4.dynamics.com

# Security Groups
VITE_ADMIN_AD_GROUP=your-admin-group-id
VITE_ANSATT_VAKSINE_AD_GROUP=your-healthcare-group-id
VITE_INNBYGGER_VAKSINE_AD_GROUP=your-patient-group-id

# External APIs
VITE_FIKS_FOLKEREGISTERET_URL=https://europe-002.azure-apim.net/apim/pasinfo-5ffiksfolkeregisteretv2-5f038f672301ae5d4b
VITE_VAKSINERING_API_URL=https://europe-002.azure-apim.net/apim/new-5fvaksinering-20-5f038f672301ae5d4b
VITE_KRR_API_URL=https://europe-002.azure-apim.net/apim/pasinfo-5fkontaktreservasjonv2-5f038f672301ae5d4b
```

### 2. DataVerse Setup

#### Opprett DataVerse Environment

1. Gå til [Power Platform Admin Center](https://admin.powerplatform.microsoft.com)
2. Velg "Environments" → "New"
3. Velg "Production" eller "Sandbox"
4. Gi miljøet navnet "VaksineApp-Production"

#### Importer Tabeller

1. Gå til [Power Apps Maker Portal](https://make.powerapps.com)
2. Velg ditt miljø
3. Gå til "Data" → "Tables"
4. Importer tabellene fra `dataverse/table-definitions/`

#### Konfigurer Sikkerhetsroller

1. Gå til "Settings" → "Security"
2. Opprett følgende roller:
   - **Patient**: Lesetilgang til egne data
   - **Healthcare Provider**: Les/skriv tilgang til pasientdata
   - **Admin**: Full tilgang til alle data

### 3. Static Web App Konfigurasjon

#### Opprett Static Web App

```bash
az staticwebapp create \
  --name vaksine-app \
  --resource-group vaksine-app-rg \
  --source https://github.com/your-org/VaksineApp \
  --branch main \
  --location "West Europe" \
  --app-location "/" \
  --api-location "api" \
  --output-location "dist"
```

#### Konfigurer Environment Variables

I Azure Portal, legg til følgende miljøvariabler:

- `AZURE_CLIENT_ID`: Din app registration ID
- `AZURE_CLIENT_SECRET`: Din client secret
- `DATAVERSE_URL`: Din DataVerse URL
- `ADMIN_GROUP_ID`: Admin gruppe ID
- `HEALTHCARE_PROVIDER_GROUP_ID`: Helsepersonell gruppe ID
- `PATIENT_GROUP_ID`: Pasient gruppe ID

## 🚀 Deployment

### 1. Automatisk Deployment

Hvis du har konfigurert GitHub integration:

```bash
# Push til main branch for automatisk deployment
git add .
git commit -m "Deploy to Azure"
git push origin main
```

### 2. Manuell Deployment

```bash
# Installer SWA CLI
npm install -g @azure/static-web-apps-cli

# Bygg applikasjonen
npm run build

# Deploy
swa deploy --deployment-token <your-deployment-token>
```

### 3. PowerShell Deployment

```powershell
.\deploy.ps1 -ResourceGroupName "vaksine-app-rg" -StaticWebAppName "vaksine-app"
```

## 🔐 Sikkerhet

### 1. Entra ID Konfigurasjon

- **Conditional Access**: Konfigurer policies for ekstra sikkerhet
- **MFA**: Aktiver multi-factor authentication
- **Risk-based policies**: Implementer risikobaserte policies

### 2. DataVerse Sikkerhet

- **Row-level security**: Implementer for dataisolasjon
- **Field-level security**: Beskytt sensitive felter
- **Audit logging**: Aktiver for compliance

### 3. Static Web App Sikkerhet

- **HTTPS**: Aktivert som standard
- **Security headers**: Konfigurert i `azure-static-web-apps-config.json`
- **Authentication**: Entra ID integration

## 📊 Monitoring

### 1. Application Insights

```bash
# Opprett Application Insights
az monitor app-insights component create \
  --app vaksine-app-insights \
  --location "West Europe" \
  --resource-group vaksine-app-rg
```

### 2. Log Analytics

- **Azure Monitor**: Overvåk infrastruktur
- **DataVerse Analytics**: Overvåk data operasjoner
- **Custom dashboards**: Lag tilpassede dashboards

## 🧪 Testing

### 1. Lokal Testing

```bash
# Start utviklingsserver
npm run dev

# Kjør tester
npm run test

# Type checking
npm run type-check
```

### 2. Staging Environment

```bash
# Deploy til staging
az staticwebapp create \
  --name vaksine-app-staging \
  --resource-group vaksine-app-rg \
  --location "West Europe"
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Workflow-filen er allerede konfigurert i `.github/workflows/azure-static-web-apps.yml`.

### Azure DevOps

```yaml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: |
    npm install
    npm run build
  displayName: 'Build application'

- task: AzureStaticWebApp@0
  inputs:
    app_location: '/'
    api_location: 'api'
    output_location: 'dist'
    azure_static_web_apps_api_token: $(AZURE_STATIC_WEB_APPS_API_TOKEN)
```

## 🆘 Feilsøking

### Vanlige Problemer

1. **Authentication feil**: Sjekk redirect URIs og client secret
2. **DataVerse tilkobling**: Verifiser URL og permissions
3. **Build feil**: Sjekk Node.js versjon og dependencies
4. **Deployment feil**: Verifiser deployment token

### Logging

```bash
# Se Static Web App logs
az staticwebapp logs show --name vaksine-app --resource-group vaksine-app-rg

# Se DataVerse logs
# Gå til Power Platform Admin Center → Environments → Your Environment → Logs
```

## 📚 Ytterligere Ressurser

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Entra ID Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [DataVerse Documentation](https://docs.microsoft.com/en-us/powerapps/maker/data-platform/)
- [Power Platform Admin Center](https://admin.powerplatform.microsoft.com/)

## 🎯 Neste Steg

1. **Performance Optimization**: Implementer caching og optimalisering
2. **Offline Support**: Legg til offline funksjonalitet
3. **Mobile App**: Utvikle companion mobile app
4. **Advanced Analytics**: Implementer AI-drevet innsikter
5. **Multi-tenant**: Støtte for flere organisasjoner
