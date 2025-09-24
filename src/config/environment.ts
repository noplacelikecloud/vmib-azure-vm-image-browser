/**
 * Environment configuration for the Azure VM Marketplace Browser
 * Handles environment variables with proper fallbacks and validation
 */

interface EnvironmentConfig {
  azureClientId: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get environment variable with fallback and validation
 */
function getEnvVar(key: string, fallback?: string): string {
  const value = import.meta.env[key] || fallback;
  
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value;
}

/**
 * Detect if we're running in development mode
 */
function checkIsDevelopment(): boolean {
  return import.meta.env.MODE === 'development' || 
         import.meta.env.DEV === true ||
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

/**
 * Get the current origin for fallback URLs
 */
function getCurrentOrigin(): string {
  return window.location.origin;
}

/**
 * Create environment configuration with proper fallbacks
 */
function createEnvironmentConfig(): EnvironmentConfig {
  const isDevMode = checkIsDevelopment();
  const currentOrigin = getCurrentOrigin();
  
  // Development fallbacks
  const devClientId = 'your-dev-client-id-here';
  
  return {
    azureClientId: getEnvVar('VITE_AZURE_CLIENT_ID', isDevMode ? devClientId : undefined),
    redirectUri: getEnvVar('VITE_REDIRECT_URI', currentOrigin),
    postLogoutRedirectUri: getEnvVar('VITE_POST_LOGOUT_REDIRECT_URI', currentOrigin),
    isDevelopment: isDevMode,
    isProduction: !isDevMode,
  };
}

/**
 * Validate environment configuration
 */
function validateEnvironmentConfig(config: EnvironmentConfig): void {
  const errors: string[] = [];
  
  // Validate Azure Client ID
  if (!config.azureClientId || config.azureClientId === 'your-dev-client-id-here') {
    errors.push('VITE_AZURE_CLIENT_ID is not properly configured');
  }
  
  // Validate URLs
  try {
    new URL(config.redirectUri);
  } catch {
    errors.push('VITE_REDIRECT_URI is not a valid URL');
  }
  
  try {
    new URL(config.postLogoutRedirectUri);
  } catch {
    errors.push('VITE_POST_LOGOUT_REDIRECT_URI is not a valid URL');
  }
  
  if (errors.length > 0) {
    console.error('Environment configuration errors:', errors);
    
    if (config.isProduction) {
      throw new Error(`Environment configuration errors: ${errors.join(', ')}`);
    } else {
      console.warn('Development mode: Environment configuration errors will not block execution');
    }
  }
}

/**
 * Log environment configuration (without sensitive data)
 */
function logEnvironmentConfig(config: EnvironmentConfig): void {
  console.log('Environment Configuration:', {
    mode: config.isDevelopment ? 'development' : 'production',
    redirectUri: config.redirectUri,
    postLogoutRedirectUri: config.postLogoutRedirectUri,
    clientIdConfigured: !!config.azureClientId && config.azureClientId !== 'your-dev-client-id-here',
  });
}

// Create and validate configuration
let environmentConfig: EnvironmentConfig;

try {
  environmentConfig = createEnvironmentConfig();
  validateEnvironmentConfig(environmentConfig);
  logEnvironmentConfig(environmentConfig);
} catch (error) {
  console.error('Failed to initialize environment configuration:', error);
  
  // Fallback configuration for development
  environmentConfig = {
    azureClientId: 'fallback-client-id',
    redirectUri: getCurrentOrigin(),
    postLogoutRedirectUri: getCurrentOrigin(),
    isDevelopment: true,
    isProduction: false,
  };
  
  console.warn('Using fallback environment configuration');
}

export const env = environmentConfig;

// Export individual values for convenience
export const {
  azureClientId,
  redirectUri,
  postLogoutRedirectUri,
  isDevelopment,
  isProduction,
} = environmentConfig;