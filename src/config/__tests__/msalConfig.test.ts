import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock environment variables
const mockEnv = {
  VITE_AZURE_CLIENT_ID: 'test-client-id',
  VITE_REDIRECT_URI: 'http://localhost:3000',
  VITE_POST_LOGOUT_REDIRECT_URI: 'http://localhost:3000',
};

describe('MSAL Configuration', () => {
  beforeEach(() => {
    // Mock import.meta.env
    vi.stubGlobal('import.meta', {
      env: mockEnv,
    });
  });

  describe('msalConfig', () => {
    it('should have correct auth configuration for multi-tenant', async () => {
      const { msalConfig } = await import('../msalConfig');
      expect(msalConfig.auth.authority).toBe('https://login.microsoftonline.com/common');
      // Should use environment variable or fallback to default
      expect(msalConfig.auth.clientId).toBeDefined();
      expect(msalConfig.auth.redirectUri).toBeDefined();
      expect(msalConfig.auth.postLogoutRedirectUri).toBeDefined();
    });

    it('should use sessionStorage for cache location', async () => {
      const { msalConfig } = await import('../msalConfig');
      expect(msalConfig.cache?.cacheLocation).toBe('sessionStorage');
      expect(msalConfig.cache?.storeAuthStateInCookie).toBe(false);
    });

    it('should have logger configuration', async () => {
      const { msalConfig } = await import('../msalConfig');
      expect(msalConfig.system?.loggerOptions).toBeDefined();
      expect(typeof msalConfig.system?.loggerOptions?.loggerCallback).toBe('function');
    });

    it('should handle missing environment variables with defaults', async () => {
      vi.stubGlobal('import.meta', { env: {} });
      
      // Clear module cache and re-import
      vi.resetModules();
      const { msalConfig: freshConfig } = await import('../msalConfig');
      
      expect(freshConfig.auth.clientId).toBe('your-client-id-here');
    });
  });

  describe('loginRequest', () => {
    it('should include required scopes for Azure Resource Manager', async () => {
      const { loginRequest } = await import('../msalConfig');
      expect(loginRequest.scopes).toContain('https://management.azure.com/user_impersonation');
      expect(loginRequest.scopes).toContain('openid');
      expect(loginRequest.scopes).toContain('profile');
      expect(loginRequest.scopes).toContain('email');
    });

    it('should have select_account prompt', async () => {
      const { loginRequest } = await import('../msalConfig');
      expect(loginRequest.prompt).toBe('select_account');
    });
  });

  describe('tokenRequest', () => {
    it('should include Azure Resource Manager scope', async () => {
      const { tokenRequest } = await import('../msalConfig');
      expect(tokenRequest.scopes).toContain('https://management.azure.com/user_impersonation');
    });

    it('should not force refresh by default', async () => {
      const { tokenRequest } = await import('../msalConfig');
      expect(tokenRequest.forceRefresh).toBe(false);
    });
  });

  describe('graphConfig', () => {
    it('should have correct Graph API endpoint', async () => {
      const { graphConfig } = await import('../msalConfig');
      expect(graphConfig.graphMeEndpoint).toBe('https://graph.microsoft.com/v1.0/me');
    });

    it('should include user.read scope', async () => {
      const { graphConfig } = await import('../msalConfig');
      expect(graphConfig.graphScopes).toContain('user.read');
    });
  });

  describe('logger callback', () => {
    it('should handle different log levels correctly', async () => {
      const consoleSpy = {
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        info: vi.spyOn(console, 'info').mockImplementation(() => {}),
        debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      };

      const { msalConfig } = await import('../msalConfig');
      const loggerCallback = msalConfig.system?.loggerOptions?.loggerCallback;
      
      if (loggerCallback) {
        // Test different log levels
        loggerCallback(0, 'Error message', false); // Error
        loggerCallback(1, 'Warning message', false); // Warning
        loggerCallback(2, 'Info message', false); // Info
        loggerCallback(3, 'Debug message', false); // Verbose

        expect(consoleSpy.error).toHaveBeenCalledWith('Error message');
        expect(consoleSpy.warn).toHaveBeenCalledWith('Warning message');
        expect(consoleSpy.info).toHaveBeenCalledWith('Info message');
        expect(consoleSpy.debug).toHaveBeenCalledWith('Debug message');
      }

      // Cleanup
      Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });

    it('should not log messages containing PII', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { msalConfig } = await import('../msalConfig');
      const loggerCallback = msalConfig.system?.loggerOptions?.loggerCallback;
      
      if (loggerCallback) {
        loggerCallback(0, 'Message with PII', true);
        expect(consoleSpy).not.toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
    });
  });
});