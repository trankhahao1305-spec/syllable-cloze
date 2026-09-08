import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { isConfigured, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi đăng nhập bằng Google.');
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const action = isSignUp ? signUpWithEmail : signInWithEmail;
    const { error } = await action(email.trim(), password);

    setLoading(false);
    if (error) {
      setErrorMessage(error.message || 'Lỗi xác thực. Vui lòng kiểm tra lại email hoặc mật khẩu.');
    } else {
      if (isSignUp) {
        setSuccessMessage('Đăng ký thành công! Vui lòng kiểm tra hộp thư email để kích hoạt tài khoản.');
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
        {/* Nút Đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center mx-auto mb-3 text-base shadow-md shadow-indigo-100">
            SC
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {isSignUp ? 'Tạo tài khoản mới' : 'Đăng nhập SyllableCloze'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Đồng bộ tiến độ học FSRS và kho từ vựng đa thiết bị an toàn trên đám mây
          </p>
        </div>

        {/* Thông báo nếu chưa cấu hình Supabase */}
        {!isConfigured && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Chưa cấu hình Supabase:</span> Vui lòng bổ sung <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> và <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> trong file <code className="bg-amber-100 px-1 rounded">.env</code> để kích hoạt Cloud Auth.
            </div>
          </div>
        )}

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Thông báo thành công */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Nút đăng nhập Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || !isConfigured}
          className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 transition active:scale-98 shadow-2xs mb-4 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Tiếp tục với Google</span>
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">hoặc email</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Form Email / Password */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              placeholder="Địa chỉ email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              minLength={6}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isConfigured}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{isSignUp ? 'Đăng ký tài khoản' : 'Đăng nhập'}</span>}
          </button>
        </form>

        {/* Chuyển đổi Đăng nhập / Đăng ký */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
          >
            {isSignUp ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký miễn phí'}
          </button>
        </div>
      </div>
    </div>
  );
};
