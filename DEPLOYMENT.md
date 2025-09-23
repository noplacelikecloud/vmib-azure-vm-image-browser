# Deployment Guide

This guide explains how to deploy the Azure VM Marketplace Browser to Azure Static Web Apps using GitHub Actions.

## Prerequisites

1. **Azure Account**: You need an active Azure subscription
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Azure CLI** (optional): For manual setup

## Setup Instructions

### 1. Create Azure Static Web App

#### Option A: Using Azure Portal
1. Go to the [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → "Static Web App"
3. Fill in the basic information:
   - **Subscription**: Select your Azure subscription
   - **Resource Group**: Create new or select existing
   - **Name**: Choose a unique name (e.g., `vm-marketplace-browser`)
   - **Plan type**: Select "Free" for development or "Standard" for production
   - **Region**: Choose a region close to your users
4. In the "Deployment details" section:
   - **Source**: Select "GitHub"
   - **Organization**: Your GitHub username/organization
   - **Repository**: Select your repository
   - **Branch**: Select `main` or `master`
   - **Build Presets**: Select "React"
   - **App location**: `/` (root)
   - **Api location**: Leave empty
   - **Output location**: `dist`
5. Click "Review + create" then "Create"

#### Option B: Using Azure CLI
```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name rg-vm-marketplace-browser --location "East US"

# Create Static Web App
az staticwebapp create \
  --name vm-marketplace-browser \
  --resource-group rg-vm-marketplace-browser \
  --source https://github.com/YOUR_USERNAME/YOUR_REPO_NAME \
  --location "East US" \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github
```

### 2. Configure GitHub Secrets

After creating the Static Web App, you need to add secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

#### Required Secrets:
- **`AZURE_STATIC_WEB_APPS_API_TOKEN`**: 
  - Found in Azure Portal → Your Static Web App → Overview → "Manage deployment token"
  - Copy the deployment token and add it as a secret

#### Application Secrets:
- **`VITE_AZURE_CLIENT_ID`**: Your Azure AD App Registration Client ID
- **`VITE_REDIRECT_URI`**: Your Static Web App URL (e.g., `https://your-app.azurestaticapps.net`)
- **`VITE_POST_LOGOUT_REDIRECT_URI`**: Same as redirect URI

### 3. Azure AD App Registration Setup

1. Go to [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations**
2. Click "New registration"
3. Configure:
   - **Name**: `VM Marketplace Browser`
   - **Supported account types**: Select appropriate option (usually "Accounts in any organizational directory")
   - **Redirect URI**: 
     - Type: `Single-page application (SPA)`
     - URI: `https://your-static-web-app-url.azurestaticapps.net`
4. After creation, note the **Application (client) ID**
5. Go to **Authentication** and add additional redirect URIs if needed:
   - `http://localhost:5173` (for local development)
   - `https://your-custom-domain.com` (if using custom domain)
6. Under **API permissions**, ensure you have:
   - `Microsoft Graph` → `User.Read` (usually added by default)
   - Add `Azure Service Management` → `user_impersonation` if not present

### 4. Custom Domain (Optional)

To use a custom domain:

1. In Azure Portal, go to your Static Web App
2. Navigate to **Custom domains**
3. Click "Add" and follow the instructions
4. Update your Azure AD App Registration redirect URIs to include the custom domain

## Deployment Process

### Automatic Deployment
- The GitHub Action will automatically trigger on:
  - Push to `main`/`master` branch
  - Pull requests to `main`/`master` branch

### Manual Deployment
You can also trigger deployment manually:
1. Go to your GitHub repository
2. Navigate to **Actions**
3. Select the "Azure Static Web Apps CI/CD" workflow
4. Click "Run workflow"

## Environment Variables

The application uses the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_AZURE_CLIENT_ID` | Azure AD App Registration Client ID | `12345678-1234-1234-1234-123456789012` |
| `VITE_REDIRECT_URI` | Redirect URI after login | `https://your-app.azurestaticapps.net` |
| `VITE_POST_LOGOUT_REDIRECT_URI` | Redirect URI after logout | `https://your-app.azurestaticapps.net` |

## Monitoring and Troubleshooting

### View Deployment Logs
1. Go to GitHub repository → **Actions**
2. Click on the latest workflow run
3. Expand the "Build and Deploy" job to see detailed logs

### Azure Static Web App Logs
1. Go to Azure Portal → Your Static Web App
2. Navigate to **Functions** → **Application Insights** (if configured)

### Common Issues

1. **Build Failures**:
   - Check that all dependencies are listed in `package.json`
   - Ensure environment variables are properly set
   - Verify the build command works locally

2. **Authentication Issues**:
   - Verify Azure AD App Registration redirect URIs
   - Check that client ID is correct
   - Ensure the app registration has proper permissions

3. **Routing Issues**:
   - The `staticwebapp.config.json` file handles SPA routing
   - Ensure it's in the `public` folder

## Security Considerations

1. **Secrets Management**: Never commit secrets to your repository
2. **CORS**: Azure AD handles CORS for authentication
3. **HTTPS**: Azure Static Web Apps automatically provides HTTPS
4. **Content Security Policy**: Consider adding CSP headers in `staticwebapp.config.json`

## Cost Optimization

- **Free Tier**: Suitable for development and small applications
- **Standard Tier**: Required for custom domains and advanced features
- **Monitor Usage**: Check Azure Portal for bandwidth and storage usage

## Support

For issues related to:
- **Azure Static Web Apps**: [Azure Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- **GitHub Actions**: [GitHub Actions Documentation](https://docs.github.com/en/actions)
- **Azure AD Authentication**: [MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)