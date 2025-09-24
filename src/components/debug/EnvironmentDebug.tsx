import React, { useState } from 'react';
import { env } from '../../config/environment';

/**
 * Environment Debug Component
 * Shows environment configuration in development mode
 * Helps debug environment variable issues
 */
export const EnvironmentDebug: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development mode
  if (!env.isDevelopment) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Toggle Environment Debug Info"
      >
        🔧 ENV
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Environment Debug</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-gray-700">Mode:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                env.isDevelopment ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {env.isDevelopment ? 'Development' : 'Production'}
              </span>
            </div>
            
            <div>
              <strong className="text-gray-700">Client ID:</strong>
              <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                {env.azureClientId ? 
                  `${env.azureClientId.substring(0, 8)}...${env.azureClientId.substring(env.azureClientId.length - 4)}` : 
                  '❌ Not configured'
                }
              </div>
            </div>
            
            <div>
              <strong className="text-gray-700">Redirect URI:</strong>
              <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                {env.redirectUri || '❌ Not configured'}
              </div>
            </div>
            
            <div>
              <strong className="text-gray-700">Post Logout URI:</strong>
              <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                {env.postLogoutRedirectUri || '❌ Not configured'}
              </div>
            </div>
            
            <div>
              <strong className="text-gray-700">Current Origin:</strong>
              <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                {window.location.origin}
              </div>
            </div>
            
            <div>
              <strong className="text-gray-700">Raw Environment:</strong>
              <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono max-h-32 overflow-auto">
                <pre>{JSON.stringify({
                  VITE_AZURE_CLIENT_ID: import.meta.env.VITE_AZURE_CLIENT_ID ? '***configured***' : undefined,
                  VITE_REDIRECT_URI: import.meta.env.VITE_REDIRECT_URI,
                  VITE_POST_LOGOUT_REDIRECT_URI: import.meta.env.VITE_POST_LOGOUT_REDIRECT_URI,
                  MODE: import.meta.env.MODE,
                  DEV: import.meta.env.DEV,
                  PROD: import.meta.env.PROD,
                }, null, 2)}</pre>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                💡 This debug panel only appears in development mode
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};