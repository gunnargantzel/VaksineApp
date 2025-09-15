# Azure Setup Script for VaksineApp
# This script sets up the required Azure resources for the VaksineApp

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "West Europe",
    
    [Parameter(Mandatory=$true)]
    [string]$TenantId,
    
    [Parameter(Mandatory=$true)]
    [string]$AppName = "VaksineApp"
)

Write-Host "🔧 Setting up Azure resources for VaksineApp..." -ForegroundColor Green

# Check if Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if user is logged in
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Please log in to Azure CLI first:" -ForegroundColor Yellow
    az login
}

# Set the correct subscription if needed
Write-Host "📋 Current subscription: $($account.name)" -ForegroundColor Blue

# Create resource group
Write-Host "📦 Creating resource group: $ResourceGroupName" -ForegroundColor Blue
az group create --name $ResourceGroupName --location $Location

# Create App Registration for the web app
Write-Host "🔐 Creating App Registration..." -ForegroundColor Blue
$appRegistration = az ad app create --display-name "$AppName-WebApp" --web-redirect-uris "http://localhost:3000" "https://your-app.azurestaticapps.net" | ConvertFrom-Json

Write-Host "✅ App Registration created with ID: $($appRegistration.appId)" -ForegroundColor Green

# Create client secret
Write-Host "🔑 Creating client secret..." -ForegroundColor Blue
$secret = az ad app credential reset --id $appRegistration.appId | ConvertFrom-Json

Write-Host "✅ Client secret created: $($secret.password)" -ForegroundColor Green

# Create service principal
Write-Host "👤 Creating service principal..." -ForegroundColor Blue
az ad sp create --id $appRegistration.appId

# Grant API permissions
Write-Host "🔓 Granting API permissions..." -ForegroundColor Blue
az ad app permission add --id $appRegistration.appId --api 00000003-0000-0000-c000-000000000000 --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope
az ad app permission add --id $appRegistration.appId --api 00000003-0000-0000-c000-000000000000 --api-permissions 5f8c59db-677d-491c-a38c-7bbf31590e69=Scope
az ad app permission add --id $appRegistration.appId --api 00000003-0000-0000-c000-000000000000 --api-permissions 06da0dbc-49e2-44d2-8312-53f166ab848a=Scope

# Admin consent for permissions
Write-Host "✅ Granting admin consent..." -ForegroundColor Blue
az ad app permission admin-consent --id $appRegistration.appId

# Create security groups
Write-Host "👥 Creating security groups..." -ForegroundColor Blue

$adminGroup = az ad group create --display-name "$AppName-Admins" --mail-nickname "$AppName-Admins" | ConvertFrom-Json
$healthcareGroup = az ad group create --display-name "$AppName-HealthcareProviders" --mail-nickname "$AppName-HealthcareProviders" | ConvertFrom-Json
$patientGroup = az ad group create --display-name "$AppName-Patients" --mail-nickname "$AppName-Patients" | ConvertFrom-Json

Write-Host "✅ Security groups created:" -ForegroundColor Green
Write-Host "   Admin Group ID: $($adminGroup.id)" -ForegroundColor White
Write-Host "   Healthcare Provider Group ID: $($healthcareGroup.id)" -ForegroundColor White
Write-Host "   Patient Group ID: $($patientGroup.id)" -ForegroundColor White

# Create DataVerse environment (if you have the license)
Write-Host "💾 Setting up DataVerse environment..." -ForegroundColor Blue
Write-Host "⚠️  Note: DataVerse environment creation requires a Power Platform license" -ForegroundColor Yellow
Write-Host "   You can create it manually in the Power Platform Admin Center" -ForegroundColor Yellow

# Output configuration
Write-Host "`n📋 Configuration Summary:" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor White
Write-Host "Location: $Location" -ForegroundColor White
Write-Host "Tenant ID: $TenantId" -ForegroundColor White
Write-Host "App Registration ID: $($appRegistration.appId)" -ForegroundColor White
Write-Host "Client Secret: $($secret.password)" -ForegroundColor White
Write-Host "Admin Group ID: $($adminGroup.id)" -ForegroundColor White
Write-Host "Healthcare Provider Group ID: $($healthcareGroup.id)" -ForegroundColor White
Write-Host "Patient Group ID: $($patientGroup.id)" -ForegroundColor White

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Create a .env.local file with the configuration above" -ForegroundColor White
Write-Host "2. Set up DataVerse environment in Power Platform Admin Center" -ForegroundColor White
Write-Host "3. Import the DataVerse table definitions" -ForegroundColor White
Write-Host "4. Configure the Static Web App with these settings" -ForegroundColor White
Write-Host "5. Run 'npm run dev' to start development" -ForegroundColor White

Write-Host "`n🎉 Azure setup completed!" -ForegroundColor Green
