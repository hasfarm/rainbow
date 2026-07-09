import { createContext, useCallback, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  position: string;
  avatar: string | null;
  annualLeave: number;
  phone: string;
  joinDate: string | null;
}

interface LoginResponse {
  token: string;
  token_type: string;
  user: AuthUser;
  message?: string;
}

const AUTH_TOKEN_KEY = 'hrm_auth_token';
const AUTH_USER_KEY = 'hrm_user';
const API_PREFIX = '/back-end/public/api';

function toApiUrl(path: string): string {
  return `${window.location.origin}${API_PREFIX}${path}`;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false, message: '' }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreAuthState() {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_KEY);

      if (!token || !storedUser) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(toApiUrl('/auth/me'), {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const payload = (await response.json()) as { user?: AuthUser };

        if (isMounted && payload.user) {
          setUser(payload.user);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
        }
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void restoreAuthState();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(toApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as LoginResponse & { message?: string };

      if (!response.ok || !payload.token || !payload.user) {
        return {
          success: false,
          message: payload.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.',
        };
      }

      localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
      setUser(payload.user);

      return { success: true, message: payload.message ?? 'Đăng nhập thành công!' };
    } catch {
      return { success: false, message: 'Không thể kết nối đến máy chủ.' };
    }
  }, []);

  const logout = useCallback(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
      void fetch(toApiUrl('/auth/logout'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    }

    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}