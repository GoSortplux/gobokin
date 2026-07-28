'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import axios from 'axios';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import CustomLoader from '@/components/CustomLoader';

const VerifyPaymentContent = () => {
  const [paymentStatus, setPaymentStatus] = useState<{
    status: 'loading' | 'success' | 'error' | 'retrying';
    message: string;
    attempts?: number;
  }>({
    status: 'loading',
    message: 'Preparing to verify your payment...',
    attempts: 0,
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const verifyInitiated = useRef(false);

  const verify = useCallback(async (reference: string, type: string | null, retryCount = 0) => {
    const maxRetries = 12; // 1 minute total with 5s delay
    const retryDelay = 5000; // 5 seconds

    try {
      let endpoint = '';
      const isEventPayment = (reference && reference.startsWith('REG-')) || type === 'event' || type === 'ticket';

      if (isEventPayment) {
        // Explicitly use the name 'reference' as requested for the event endpoint
        endpoint = `/events/payments/verify?reference=${reference}`;
      } else if (type === 'conversion') {
        endpoint = `/reservations/verify-conversion?paymentReference=${reference}`;
      } else if (type === 'reservation') {
        endpoint = `/reservations/verify?paymentReference=${reference}`;
      } else {
        endpoint = `/payments/verify?paymentReference=${reference}`;
      }

      const response = await api.get(endpoint);

      if (response.data.success) {
        const data = response.data.data;

        // Handle Event Payments
        if (isEventPayment) {
          const orderId = data?.orderId || data?.order?.id || data?.id;
          setPaymentStatus({ status: 'success', message: 'Payment verified! Preparing your tickets...' });
          setTimeout(() => {
            router.push(`/events/orders/${orderId}/success?reference=${reference}`);
          }, 1500);
          return;
        }

        // Determine if this is a subscription based on type or data
        if (type === 'subscription' || data?.type === 'subscription' || (data?.tier && data?.status)) {
          setPaymentStatus({ status: 'success', message: 'Subscription successful! Redirecting...' });
          setTimeout(() => {
            router.push('/payment-success?type=subscription');
          }, 1500);
          return;
        }

        // Handle bookings and reservations
        const bookingId = data?.bookingId || (data?.booking && data?.booking.bookingId);
        const reservationId = data?.reservationId || (data?.reservation && data?.reservation.reservationId);
        const finalId = bookingId || reservationId || data?._id;

        if (finalId) {
          const idParam = bookingId ? 'bookingId' : (reservationId ? 'reservationId' : 'bookingId');
          setPaymentStatus({ status: 'success', message: 'Payment verified! Redirecting to your receipt...' });
          setTimeout(() => {
            router.push(`/payment-success?${idParam}=${finalId}`);
          }, 1500);
        } else {
          setPaymentStatus({ status: 'success', message: 'Payment verified! Returning to home...' });
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } else {
        // Handle explicit success: false from backend
        if (retryCount < maxRetries) {
          setPaymentStatus({
            status: 'retrying',
            message: `Waiting for payment confirmation from provider...`,
            attempts: retryCount + 1
          });
          setTimeout(() => verify(reference, type, retryCount + 1), retryDelay);
        } else {
          const errorMsg = response.data.message || 'Payment verification failed after multiple attempts.';
          setPaymentStatus({ status: 'error', message: errorMsg });
          setTimeout(() => {
            router.push(`/payment-failed?error=${encodeURIComponent(errorMsg)}`);
          }, 4000);
        }
      }
    } catch (error: unknown) {
      console.error('Payment verification error:', error);

      let status: number | undefined;
      let errorMsg = 'An error occurred during payment verification.';

      if (axios.isAxiosError(error)) {
        status = error.response?.status;
        errorMsg = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      // Retry on 404 (Not Found) or 5xx errors, as the transaction might not be in the DB yet
      if ((status === 404 || (status !== undefined && status >= 500) || !status) && retryCount < maxRetries) {
        setPaymentStatus({
          status: 'retrying',
          message: `Confirming transaction status...`,
          attempts: retryCount + 1
        });
        setTimeout(() => verify(reference, type, retryCount + 1), retryDelay);
      } else {
        setPaymentStatus({ status: 'error', message: errorMsg });
        setTimeout(() => {
          router.push(`/payment-failed?error=${encodeURIComponent(errorMsg)}`);
        }, 4000);
      }
    }
  }, [router]);

  useEffect(() => {
    // Handle potential double-query string bug (?reference=REG-123?paymentReference=REG-123)
    const rawUrl = typeof window !== 'undefined' ? window.location.href : '';
    let extractedReference = '';

    if (rawUrl.includes('?reference=') || rawUrl.includes('&reference=')) {
        const match = rawUrl.match(/[?&]reference=([^?&]+)/);
        if (match) extractedReference = match[1];
    }

    let reference = extractedReference ||
                      searchParams.get('reference') ||
                      searchParams.get('paymentReference') ||
                      searchParams.get('transactionReference') ||
                      searchParams.get('trcref');

    // Clean reference from malformed double-query strings (?ref=X?other=Y)
    if (reference && reference.includes('?')) {
        reference = reference.split('?')[0];
    }
    if (reference && reference.includes('&')) {
        reference = reference.split('&')[0];
    }

    const type = searchParams.get('type');

    if (reference) {
      if (verifyInitiated.current) return;
      verifyInitiated.current = true;

      setPaymentStatus({ status: 'loading', message: 'Connecting to payment provider...', attempts: 0 });

      verify(reference, type);
    } else {
      setPaymentStatus({ status: 'error', message: 'No payment reference found.' });
      setTimeout(() => {
        router.push('/payment-failed?error=no_reference');
      }, 3000);
    }
  }, [searchParams, verify, router]);

  const renderIcon = () => {
    switch (paymentStatus.status) {
      case 'loading':
        return <CustomLoader size={64} />;
      case 'retrying':
        return (
          <div className="relative flex items-center justify-center">
             <CustomLoader size={64} />
             <RefreshCw className="absolute text-[#B68945] animate-spin" size={24} />
          </div>
        );
      case 'success':
        return <CheckCircle className="text-green-500 animate-bounce" size={64} />;
      case 'error':
        return <XCircle className="text-red-500" size={64} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
        <div className="mb-6 flex justify-center">
          {renderIcon()}
        </div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800 tracking-tight">
          {paymentStatus.status === 'loading' || paymentStatus.status === 'retrying' ? 'Verifying Payment' :
           paymentStatus.status === 'success' ? 'Payment Successful' : 'Verification Failed'}
        </h1>

        {paymentStatus.status === 'retrying' && (
           <p className="text-xs font-bold text-[#B68945] uppercase tracking-widest mb-4">
              Attempt {paymentStatus.attempts} of 12
           </p>
        )}

        <p className="text-gray-600 mb-8 font-medium">{paymentStatus.message}</p>

        {paymentStatus.status === 'error' && (
          <button
            onClick={() => router.push('/')}
            className="w-full bg-[#295FA7] hover:bg-[#204a8a] text-white font-bold py-3 px-4 rounded-xl transition duration-300 shadow-md"
          >
            Back to Home
          </button>
        )}
      </div>
    </div>
  );
};

const VerifyPaymentPage = () => {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
          <CustomLoader size={64} className="mx-auto" />
          <h1 className="text-2xl font-bold mt-4 text-gray-800">Loading...</h1>
        </div>
      </div>
    }>
      <VerifyPaymentContent />
    </Suspense>
  );
};

export default VerifyPaymentPage;
