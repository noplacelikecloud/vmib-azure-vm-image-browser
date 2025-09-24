#!/usr/bin/env node

/**
 * Environment Variable Checker
 * Validates that all required environment variables are properly configured
 */

const requiredEnvVars = [
  'VITE_AZURE_CLIENT_ID',
  'VITE_REDIRECT_URI', 
  'VITE_POST_LOGOUT_REDIRECT_URI'
];

const optionalEnvVars = [
  'NODE_ENV',
  'MODE'
];

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...\n');
  
  let hasErrors = false;
  
  // Check required variables
  console.log('📋 Required Variables:');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    const displayValue = value ? (varName.includes('CLIENT_ID') ? `${value.substring(0, 8)}...` : value) : 'NOT SET';
    
    console.log(`  ${status} ${varName}: ${displayValue}`);
    
    if (!value) {
      hasErrors = true;
    }
  });
  
  // Check optional variables
  console.log('\n📋 Optional Variables:');
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '⚠️';
    const displayValue = value || 'NOT SET';
    
    console.log(`  ${status} ${varName}: ${displayValue}`);
  });
  
  // Validation
  console.log('\n🔍 Validation:');
  
  // Check if URLs are valid
  const redirectUri = process.env.VITE_REDIRECT_URI;
  const postLogoutUri = process.env.VITE_POST_LOGOUT_REDIRECT_URI;
  
  if (redirectUri) {
    try {
      new URL(redirectUri);
      console.log('  ✅ VITE_REDIRECT_URI is a valid URL');
    } catch {
      console.log('  ❌ VITE_REDIRECT_URI is not a valid URL');
      hasErrors = true;
    }
  }
  
  if (postLogoutUri) {
    try {
      new URL(postLogoutUri);
      console.log('  ✅ VITE_POST_LOGOUT_REDIRECT_URI is a valid URL');
    } catch {
      console.log('  ❌ VITE_POST_LOGOUT_REDIRECT_URI is not a valid URL');
      hasErrors = true;
    }
  }
  
  // Check if client ID looks like a GUID
  const clientId = process.env.VITE_AZURE_CLIENT_ID;
  if (clientId) {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (guidRegex.test(clientId)) {
      console.log('  ✅ VITE_AZURE_CLIENT_ID appears to be a valid GUID');
    } else {
      console.log('  ⚠️  VITE_AZURE_CLIENT_ID does not appear to be a valid GUID');
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  if (hasErrors) {
    console.log('  ❌ Configuration has errors - please fix the issues above');
    console.log('\n💡 Tips:');
    console.log('  - Copy .env.example to .env and fill in your values');
    console.log('  - Make sure your Azure AD App Registration is properly configured');
    console.log('  - Check that redirect URIs match your deployment URL');
    process.exit(1);
  } else {
    console.log('  ✅ All required environment variables are configured');
    console.log('  🚀 Ready for deployment!');
  }
}

// Run the check
checkEnvironmentVariables();