import React from 'react';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../../config/msalConfig';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component that wraps the application with MSAL context
 * Provides authentication state and methods to all child components
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
};

export { msalInstance };