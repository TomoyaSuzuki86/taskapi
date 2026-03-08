import type { PropsWithChildren } from 'react';
import { DataServicesContext } from '@/services/data-services-context';
import {
  createFirestoreDataServices,
  type DataServices,
} from '@/services/data-services';

const defaultDataServices = createFirestoreDataServices();

type DataServicesProviderProps = PropsWithChildren<{
  value?: DataServices;
}>;

export function DataServicesProvider({
  children,
  value = defaultDataServices,
}: DataServicesProviderProps) {
  return (
    <DataServicesContext.Provider value={value}>
      {children}
    </DataServicesContext.Provider>
  );
}
