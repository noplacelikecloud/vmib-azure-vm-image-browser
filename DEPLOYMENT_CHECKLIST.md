# Deployment Checklist

Use this checklist to ensure your Azure VM Marketplace Browser is properly deployed.

## Pre-Deployment

- [ ] **Code is ready**
  - [ ] All features tested locally
  - [ ] Tests are passing (`npm run test:ci`)
  - [ ] Linting passes (`npm run lint`)
  - [ ] Type checking passes (`npm run type-check`)
  - [ ] Build succeeds (`npm run build`)

- [ ] **Azure AD App Registration**
  - [ ] App registration created in Azure AD
  - [ ] Client ID noted down
  - [ ] Redirect URIs configured for production domain
  - [ ] API permissions granted (Azure Service Management)

## Deployment Setup

- [ ] **Azure Static Web App**
  - [ ] Static Web App created in Azure Portal
  - [ ] Connected to GitHub repository
  - [ ] Deployment token copied

- [ ] **GitHub Secrets**
  - [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN` added
  - [ ] `VITE_AZURE_CLIENT_ID` added (Azure AD Client ID)
  - [ ] `VITE_REDIRECT_URI` added (production URL)
  - [ ] `VITE_POST_LOGOUT_REDIRECT_URI` added (production URL)
  - [ ] Environment check passes (`npm run check-env`)

- [ ] **Repository Files**
  - [ ] `.github/workflows/azure-static-web-apps-deploy.yml` exists
  - [ ] `public/staticwebapp.config.json` exists
  - [ ] `.env.example` created for team reference
  - [ ] `.gitignore` updated to exclude `.env` files

## Post-Deployment

- [ ] **Verify Deployment**
  - [ ] GitHub Action completed successfully
  - [ ] Application loads at production URL
  - [ ] Environment variables are working (check browser console)
  - [ ] Authentication works (login/logout)
  - [ ] All routes work correctly (no 404s)
  - [ ] API calls succeed (publishers, offers, SKUs load)

- [ ] **Test Functionality**
  - [ ] Can select subscription
  - [ ] Can select location
  - [ ] Publishers load correctly
  - [ ] Can navigate to offers
  - [ ] Can navigate to SKUs
  - [ ] Can copy IaC templates
  - [ ] Search functionality works
  - [ ] Pagination works

- [ ] **Security Check**
  - [ ] HTTPS is enforced
  - [ ] No sensitive data in client-side code
  - [ ] Authentication redirects work properly
  - [ ] Logout clears all user data

## Optional Enhancements

- [ ] **Custom Domain**
  - [ ] Custom domain configured in Azure
  - [ ] DNS records updated
  - [ ] SSL certificate active
  - [ ] Azure AD redirect URIs updated for custom domain

- [ ] **Monitoring**
  - [ ] Application Insights configured
  - [ ] Error tracking set up
  - [ ] Performance monitoring enabled

- [ ] **Performance**
  - [ ] Lighthouse audit score > 90
  - [ ] Bundle size optimized
  - [ ] Images optimized
  - [ ] Caching headers configured

## Troubleshooting

If deployment fails, check:

1. **GitHub Action Logs**
   - Build errors
   - Test failures
   - Environment variable issues

2. **Azure Portal**
   - Static Web App status
   - Deployment history
   - Configuration settings

3. **Browser Console**
   - Authentication errors
   - API call failures
   - JavaScript errors

4. **Network Tab**
   - Failed requests
   - CORS issues
   - Authentication token problems

## Rollback Plan

If issues occur after deployment:

1. **Immediate**: Revert to previous working commit
2. **GitHub**: Create hotfix branch and deploy
3. **Azure**: Use deployment history to rollback in portal

## Team Communication

- [ ] Deployment announced to team
- [ ] Production URL shared
- [ ] Known issues documented
- [ ] Support contacts identified