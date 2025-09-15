# Azure Static Web Apps Deployment Script
# This script helps deploy the VaksineApp to Azure Static Web Apps

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$StaticWebAppName,
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "West Europe",
    
    [Parameter(Mandatory=$false)]
    [string]$GitHubRepo = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Branch = "main"
)

Write-Host "🚀 Deploying VaksineApp to Azure Static Web Apps..." -ForegroundColor Green

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

# Create resource group if it doesn't exist
Write-Host "📦 Creating resource group: $ResourceGroupName" -ForegroundColor Blue
az group create --name $ResourceGroupName --location $Location

# Create Static Web App
Write-Host "🌐 Creating Static Web App: $StaticWebAppName" -ForegroundColor Blue
if ($GitHubRepo) {
    # Create with GitHub integration
    az staticwebapp create `
        --name $StaticWebAppName `
        --resource-group $ResourceGroupName `
        --source $GitHubRepo `
        --branch $Branch `
        --location $Location `
        --app-location "/" `
        --api-location "api" `
        --output-location "dist"
} else {
    # Create without GitHub integration
    az staticwebapp create `
        --name $StaticWebAppName `
        --resource-group $ResourceGroupName `
        --location $Location
}

# Get Static Web App details
$swa = az staticwebapp show --name $StaticWebAppName --resource-group $ResourceGroupName | ConvertFrom-Json
$deploymentToken = az staticwebapp secrets list --name $StaticWebAppName --resource-group $ResourceGroupName | ConvertFrom-Json

Write-Host "✅ Static Web App created successfully!" -ForegroundColor Green
Write-Host "📍 URL: https://$($swa.defaultHostname)" -ForegroundColor Cyan
Write-Host "🔑 Deployment Token: $($deploymentToken.properties.apiKey)" -ForegroundColor Yellow

# Build the application
Write-Host "🔨 Building the application..." -ForegroundColor Blue
npm install
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed. Please check the errors above."
    exit 1
}

# Deploy using SWA CLI if available
if (Get-Command swa -ErrorAction SilentlyContinue) {
    Write-Host "🚀 Deploying using SWA CLI..." -ForegroundColor Blue
    swa deploy --deployment-token $deploymentToken.properties.apiKey
} else {
    Write-Host "⚠️  SWA CLI not found. Please install it with: npm install -g @azure/static-web-apps-cli" -ForegroundColor Yellow
    Write-Host "📋 Manual deployment steps:" -ForegroundColor Yellow
    Write-Host "1. Install SWA CLI: npm install -g @azure/static-web-apps-cli" -ForegroundColor White
    Write-Host "2. Deploy: swa deploy --deployment-token $($deploymentToken.properties.apiKey)" -ForegroundColor White
}

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Your app is available at: https://$($swa.defaultHostname)" -ForegroundColor Cyan
