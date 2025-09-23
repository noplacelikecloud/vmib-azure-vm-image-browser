import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../config/msalConfig';

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * LoginButton component that handles OAuth2 authentication flow
 * Uses MSAL popup flow for user authentication
 */
export const LoginButton: React.FC<LoginButtonProps> = ({ 
  className = '', 
  children = 'Sign In' 
}) => {
  const { instance } = useMsal();

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:bg-blue-700 ${className}`}
      type="button"
    >
      {children}
    </button>
  );
};