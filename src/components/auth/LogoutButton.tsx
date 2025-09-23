import React from 'react';
import { useMsal } from '@azure/msal-react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { useVMImagesStore } from '../../stores/vmImagesStore';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * LogoutButton component that handles user logout and session cleanup
 * Uses MSAL logout functionality with proper session cleanup
 */
export const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = '', 
  children 
}) => {
  const { instance } = useMsal();
  const authLogout = useAuthStore((state) => state.logout);
  const navigationReset = useNavigationStore((state) => state.reset);
  const vmImagesReset = useVMImagesStore((state) => state.reset);

  const handleLogout = async () => {
    try {
      // Clear all Zustand stores first
      authLogout();
      navigationReset();
      vmImagesReset();
      
      // Then perform MSAL logout
      await instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
        mainWindowRedirectUri: window.location.origin,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: clear local session data and stores
      authLogout();
      navigationReset();
      vmImagesReset();
      instance.clearCache();
      window.location.reload();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`p-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 ${className}`}
      type="button"
      title="Sign out"
      aria-label="Sign out"
    >
      {children || (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      )}
    </button>
  );
};