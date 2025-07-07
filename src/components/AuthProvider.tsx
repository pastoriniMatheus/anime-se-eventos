
import React from 'react';
import { AuthContext, useAuthProvider } from '@/hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuthProvider();
  
  console.log('[AuthProvider] Renderizando com user:', auth.user?.username || 'null');
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
