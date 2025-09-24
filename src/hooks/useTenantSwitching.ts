import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useVMImagesStore } from '../stores/vmImagesStore';

/**
 * Hook that provides utilities for handling tenant switching
 * Ensures all tenant-specific data is cleared when switching between tenants
 */
export function useTenantSwitching() {
  const clearTenantData = useAuthStore((state) => state.clearTenantData);
  const clearVMImagesData = useVMImagesStore((state) => state.clearAll);

  const clearAllTenantData = useCallback(() => {
    // Clear auth store tenant data
    clearTenantData();
    
    // Clear VM images store data
    clearVMImagesData();
    
    console.log('Cleared all tenant-specific data for tenant switch');
  }, [clearTenantData, clearVMImagesData]);

  return {
    clearAllTenantData,
  };
}