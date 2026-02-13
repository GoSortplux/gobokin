'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';
import PolicyModal from '@/components/PolicyModal';
import CustomLoader from '@/components/CustomLoader';
import Swal from '@/utils/sweetalert';
import { User } from '@/types';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPolicyAccepted, setIsPolicyAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (!isPolicyAccepted) {
      setError('You must accept the Privacy Policy to continue.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        ...formData,
        hasAcceptedLatestPolicies: true
      });

      const { accessToken, user } = response.data.data || response.data;

      await Swal.fire({
        icon: 'success',
        title: 'Registration Successful',
        text: 'Your account has been created. Redirecting to login...',
        confirmButtonColor: '#295FA7',
      });

      if (accessToken && user) {
        login(accessToken, user as User, '/auth/verify-email');
      } else {
        router.push('/auth/login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-900">Create an Account</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter Full Name"
              required
              className="w-full text-gray-600 px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter Email Address"
              required
              className="w-full text-gray-600 px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter Phone Number"
              required
              className="w-full text-gray-600 px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter Password"
                required
                className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary pr-10"
              />
              {formData.password && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                required
                className={`w-full text-gray-600 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary pr-10 ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
              />
              {formData.confirmPassword && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
            )}
          </div>
          <div className="flex items-start space-x-2">
            <div className="flex items-center h-5">
              <input
                id="policy"
                name="policy"
                type="checkbox"
                checked={isPolicyAccepted}
                onChange={(e) => setIsPolicyAccepted(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
            </div>
            <div className="text-sm">
              <label htmlFor="policy" className="font-medium text-gray-700">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(true)}
                  className="text-primary hover:underline font-bold"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isLoading || !isPolicyAccepted}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-h-[48px]"
          >
            {isLoading ? <CustomLoader size={24} /> : 'Register'}
          </button>
        </form>

        <PolicyModal
          isOpen={isPolicyModalOpen}
          type="general"
          skipUserUpdate={true}
          onAccept={() => {
            setIsPolicyAccepted(true);
            setIsPolicyModalOpen(false);
          }}
          onClose={() => setIsPolicyModalOpen(false)}
        />
        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:text-primary/90">
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
