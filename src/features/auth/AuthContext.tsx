import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { getFirebaseConfigurationState } from '@/lib/firebase/config';
import {
  AuthContext,
  type AuthAction,
  type AuthContextValue,
  type AuthStatus,
} from '@/features/auth/auth-context';
import {
  ensureAuthPersistence,
  getAuthErrorMessage,
  resolveRedirectSignIn,
  signInWithGoogle,
  signOutFromGoogle,
  subscribeToAuthState,
} from '@/lib/firebase/auth';
import type { TaskapiUser } from '@/types/domain';

export function AuthProvider({ children }: PropsWithChildren) {
  const firebaseConfiguration = useMemo(
    () => getFirebaseConfigurationState(),
    [],
  );
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<TaskapiUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<AuthAction>(null);

  useEffect(() => {
    if (!firebaseConfiguration.isConfigured) {
      setStatus('error');
      setErrorMessage(
        `Firebase configuration is incomplete. Missing: ${firebaseConfiguration.missingKeys.join(', ')}`,
      );
      return;
    }

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        await ensureAuthPersistence();
        await resolveRedirectSignIn();

        const unsubscribe = subscribeToAuthState(
          (nextUser) => {
            if (!isMounted) {
              return;
            }

            setUser(nextUser);
            setStatus(nextUser ? 'authenticated' : 'unauthenticated');
            setErrorMessage(null);
            setActiveAction(null);
          },
          (error) => {
            if (!isMounted) {
              return;
            }

            setStatus('error');
            setErrorMessage(getAuthErrorMessage(error));
            setActiveAction(null);
          },
        );

        return unsubscribe;
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus('error');
        setErrorMessage(getAuthErrorMessage(error));
        setActiveAction(null);
      }
    };

    let unsubscribe: (() => void) | undefined;

    void initializeAuth().then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [firebaseConfiguration]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      errorMessage,
      activeAction,
      isFirebaseConfigured: firebaseConfiguration.isConfigured,
      signInWithGoogle: async () => {
        setActiveAction('sign_in');
        setErrorMessage(null);

        try {
          await signInWithGoogle();
        } catch (error) {
          setActiveAction(null);
          setStatus('unauthenticated');
          setErrorMessage(getAuthErrorMessage(error));
        }
      },
      signOut: async () => {
        setActiveAction('sign_out');
        setErrorMessage(null);

        try {
          await signOutFromGoogle();
          setUser(null);
          setStatus('unauthenticated');
          setActiveAction(null);
        } catch (error) {
          setActiveAction(null);
          setErrorMessage(getAuthErrorMessage(error));
        }
      },
      clearError: () => setErrorMessage(null),
    }),
    [
      activeAction,
      errorMessage,
      firebaseConfiguration.isConfigured,
      status,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
