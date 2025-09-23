import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SubscriptionSelector } from '../ui/SubscriptionSelector';
import { LocationSelector } from '../ui/LocationSelector';
import { LogoutButton } from '../auth/LogoutButton';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { Logo } from '../ui/Logo';
import { useSubscriptions } from '../../stores/authStore';
import { Container } from './Container';
import { Stack } from './Stack';

/**
 * Layout component that provides the main application structure
 * Contains header with subscription selector, breadcrumb navigation, and main content area
 */
export const Layout: React.FC = () => {
  const { selectedSubscription } = useSubscriptions();
  const location = useLocation();
  
  // Only allow changes on publishers page to avoid errors
  const isPublishersPage = location.pathname === '/publishers' || location.pathname === '/';
  const shouldDisableSelectors = !isPublishersPage;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <Container size="xl" padding="md">
          <Stack
            direction="vertical"
            spacing="md"
            className="py-4"
          >
            {/* Top header row */}
            <Stack
              direction="horizontal"
              justify="between"
              align="center"
              spacing="md"
              responsive={{
                sm: { direction: 'vertical', align: 'start', spacing: 'sm' },
                md: { direction: 'horizontal', align: 'center', spacing: 'md' }
              }}
            >
              <div className="flex items-center space-x-4">
                <Logo 
                  size="md" 
                  showText={true}
                  className="hidden sm:flex"
                />
                <Logo 
                  size="sm" 
                  showText={true}
                  className="flex sm:hidden"
                />
              </div>
              
              <Stack
                direction="horizontal"
                align="center"
                spacing="sm"
                className="w-full sm:w-auto"
                responsive={{
                  sm: { direction: 'vertical', spacing: 'sm' },
                  md: { direction: 'horizontal', spacing: 'md' }
                }}
              >
                <SubscriptionSelector 
                  className="w-full sm:min-w-64" 
                  disabled={shouldDisableSelectors}
                />
                <LocationSelector 
                  className="w-full sm:min-w-48" 
                  disabled={shouldDisableSelectors}
                />
                <LogoutButton />
              </Stack>
            </Stack>
            
            {/* Simple Navigation Info */}
            {selectedSubscription && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600">
                  Browse Azure VM marketplace images for your subscription
                </p>
              </div>
            )}
          </Stack>
        </Container>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Container size="xl" padding="md" className="py-6 sm:py-8">
          <ErrorBoundary>
            {selectedSubscription ? (
              <Outlet />
            ) : (
              <div className="text-center py-12 sm:py-16">
                <div className="text-gray-500 max-w-md mx-auto">
                  <svg
                    className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                    Select a Subscription
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 px-4">
                    Please select an Azure subscription from the dropdown above to browse VM images.
                  </p>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </Container>
      </main>
    </div>
  );
};