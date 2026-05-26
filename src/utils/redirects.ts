export const getDashboardPath = (role: string): string => {
  switch (role) {
    case 'super-admin':
      return '/admin/dashboard';
    case 'hall-owner':
    case 'staff':
      return '/vendor/dashboard';
    case 'organizer':
    case 'organizer-staff':
      return '/organizer/dashboard';
    case 'user':
      return '/dashboard';
    default:
      return '/';
  }
};
