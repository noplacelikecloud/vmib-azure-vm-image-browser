import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { Layout } from '../components/layout/Layout';
import { PublishersPage } from '../pages/PublishersPage';
import { OffersPage } from '../pages/OffersPage';
import { SKUsPage } from '../pages/SKUsPage';

/**
 * Application routes configuration
 * Defines the routing structure for the Azure VM Marketplace Browser
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/publishers" replace />,
      },
      {
        path: 'publishers',
        element: <PublishersPage />,
      },
      {
        path: 'publishers/:publisherName/offers',
        element: <OffersPage />,
      },
      {
        path: 'publishers/:publisherName/offers/:offerName/skus',
        element: <SKUsPage />,
      },
      {
        // Catch-all route for invalid paths
        path: '*',
        element: <Navigate to="/publishers" replace />,
      },
    ],
  },
]);

export default router;