import React from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import { LoginButton } from './LoginButton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute component that guards routes requiring authentication
 * Renders children if authenticated, otherwise shows login interface
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Azure VM Marketplace Browser
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please sign in to access your Azure subscriptions
            </p>
          </div>
          <div className="flex justify-center">
            {fallback || <LoginButton className="w-full" />}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};