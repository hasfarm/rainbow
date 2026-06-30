import { createContext, useCallback, useState, useEffect } from 'react';
import { mockUsers, type User } from '@/mocks/users';

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('hrm_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      } catch {
        localStorage.removeItem('hrm_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    await new Promise((r) => setTimeout(r, 600));
    const found = mockUsers.find((u) => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userWithoutPassword } = found;
      const userData = { ...userWithoutPassword } as User;
      setUser(userData);
      localStorage.setItem('hrm_user', JSON.stringify(userData));
      return { success: true, message: 'Đăng nhập thành công!' };
    }
    return { success: false, message: 'Email hoặc mật khẩu không đúng' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('hrm_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}