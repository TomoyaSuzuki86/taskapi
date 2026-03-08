import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';
import { registerServiceWorker } from '@/lib/pwa/register-service-worker';
import { router } from '@/routes/router';
import { DataServicesProvider } from '@/services/DataServicesProvider';
import '@/styles/index.css';

registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <DataServicesProvider>
        <RouterProvider router={router} />
      </DataServicesProvider>
    </AuthProvider>
  </React.StrictMode>,
);
