'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';
import api from '@/services/api';
import RoleSelectionModal from '@/components/auth/RoleSelectionModal';
import { User } from '@/types';
import CustomLoader from '@/components/CustomLoader';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<{
    accessToken: string;
    user: {
      role: string[];
      activeRole?: string;
      fullName?: string;
      firstName?: string;
      lastName?: string;
      [key: string]: unknown;
    };
  } | null>(null);

  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const processLogin = (accessToken: string, user: {
    role: string[];
    activeRole?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    [key: string]: unknown;
  }, redirectPath?: string) => {
    const activeRole = user.activeRole || 'user';
    const userWithActiveRole = {
      ...user,
      activeRole,
    };

    if (userWithActiveRole && !userWithActiveRole.fullName && userWithActiveRole.firstName && userWithActiveRole.lastName) {
      userWithActiveRole.fullName = `${userWithActiveRole.firstName} ${userWithActiveRole.lastName}`;
    }

    // AuthContext login now handles the redirection using window.location.href
    login(accessToken, userWithActiveRole as unknown as User, redirectPath);
  };

  const handleRoleSelect = async (selectedRole: string) => {
    if (!pendingLoginData) return;

    setShowRoleModal(false);
    setIsLoading(true);

    try {
      const { accessToken, user } = pendingLoginData;

      // If the selected role is already the active role, just proceed
      if (user.activeRole === selectedRole) {
        processLogin(accessToken, user);
        return;
      }

      // Otherwise, switch role to get a new token with the correct activeRole
      // We need to set the token in localStorage temporarily so the API interceptor can use it
      localStorage.setItem('token', accessToken);

      const response = await api.post('/auth/switch-role', { role: selectedRole });
      const { accessToken: newAccessToken } = response.data.data || response.data;

      // Update the user object with the new active role
      const updatedUser = {
        ...user,
        activeRole: selectedRole
      };

      // This will handle the final redirection
      processLogin(newAccessToken, updatedUser);
    } catch (err: unknown) {
      localStorage.removeItem('token');
      setError(err instanceof Error ? err.message : 'Failed to switch to selected role.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Remove hardcoded role: 'user' to allow backend detection
      const response = await api.post('/auth/login', formData);
      const { accessToken, user } = response.data.data || response.data;

      // If user is not verified, redirect to verification page
      if (user.isVerified === false || user.isEmailVerified === false) {
        processLogin(accessToken, user, '/auth/verify-email');
        return;
      }

      // Check if user has multiple roles
      if (user.role && Array.isArray(user.role) && user.role.length > 1) {
        setPendingLoginData({ accessToken, user });
        setShowRoleModal(true);
        setIsLoading(false);
      } else {
        processLogin(accessToken, user);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';
      const lowerError = errorMessage.toLowerCase();

      if (lowerError.includes('verify') || lowerError.includes('verification')) {
        // If we have access token in the error response (depends on backend)
        const errorResponse = (err as { response?: { data?: { data?: { accessToken: string; user: Record<string, unknown> } } } }).response;
        const errorData = errorResponse?.data?.data;
        if (errorData?.accessToken && errorData?.user) {
          processLogin(errorData.accessToken, errorData.user as { role: string[]; [key: string]: unknown }, '/auth/verify-email');
        } else {
          router.push('/auth/verify-email');
        }
        return;
      }

      setError(errorMessage || 'An error occurred during login.');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <RoleSelectionModal
        isOpen={showRoleModal}
        roles={pendingLoginData?.user?.role || []}
        onSelect={handleRoleSelect}
        onClose={() => setShowRoleModal(false)}
      />
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-900">Login to your Account</h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter Email Address"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-600"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-600 pr-10"
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-h-[48px]"
          >
            {isLoading ? <CustomLoader size={24} /> : 'Login'}
          </button>
        </form>
        <div className="text-sm text-center">
          <Link href="/auth/forgot-password" className="font-medium text-primary hover:text-primary/90">
            Forgot credentials?
          </Link>
        </div>
        <p className="text-sm text-center text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-medium text-primary hover:text-primary/90">
            Register
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
