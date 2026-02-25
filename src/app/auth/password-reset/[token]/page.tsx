'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import Swal from '@/utils/sweetalert';
import { Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const { token } = params;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await api.patch(`/auth/reset-password/${token}`, { password });
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Your password has been reset successfully.',
        confirmButtonColor: '#295FA7',
      });
      router.push('/auth/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side with background image */}
      <div
        className="hidden lg:block w-1/2 bg-cover bg-center"
        style={{ backgroundImage: "url(/venue_default.jpg)" }}
      >
      </div>

      {/* Right side with the form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900">Reset Password</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter New Password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  required
                  className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none transition-colors text-gray-900 ${
                    confirmPassword && password !== confirmPassword
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-primary focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={!password || !confirmPassword || password !== confirmPassword}
              className="w-full px-4 py-3 text-sm font-bold text-white bg-primary rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
