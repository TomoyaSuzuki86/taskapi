import type { PropsWithChildren } from 'react';
import {
  AuthContext,
  type AuthContextValue,
} from '@/features/auth/auth-context';

type TestAuthProviderProps = PropsWithChildren<{
  value: AuthContextValue;
}>;

export function TestAuthProvider({ children, value }: TestAuthProviderProps) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
