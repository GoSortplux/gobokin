'use client';

import { useEffect } from 'react';
import { useVendor } from '@/context/VendorContext';
import Swal from '@/utils/sweetalert';
import { useRouter } from 'next/navigation';

const SubscriptionReminder = () => {
  const { subscription } = useVendor();
  const router = useRouter();

  useEffect(() => {
    const hasShownInSession = sessionStorage.getItem('subscription_reminder_shown');
    if (!subscription || !subscription.expiryDate || hasShownInSession) return;

    const expiryDate = new Date(subscription.expiryDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0 && diffDays <= 30) {
      sessionStorage.setItem('subscription_reminder_shown', 'true');
      Swal.fire({
        title: 'Subscription Expiring Soon',
        text: `Your ${subscription.tier.name} subscription will expire in ${diffDays} day${diffDays === 1 ? '' : 's'}. Would you like to renew it now?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Renew Now',
        cancelButtonText: 'Later',
        confirmButtonColor: '#4F46E5',
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/vendor/dashboard/settings?tab=licenses');
        }
      });
    }
  }, [subscription, router]);

  return null;
};

export default SubscriptionReminder;
