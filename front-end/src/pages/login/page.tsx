import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-50">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <div className="mobile-container min-h-screen flex flex-col">
        {/* Header decorative area */}
        <div className="relative bg-primary-500 rounded-b-[40px] px-6 pt-10 pb-14 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/20 rounded-full -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-secondary-500/20 rounded-full translate-y-1/3 -translate-x-1/3"></div>
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <i className="ri-fingerprint-line text-3xl text-white"></i>
            </div>
            <h1 className="text-2xl font-heading font-bold text-white mb-1">HRM App</h1>
            <p className="text-sm text-white/80">Quản lý chấm công thông minh</p>
          </div>
        </div>

        {/* Login form */}
        <div className="flex-1 px-6 -mt-6">
          <div className="bg-background-50 rounded-2xl p-6">
            <h2 className="text-lg font-heading font-semibold text-foreground-950 mb-1">Đăng nhập</h2>
            <p className="text-sm text-foreground-500 mb-5">Nhập thông tin tài khoản của bạn</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field */}
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-foreground-400">
                    <i className="ri-mail-line text-base"></i>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-background-100 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all duration-200 placeholder:text-foreground-300 text-foreground-950"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-foreground-400">
                    <i className="ri-lock-line text-base"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 text-sm bg-background-100 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all duration-200 placeholder:text-foreground-300 text-foreground-950"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-foreground-400 hover:text-foreground-600 cursor-pointer"
                  >
                    <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-base`}></i>
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <span className="w-5 h-5 flex items-center justify-center text-red-500 shrink-0">
                    <i className="ri-error-warning-line text-sm"></i>
                  </span>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white font-semibold text-sm rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <i className="ri-login-box-line text-base"></i>
                    Đăng nhập
                  </>
                )}
              </button>
            </form>

            {/* Demo accounts hint */}
            <div className="mt-5 pt-4 border-t border-background-200">
              <p className="text-xs text-foreground-400 text-center mb-2">Tài khoản demo</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { email: 'an.nguyen@company.vn', role: 'Nhân viên' },
                  { email: 'binh.tran@company.vn', role: 'Quản lý' },
                  { email: 'dung.pham@company.vn', role: 'HR' },
                  { email: 'em.hoang@company.vn', role: 'Kế toán' },
                ].map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => {
                      setEmail(demo.email);
                      setPassword('123456');
                    }}
                    className="text-left px-3 py-2 bg-background-100 hover:bg-primary-50 rounded-lg transition-colors duration-150 cursor-pointer"
                  >
                    <p className="text-xs font-medium text-foreground-700 truncate">{demo.email}</p>
                    <p className="text-[11px] text-foreground-400">{demo.role} / 123456</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}