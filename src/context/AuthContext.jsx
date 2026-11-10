import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { cognitoService, parseJwt } from '../services/cognitoService';
import { cognitoConfig } from '../config/cognitoConfig';

const AuthContext = createContext(null);
const SESSION_STORAGE_KEY = 'printworks_cognito_session';

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);

      // Verificar si el IdToken aún no ha expirado
      const claims = parseJwt(parsed.idToken);
      if (claims && claims.exp && claims.exp * 1000 > Date.now()) {
        return parsed;
      }
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    } catch (err) {
      console.error('Error restaurando sesión de Cognito:', err);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const result = await cognitoService.loginWithEmailAndPassword(email, password);
      setSession(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const signUp = useCallback(async (email, password) => {
    setLoading(true);
    try {
      return await cognitoService.signUp(email, password);
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmSignUp = useCallback(async (email, code, autoLoginPassword = null) => {
    setLoading(true);
    try {
      await cognitoService.confirmSignUp(email, code);
      if (autoLoginPassword) {
        // Auto-login tras confirmación exitosa
        const result = await cognitoService.loginWithEmailAndPassword(email, autoLoginPassword);
        setSession(result);
        return result;
      }
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendConfirmationCode = useCallback(async (email) => {
    return await cognitoService.resendConfirmationCode(email);
  }, []);

  const getAccessToken = useCallback(async () => {
    if (!session) return null;
    return session.accessToken || session.idToken;
  }, [session]);

  const user = useMemo(() => {
    if (!session?.user) return null;
    return {
      ...session.user,
      userPoolId: cognitoConfig.userPoolId,
    };
  }, [session]);

  const roles = useMemo(() => user?.roles || [], [user]);

  const hasRole = useCallback((roleName) => {
    return roles.includes(roleName);
  }, [roles]);

  const value = {
    isAuthenticated: !!user,
    user,
    roles,
    hasRole,
    login,
    logout,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    getAccessToken,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
