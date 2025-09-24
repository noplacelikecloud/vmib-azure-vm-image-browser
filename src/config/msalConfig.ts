import { PublicClientApplication } from '@azure/msal-browser';
import { env } from './environment';

// MSAL configuration for Multi-Tenant App
export const msalConfig = {
  auth: {
    clientId: env.azureClientId,
    authority: 'https://login.microsoftonline.com/common', // Multi-tenant
    redirectUri: env.redirectUri,
    postLogoutRedirectUri: env.postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage', // Use sessionStorage for better security
    storeAuthStateInCookie: false, // Set to true for IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // LogLevel.Error
            console.error(message);
            return;
          case 1: // LogLevel.Warning
            console.warn(message);
            return;
          case 2: // LogLevel.Info
            console.info(message);
            return;
          case 3: // LogLevel.Verbose
            console.debug(message);
            return;
        }
      },
    },
  },
};

// Scopes needed for Azure Resource Manager API access
export const loginRequest = {
  scopes: [
    'https://management.azure.com/user_impersonation', // Azure Resource Manager
    'openid',
    'profile',
    'email',
  ],
  prompt: 'select_account',
};

// Silent token request configuration
export const tokenRequest = {
  scopes: ['https://management.azure.com/user_impersonation'],
  forceRefresh: false,
};

// Graph API scopes (if needed for user info)
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphScopes: ['user.read'],
};

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);