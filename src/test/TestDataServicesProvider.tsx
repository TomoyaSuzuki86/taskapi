import type { PropsWithChildren } from 'react';
import { DataServicesProvider } from '@/services/DataServicesProvider';
import type { DataServices } from '@/services/data-services';

type TestDataServicesProviderProps = PropsWithChildren<{
  value: DataServices;
}>;

export function TestDataServicesProvider({
  children,
  value,
}: TestDataServicesProviderProps) {
  return <DataServicesProvider value={value}>{children}</DataServicesProvider>;
}
