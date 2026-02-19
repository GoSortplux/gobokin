'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import CustomLoader from '@/components/CustomLoader';
import Swal from '@/utils/sweetalert';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      await Swal.fire({
        icon: 'success',
        title: 'Reset Link Sent',
        text: 'A password reset link has been sent to your email address.',
        confirmButtonColor: '#2563eb',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsLoading(false);
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
          <h2 className="text-2xl font-bold text-center text-gray-900">Forgot Password</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email Address"
                required
              className="w-full text-gray-600 px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-h-[48px]"
            >
            {isLoading ? <CustomLoader size={24} /> : 'Send Reset Link'}
            </button>
          </form>
          <p className="text-sm text-center text-gray-600">
            Remember your password?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:text-primary/90">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
