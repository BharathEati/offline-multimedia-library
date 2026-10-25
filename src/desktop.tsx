import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppearanceProvider } from '@/components/tome/Appearance';
import { Library } from '@/components/tome/Library';
import '@/styles.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        <Library />
      </AppearanceProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
