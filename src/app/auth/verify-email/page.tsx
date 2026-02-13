'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import CustomLoader from '@/components/CustomLoader';
import Swal from '@/utils/sweetalert';

const VerifyEmailPage = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, token: jwtToken, user: currentUser } = useAuth();

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!verificationCode) {
      setError('Please enter the verification token.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/verify-email', {
        token: verificationCode,
        email: currentUser?.email
      });

      const { accessToken, user } = response.data.data || response.data || {};

      await Swal.fire({
        icon: 'success',
        title: 'Email Verified',
        text: 'Your email has been successfully verified. You are now signed in.',
        confirmButtonColor: '#2563eb',
      });

      if (accessToken && user) {
        login(accessToken, user);
      } else if (jwtToken && currentUser) {
        // If the API doesn't return a new token, use the existing one
        // and update the user state to reflect verification
        login(jwtToken, { ...currentUser, isVerified: true, isEmailVerified: true });
      } else {
        router.push('/auth/login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during verification.');
      setIsLoading(false);
    }
  };

  const [isResending, setIsResending] = useState(false);
  const handleResendToken = async () => {
    setError('');
    setIsResending(true);
    try {
      await api.post('/auth/resend-verify-email', {
        email: currentUser?.email
      });
      Swal.toast.fire({
        icon: 'success',
        title: 'Verification token resent successfully.',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while resending the token.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side with background image */}
      <div
        className="hidden lg:block w-1/2 bg-cover bg-center"
        style={{ backgroundImage: "url(/hall_default.jpg)" }}
      >
      </div>

      {/* Right side with the form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900">Verify Your Email</h2>
          <p className="text-center text-gray-600">
            A verification token has been sent to your email. Please enter it below.
          </p>
          <form className="space-y-6" onSubmit={handleVerifySubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Verification Token</label>
              <input
                type="text"
                name="token"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter Verification Token"
                required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            {error && <p className="text-sm text-center text-red-600">{error}</p>}
            <button
              type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-h-[48px]"
            >
            {isLoading ? <CustomLoader size={24} /> : 'Verify Email'}
            </button>
          </form>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn&apos;t receive the token?{' '}
              <button
                type="button"
                onClick={handleResendToken}
              className="font-medium text-primary hover:text-primary/90 disabled:opacity-50"
                disabled={isResending}
              >
                {isResending ? 'Resending...' : 'Resend Token'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
