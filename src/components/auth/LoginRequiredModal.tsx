import React from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, X } from 'lucide-react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  onGuestCheckout?: () => void;
}

const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  isOpen,
  onClose,
  title = "Sign in required",
  message = "You need to sign in to save events to your bookmarks.",
  onGuestCheckout
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>

          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn size={32} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-6 space-y-3 bg-gray-50/50">
          <button
            onClick={() => {
              // Store current URL to redirect back after login if needed
              if (typeof window !== 'undefined') {
                localStorage.setItem('returnUrl', window.location.pathname + window.location.search);
              }
              router.push('/auth/login');
            }}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Sign In Now
          </button>

          <button
            onClick={() => {
              router.push('/auth/register');
            }}
            className="w-full bg-white border-2 border-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            Create an Account
          </button>

          {onGuestCheckout && (
            <button
              onClick={onGuestCheckout}
              className="w-full bg-secondary text-white font-bold py-4 rounded-xl shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              Continue as Guest
            </button>
          )}
        </div>

        <div className="p-4 text-center">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;
