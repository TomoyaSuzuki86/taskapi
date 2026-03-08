import { useContext } from 'react';
import { DataServicesContext } from '@/services/data-services-context';

export function useDataServices() {
  const value = useContext(DataServicesContext);

  if (!value) {
    throw new Error(
      'useDataServices must be used within DataServicesProvider.',
    );
  }

  return value;
}
