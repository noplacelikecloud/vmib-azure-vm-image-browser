import { useEffect } from 'react';
import { useMsal, useAccount } from '@azure/msal-react';
import { EventType } from '@azure/msal-browser';
import { useAuthStore } from '../../stores/authStore';
import { useVMImagesStore } from '../../stores/vmImagesStore';

/**
 * AuthEventHandler component that listens to MSAL authentication events
 * and updates the auth store accordingly. Also handles tenant switching.
 */
export const AuthEventHandler: React.FC = () => {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const clearVMImagesData = useVMImagesStore((state) => state.clearAll);

  useEffect(() => {
    // Handle successful login
    const handleLoginSuccess = (message: any) => {
      if (message.eventType === EventType.LOGIN_SUCCESS && message.payload?.account) {
        const account = message.payload.account;
        const user = {
          id: account.homeAccountId,
          name: account.name || account.username,
          email: account.username,
          tenantId: account.tenantId,
        };
        
        console.log('Login success detected, updating auth store', user);
        
        // Get current user to check if this is a tenant switch
        const currentUser = useAuthStore.getState().user;
        const isDifferentTenant = currentUser && currentUser.tenantId !== user.tenantId;
        
        if (isDifferentTenant) {
          console.log('Tenant switch detected, clearing VM images cache');
          clearVMImagesData();
        }
        
        login(user);
      }
    };

    // Handle logout
    const handleLogout = (message: any) => {
      if (message.eventType === EventType.LOGOUT_SUCCESS) {
        console.log('Logout success detected, clearing auth store');
        logout();
        clearVMImagesData();
      }
    };

    // Handle account selection (when user switches accounts)
    const handleAccountSelection = (message: any) => {
      if (message.eventType === EventType.ACCOUNT_ADDED && message.payload?.account) {
        const account = message.payload.account;
        const user = {
          id: account.homeAccountId,
          name: account.name || account.username,
          email: account.username,
          tenantId: account.tenantId,
        };
        
        console.log('Account selection detected, updating auth store', user);
        
        // Get current user to check if this is a tenant switch
        const currentUser = useAuthStore.getState().user;
        const isDifferentTenant = currentUser && currentUser.tenantId !== user.tenantId;
        
        if (isDifferentTenant) {
          console.log('Tenant switch via account selection detected, clearing VM images cache');
          clearVMImagesData();
        }
        
        login(user);
      }
    };

    // Register event callbacks
    const loginCallbackId = instance.addEventCallback(handleLoginSuccess);
    const logoutCallbackId = instance.addEventCallback(handleLogout);
    const accountCallbackId = instance.addEventCallback(handleAccountSelection);

    // Handle initial authentication state if user is already logged in
    if (account) {
      const user = {
        id: account.homeAccountId,
        name: account.name || account.username,
        email: account.username,
        tenantId: account.tenantId,
      };
      
      console.log('Initial authentication state detected', user);
      login(user);
    }

    // Cleanup event callbacks on unmount
    return () => {
      if (loginCallbackId) {
        instance.removeEventCallback(loginCallbackId);
      }
      if (logoutCallbackId) {
        instance.removeEventCallback(logoutCallbackId);
      }
      if (accountCallbackId) {
        instance.removeEventCallback(accountCallbackId);
      }
    };
  }, [instance, account, login, logout, clearVMImagesData]);

  // This component doesn't render anything
  return null;
};