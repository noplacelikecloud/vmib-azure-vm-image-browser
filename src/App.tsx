import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { AuthProvider } from './components/auth/AuthProvider';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { NetworkStatus } from './components/ui/NetworkStatus';
import { EnvironmentDebug } from './components/debug/EnvironmentDebug';
import { msalInstance } from './config/msalConfig';
import { router } from './routes';
// import { PublishersPage } from './pages/PublishersPage'; // Unused

/**
 * Main App component that provides the application structure with all necessary providers
 * Integrates authentication, routing, error handling, and network status monitoring
 */
function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Network Status Indicator */}
            <NetworkStatus />
            
            {/* Main Application Router */}
            <RouterProvider router={router} />
            
            {/* Development Environment Debug Panel */}
            <EnvironmentDebug />
          </div>
        </AuthProvider>
      </MsalProvider>
    </ErrorBoundary>
  );
}

export default App;
