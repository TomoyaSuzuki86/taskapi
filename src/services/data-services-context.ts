import { createContext } from 'react';
import type { DataServices } from '@/services/data-services';

export const DataServicesContext = createContext<DataServices | null>(null);
